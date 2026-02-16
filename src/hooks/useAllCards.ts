import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TestCard } from '../types'

export function useAllCards(issueKeys: string[]) {
    const [cardsByIssue, setCardsByIssue] = useState<Record<string, TestCard[]>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const channelRef = useRef<any>(null)
    const isRefreshingRef = useRef(false)
    const modalOpenCountRef = useRef(0)

    // Estabilitzar issueKeys
    const issueKeysString = useMemo(() => issueKeys.join(','), [issueKeys])

    const setModalOpen = useCallback((open: boolean) => {
        modalOpenCountRef.current += open ? 1 : -1
    }, [])

    const isBlockingRefresh = () => {
        return modalOpenCountRef.current > 0
    }

    const loadAllCards = useCallback(async (silent = false) => {
        if (isRefreshingRef.current) return

        // 🛑 CANVI CRÍTIC: Eliminem "silent &&".
        // Si hi ha un modal o l'usuari escriu, BLOQUEGEM SEMPRE,
        // fins i tot si és una càrrega inicial o forçada.
        if (isBlockingRefresh()) {
            console.log('🛡️ Refresc bloquejat absolutament (Modal o Input actiu)')
            // Si era una càrrega "no silenciosa" (amb spinner), hem de treure el spinner
            if (!silent) setLoading(false);
            return
        }

        try {
            isRefreshingRef.current = true

            if (!silent) setLoading(true)

            const { data, error } = await supabase
                .from('test_cards')
                .select('*')
                .in('jira_issue_key', issueKeys)
                .order('created_at', { ascending: true })

            if (error) throw error

            // 🛑 DOBLE CHECK: Per si l'has obert MENTRE carregava
            if (isBlockingRefresh()) {
                console.log('🛡️ Dades descartades al vol (Modal o Input actiu durant la càrrega)')
                return
            }

            const grouped: Record<string, TestCard[]> = {}
            issueKeys.forEach(key => { grouped[key] = [] })

            data?.forEach(card => {
                if (grouped[card.jira_issue_key]) {
                    grouped[card.jira_issue_key].push(card)
                }
            })

            setCardsByIssue(grouped)
            setError(null)

        } catch (err) {
            console.error('Error loading cards:', err)
            if (!silent) setError(err instanceof Error ? err.message : 'Error')
        } finally {
            if (!silent) setLoading(false)
            isRefreshingRef.current = false
        }
    }, [issueKeysString])

    // --- EFECTE PRINCIPAL ---
    useEffect(() => {
        // Si no hi ha keys, no cal fer res
        if (issueKeys.length === 0) {
            setLoading(false)
            return
        }

        // Intentem carregar. Si hi ha modal, loadAllCards ho bloquejarà i traurà el loading.
        loadAllCards(false)

        // Interval
        intervalRef.current = setInterval(() => {
            loadAllCards(true)
        }, 5000)

        // Realtime
        const channelName = `all_test_cards_${Date.now()}`
        if (channelRef.current) supabase.removeChannel(channelRef.current)

        channelRef.current = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'test_cards' }, () => {
                loadAllCards(true)
            })
            .subscribe()

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (channelRef.current) supabase.removeChannel(channelRef.current)
        }
    }, [issueKeysString, loadAllCards])

    // --- ACCIONS ---
    async function createCard(cardData: any) {
        const { data, error } = await supabase.from('test_cards').insert([cardData]).select().single()
        if (error) throw error
        return data
    }

    async function updateCard(id: number, updates: any) {
        const { data, error } = await supabase.from('test_cards').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    }

    async function deleteCard(id: number) {
        const { error } = await supabase.from('test_cards').delete().eq('id', id)
        if (error) throw error
        await loadAllCards(true)
    }

    async function deleteImage(url: string) {
        // Extract path from public URL: ...card-images/uploads/filename.png
        const match = url.match(/card-images\/(.+)$/)
        if (!match) return
        const path = match[1]
        const { error } = await supabase.storage.from('card-images').remove([path])
        if (error) console.error('Error deleting image:', error)
    }

    return {
        cardsByIssue,
        loading,
        error,
        createCard,
        updateCard,
        deleteCard,
        deleteImage,
        setModalOpen,
        refresh: () => loadAllCards(false)
    }
}