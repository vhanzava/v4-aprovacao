import { cookies } from 'next/headers'
import { getRoleFromEmail } from '@/lib/auth/roles'
import type { Role } from '@/lib/types'

export async function getSession(): Promise<{ email: string; role: Role } | null> {
  const cookieStore = await cookies()
  const email = cookieStore.get('v4_email')?.value

  if (!email) return null

  const role = getRoleFromEmail(email)
  if (!role) return null

  return { email, role }
}
