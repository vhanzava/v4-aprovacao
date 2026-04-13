export type Role = 'admin' | 'team' | 'viewer'

export type ClientStatus = 'ativo' | 'inativo'

export type PieceFormat = 'imagem_unica' | 'carrossel' | 'video' | 'banner' | 'artigo' | 'blog'

export type PiecePurpose = 'postagem' | 'anuncio'

export type PieceStatus = 'pendente' | 'aprovado' | 'reprovado' | 'cancelada'

export type PieceStage = 1 | 2 | 3

export interface UserRole {
  id: string
  email: string
  role: Role
  created_at: string
}

export interface Client {
  id: string
  name: string
  status: ClientStatus
  magic_token: string
  created_by: string | null
  created_at: string
}

export interface Piece {
  id: string
  client_id: string
  created_by: string | null
  created_by_email?: string | null
  title: string
  format: PieceFormat | null
  purpose: PiecePurpose | null
  status: PieceStatus
  stage: PieceStage
  copy: string | null
  post_caption: string | null
  drive_url: string | null
  post_date: string | null
  order_index: number
  theme_date: string | null
  theme_description: string | null
  theme_headline: string | null
  calendar_id: string | null
  created_at: string
  // joined
  client?: Client
  assets?: PieceAsset[]
  approval?: Approval
}

export interface PieceAsset {
  id: string
  piece_id: string
  url: string
  storage_path: string | null
  order_index: number
  created_at: string
}

export interface Approval {
  id: string
  piece_id: string
  status: 'aprovado' | 'reprovado'
  step1_answers: string[] | null
  step2_answers: string[] | null
  step2_open: string | null
  step3_text: string | null
  decided_at: string
}

// Reproval flow types
export interface ReprovacaoStep {
  id: string
  label: string
  type: 'multiple_choice' | 'open' | 'date_picker'
  options?: ReprovacaoOption[]
  placeholder?: string
  conditional_on?: string // step1 answer that triggers this step2 group
}

export interface ReprovacaoOption {
  value: string
  label: string
  opens_field?: boolean // "Outro" opens inline text
}

// Dashboard stats
export interface DashboardStats {
  total_pieces: number
  pendentes: number
  aprovados: number
  reprovados: number
  approval_rate: number
  avg_response_hours: number | null
  refacoes: number
}

export interface ClientStats extends DashboardStats {
  client: Client
}
