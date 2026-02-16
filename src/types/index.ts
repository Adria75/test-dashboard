export type CardType = 'error' | 'dubte' | 'proposta' | 'ux'
export type CardStatus = 'pendent' | 'errors' | 'tancat' | 'descartat'

export interface TestCard {
  id: number
  jira_issue_key: string
  ref: string
  type: CardType
  summary: string
  detail: string | null
  status: CardStatus
  tester: string | null
  created_at: string
  updated_at: string
}

export interface JiraIssue {
  key: string
  summary: string
  status: string
  assignee: string | null
}

export interface Column {
  id: CardStatus
  label: string
  className: string
}
