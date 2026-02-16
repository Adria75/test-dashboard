export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      test_cards: {
        Row: {
          id: number
          jira_issue_key: string
          ref: string
          type: 'error' | 'dubte' | 'proposta' | 'ux'
          summary: string
          detail: string | null
          status: 'pendent' | 'errors' | 'tancat' | 'descartat'
          tester: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          jira_issue_key: string
          ref: string
          type: 'error' | 'dubte' | 'proposta' | 'ux'
          summary: string
          detail?: string | null
          status: 'pendent' | 'errors' | 'tancat' | 'descartat'
          tester?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          jira_issue_key?: string
          ref?: string
          type?: 'error' | 'dubte' | 'proposta' | 'ux'
          summary?: string
          detail?: string | null
          status?: 'pendent' | 'errors' | 'tancat' | 'descartat'
          tester?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
