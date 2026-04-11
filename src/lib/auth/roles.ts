import type { Role } from '@/lib/types'

export const ADMIN_EMAILS = ['vinicius.hanzava@v4company.com']

export const TEAM_EMAILS = [
  'caina.rossini@v4company.com',
  'lara.davila@v4company.com',
  'maycon.bodini@v4company.com',
  'gabriel.prates@v4company.com',
  'viktoria.powarchuk@v4company.com',
  'cristianomachado@v4company.com',
  'vitor.ricacheski@v4company.com',
]

export const V4_DOMAIN = 'v4company.com'

export function getRoleFromEmail(email: string): Role | null {
  if (ADMIN_EMAILS.includes(email)) return 'admin'
  if (TEAM_EMAILS.includes(email)) return 'team'
  if (email.endsWith(`@${V4_DOMAIN}`)) return 'viewer'
  return null
}

export function canCreatePieces(role: Role | null): boolean {
  return role === 'admin' || role === 'team'
}

export function canManageClients(role: Role | null): boolean {
  return role === 'admin' || role === 'team'
}

export function isAdmin(role: Role | null): boolean {
  return role === 'admin'
}

export function hasTeamAccess(role: Role | null): boolean {
  return role === 'admin' || role === 'team' || role === 'viewer'
}
