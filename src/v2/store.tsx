import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createSeed, STATE_VERSION } from './seed'
import type { AppState, Page, Role, Route, User } from './types'

const STATE_KEY = 'crescer-v2-data'
const SESSION_KEY = 'crescer-v2-session'

/** Dados salvos são da versão atual? (lido uma vez, antes de qualquer gravação) */
const storedDataIsCurrent = (() => {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as AppState).version === STATE_VERSION : true
  } catch {
    return false
  }
})()

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.version === STATE_VERSION) return parsed
    }
  } catch { /* dados corrompidos ou storage indisponível: volta para a demonstração */ }
  return createSeed()
}

interface Session { userId: string; route: Route; patientId?: string }

const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const session = raw ? JSON.parse(raw) as Session : null
    // Dados de uma versão anterior foram substituídos: a rota salva pode apontar para ids que não
    // existem mais (ex.: programas da V2). Mantém o login, mas recomeça pelo Início.
    return session && !storedDataIsCurrent ? { ...session, route: { page: 'home' } } : session
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Permissões por perfil                                               */
/* ------------------------------------------------------------------ */

export const ROLE_LABEL: Record<Role, string> = {
  doctor: 'Médico · proprietário',
  secretary: 'Secretaria',
  admin: 'Administrador',
  parent: 'Responsável',
}

/** Rótulo usado para identificar quem respondeu uma mensagem. */
export const ROLE_REPLY_LABEL: Record<Role, string> = {
  doctor: 'Médico',
  secretary: 'Secretaria',
  admin: 'Administrador',
  parent: 'Responsável',
}

/*
 * Dr. André é médico E proprietário: acesso total (clínico, comercial, financeiro e usuários).
 * Secretaria: operação (famílias, agenda, vendas, pagamentos, programas, mensagens) — sem decisões clínicas.
 */
export const NAV: Record<Role, Page[]> = {
  doctor: ['home', 'patients', 'agenda', 'programs', 'followup', 'contents', 'growth', 'vaccines', 'messages', 'sales', 'reports', 'users'],
  secretary: ['home', 'patients', 'agenda', 'sales', 'programs', 'followup', 'vaccines', 'messages', 'reports'],
  admin: ['home', 'patients', 'agenda', 'sales', 'programs', 'followup', 'contents', 'growth', 'vaccines', 'messages', 'reports', 'users'],
  parent: ['home', 'child', 'my-program', 'growth', 'vaccines', 'messages', 'materials', 'agenda'],
}

/** Páginas acessíveis além das que aparecem no menu. */
const EXTRA: Record<Role, Page[]> = {
  doctor: ['patient', 'program', 'new-sale'],
  secretary: ['patient', 'program', 'new-sale'],
  admin: ['patient', 'program', 'new-sale'],
  parent: [],
}

export const can = (role: Role, page: Page) => NAV[role].includes(page) || EXTRA[role].includes(page)

/** Quem registra conteúdo clínico do acompanhamento e edita programas/conteúdos. */
export const isClinical = (role: Role) => role === 'doctor' || role === 'admin'
export const isStaff = (role: Role) => role !== 'parent'

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

interface Store {
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  user: User | null
  route: Route
  go: (page: Page, id?: string, tab?: string) => void
  login: (userId: string) => void
  logout: () => void
  reset: () => void
  /** Criança selecionada no portal da família */
  childId?: string
  setChildId: (id: string) => void
  toast: (text: string) => void
  toastText: string | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [session, setSession] = useState<Session | null>(loadSession)
  const [toastText, setToastText] = useState<string | null>(null)

  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)) } catch { /* ignora */ }
  }, [state])

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
    } catch { /* ignora */ }
  }, [session])

  useEffect(() => {
    if (!toastText) return
    const t = setTimeout(() => setToastText(null), 2800)
    return () => clearTimeout(t)
  }, [toastText])

  const user = useMemo(() => state.users.find((u) => u.id === session?.userId && u.active) ?? null, [state.users, session?.userId])

  const go = useCallback((page: Page, id?: string, tab?: string) => {
    setSession((s) => (s ? { ...s, route: { page, id, tab } } : s))
    window.scrollTo({ top: 0 })
  }, [])

  const value: Store = {
    state,
    update: setState,
    user,
    route: session?.route ?? { page: 'home' },
    go,
    login: (userId) => {
      const u = state.users.find((x) => x.id === userId)
      setSession({ userId, route: { page: 'home' }, patientId: u?.patientIds?.[0] })
    },
    logout: () => setSession(null),
    reset: () => {
      setState(createSeed())
      setToastText('Dados de demonstração restaurados')
    },
    childId: session?.patientId ?? user?.patientIds?.[0],
    setChildId: (id) => setSession((s) => (s ? { ...s, patientId: id } : s)),
    toast: setToastText,
    toastText,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}
