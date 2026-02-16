import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TestCard, CardStatus } from '../types'

export function useCards(issueKey: string) {
  const [cards, setCards] = useState<TestCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCards()

    // Auto-refresh cada 5 segons NOMÉS si no hi ha modal obert
    const interval = setInterval(() => {
      // Comprovar si hi ha algun modal obert
      const hasModalOpen = document.querySelector('.modal-overlay') !== null;

      if (!hasModalOpen) {
        console.log('🔄 Auto-refresh...')
        loadCards()
      } else {
        console.log('⏸️ Modal obert, skip refresh')
      }
    }, 5000)

    // Subscriure's a canvis en temps real
    const channel = supabase
        .channel('test_cards_changes')
        .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'test_cards',
              filter: `jira_issue_key=eq.${issueKey}`
            },
            (payload) => {
              console.log('🔥 Realtime change received!', payload)
              loadCards() // Recarregar cards quan hi hagi canvis
            }
        )
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime activat per issue:', issueKey)
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('❌ Realtime error - usant polling mode')
          }
        })

    return () => {
      console.log('🔌 Unsubscribing from realtime')
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [issueKey])

  async function loadCards() {
    try {
      setLoading(true)
      const { data, error } = await supabase
          .from('test_cards')
          .select('*')
          .eq('jira_issue_key', issueKey)
          .order('created_at', { ascending: true })

      if (error) throw error
      setCards(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error carregant cards')
      console.error('Error loading cards:', err)
    } finally {
      setLoading(false)
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

      // Refrescar immediatament després de crear
      await loadCards()

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

      // Refrescar immediatament després d'actualitzar
      await loadCards()

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

      // Refrescar immediatament després d'actualitzar
      await loadCards()
    } catch (err) {
      console.error('Error deleting card:', err)
      throw err
    }
  }

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    refresh: loadCards
  }
}