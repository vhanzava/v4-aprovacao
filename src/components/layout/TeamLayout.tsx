'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

function LayoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
  { href: '/clientes', label: 'Clientes', icon: <UsersIcon /> },
  { href: '/pecas/nova', label: 'Nova peça', icon: <PlusIcon /> },
]

interface TeamLayoutProps {
  children: React.ReactNode
  role: Role
  email: string
}

export function TeamLayout({ children, role, email }: TeamLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top nav */}
      <header className="bg-[#141414] border-b border-[#2E2E2E] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-base tracking-tight">
              <span className="text-[#E8192C]">V4</span>
              <span className="text-[#F5F5F5] font-light ml-1">Aprovações</span>
            </span>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-[#2A2A2A] text-[#F5F5F5]'
                      : 'text-[#888888] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <span className="hidden sm:block text-[10px] font-medium text-[#E8192C] bg-[#E8192C]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            )}
            <span className="hidden sm:block text-[#555555] text-xs truncate max-w-[160px]">{email}</span>
            <button
              onClick={handleLogout}
              className="text-[#555555] hover:text-[#F5F5F5] transition-colors p-1.5 rounded-md hover:bg-[#1E1E1E]"
              title="Sair"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t border-[#2E2E2E]">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-[#E8192C]'
                  : 'text-[#555555]'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
