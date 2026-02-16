import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { TestCard } from '../types'

export function useAllCards(issueKeys: string[]) {
    const [cardsByIssue, setCardsByIssue] = useState<Record<string, TestCard[]>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const channelRef = useRef<any>(null)
    const isRefreshingRef = useRef(false) // Evitar múltiples refreshes simultanis

    const canRefresh = () => {
        // No refrescar si ja està refrescant
        if (isRefreshingRef.current) {
            console.log('⏸️ Ja està refrescant, skip')
            return false
        }

        // No refrescar si hi ha modal obert
        const hasModalOpen = document.querySelector('.modal-overlay') !== null
        if (hasModalOpen) {
            console.log('⏸️ Modal obert, skip refresh')
            return false
        }

        return true
    }

    useEffect(() => {
        if (issueKeys.length === 0) {
            setLoading(false)
            return
        }

        loadAllCards()

        // Netejar interval anterior si existeix
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // Auto-refresh cada 5 segons NOMÉS si no hi ha modal obert
        intervalRef.current = setInterval(() => {
            if (canRefresh()) {
                console.log('🔄 Auto-refresh...')
                loadAllCards()
            }
        }, 5000)

        // Netejar channel anterior si existeix
        if (channelRef.current) {
            channelRef.current.unsubscribe()
        }

        // Subscriure's a canvis en temps real (tots els issues)
        channelRef.current = supabase
            .channel(`all_test_cards_${Date.now()}`) // ID únic per evitar conflictes
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'test_cards'
                },
                (payload) => {
                    console.log('🔥 Realtime change received!', payload)

                    if (canRefresh()) {
                        loadAllCards()
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime activat per totes les issues')
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('❌ Realtime error - usant polling mode')
                }
            })

        return () => {
            console.log('🔌 Cleanup: unsubscribing and clearing interval')
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            if (channelRef.current) {
                channelRef.current.unsubscribe()
                channelRef.current = null
            }
        }
    }, [issueKeys.join(',')])

    async function loadAllCards() {
        // Evitar múltiples refreshes simultanis
        if (isRefreshingRef.current) {
            console.log('⏸️ Ja està refrescant, skip')
            return
        }

        // Check modal AQUÍ també per si de cas
        const hasModalOpen = document.querySelector('.modal-overlay') !== null
        if (hasModalOpen) {
            console.log('❌ BLOCAT: Modal obert dins loadAllCards!')
            console.trace('Stack trace de qui ha cridat loadAllCards:')
            return
        }

        console.log('✅ Executant loadAllCards...')
        isRefreshingRef.current = true

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('test_cards')
                .select('*')
                .in('jira_issue_key', issueKeys)
                .order('created_at', { ascending: true })

            if (error) throw error

            // Agrupar per issue
            const grouped: Record<string, TestCard[]> = {}
            issueKeys.forEach(key => { grouped[key] = [] })

            data?.forEach(card => {
                if (grouped[card.jira_issue_key]) {
                    grouped[card.jira_issue_key].push(card)
                }
            })

            console.log('📦 Dades actualitzades')
            setCardsByIssue(grouped)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error carregant cards')
            console.error('Error loading cards:', err)
        } finally {
            setLoading(false)
            isRefreshingRef.current = false
        }
    }

    async function createCard(cardData: Omit<TestCard, 'id' | 'created_at' | 'updated_at'>) {
        try {
            const { data, error } = await supabase
                .from('test_cards')
                .insert([cardData])
                .select()
                .single()

            if (error) throw error

            // NO refrescar aquí - el realtime ho farà quan tanquis el modal
            console.log('✅ Card creada, esperant realtime...')

            return data
        } catch (err) {
            console.error('Error creating card:', err)
            throw err
        }
    }

    async function updateCard(id: number, updates: Partial<TestCard>) {
        try {
            const { data, error } = await supabase
                .from('test_cards')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            // NO refrescar aquí - el realtime ho farà quan tanquis el modal
            console.log('✅ Card actualitzada, esperant realtime...')

            return data
        } catch (err) {
            console.error('Error updating card:', err)
            throw err
        }
    }

    async function deleteCard(id: number) {
        try {
            const { error } = await supabase
                .from('test_cards')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Refrescar immediatament després d'eliminar (no hi ha modal obert)
            await loadAllCards()
        } catch (err) {
            console.error('Error deleting card:', err)
            throw err
        }
    }

    return {
        cardsByIssue,
        loading,
        error,
        createCard,
        updateCard,
        deleteCard,
        refresh: loadAllCards
    }
}