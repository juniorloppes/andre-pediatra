import { useState, type ReactNode } from 'react'
import {
  BookOpen, CalendarDays, ChartColumn, ChartLine, ClipboardList, House, Layers, LogOut, Menu, MessageCircle,
  RotateCcw, ShoppingBag, Sprout, Syringe, UserCog, Users, Baby, Library, X,
} from 'lucide-react'
import { NAV, ROLE_LABEL, useStore } from './store'
import type { Page, Role } from './types'
import { Avatar, Logo } from './ui'

const ITEMS: Record<Page, { label: string; icon: ReactNode; parentLabel?: string }> = {
  home: { label: 'Início', icon: <House /> },
  patients: { label: 'Pacientes', icon: <Users /> },
  patient: { label: 'Paciente', icon: <Users /> },
  agenda: { label: 'Agenda', icon: <CalendarDays /> },
  programs: { label: 'Programas', icon: <Layers /> },
  program: { label: 'Programa', icon: <Layers /> },
  followup: { label: 'Acompanhamento', icon: <ClipboardList /> },
  contents: { label: 'Conteúdos', icon: <Library /> },
  growth: { label: 'Crescimento', icon: <ChartLine /> },
  vaccines: { label: 'Vacinação', icon: <Syringe />, parentLabel: 'Vacinas' },
  messages: { label: 'Mensagens', icon: <MessageCircle /> },
  sales: { label: 'Vendas', icon: <ShoppingBag /> },
  'new-sale': { label: 'Nova venda', icon: <ShoppingBag /> },
  reports: { label: 'Relatórios', icon: <ChartColumn /> },
  users: { label: 'Usuários', icon: <UserCog /> },
  child: { label: 'Meu filho', icon: <Baby /> },
  'my-program': { label: 'Meu programa', icon: <Sprout /> },
  materials: { label: 'Materiais', icon: <BookOpen /> },
}

/** Página do menu que fica destacada para páginas internas. */
const PARENT_PAGE: Partial<Record<Page, Page>> = { patient: 'patients', program: 'programs', 'new-sale': 'sales' }

export const pageLabel = (page: Page, role: Role) => (role === 'parent' && ITEMS[page].parentLabel) || ITEMS[page].label

export function Layout({ children, unread }: { children: ReactNode; unread: number }) {
  const { user, route, go, logout, reset, state, childId, setChildId } = useStore()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const active = PARENT_PAGE[route.page] ?? route.page
  const kids = state.patients.filter((p) => user.patientIds?.includes(p.id))

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <button className="brand-btn" onClick={() => go('home')}><Logo /></button>
          <button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <nav className="nav">
          {NAV[user.role].map((page) => (
            <button key={page} className={active === page ? 'active' : ''} onClick={() => { go(page); setOpen(false) }}>
              {ITEMS[page].icon}
              <span>{pageLabel(page, user.role)}</span>
              {page === 'messages' && unread > 0 && <b className="nav-count">{unread}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={user.name} size={32} />
            <span>
              <strong>{user.name}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
          </div>
          <button className="link-btn" onClick={reset} title="Restaura os dados de exemplo"><RotateCcw size={14} /> Restaurar demonstração</button>
          <button className="link-btn" onClick={logout}><LogOut size={14} /> Sair</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main-col">
        <div className="mobile-bar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
          <Logo />
          {user.role === 'parent' && kids.length > 1 ? (
            <select value={childId} onChange={(e) => setChildId(e.target.value)} aria-label="Criança">
              {kids.map((k) => <option key={k.id} value={k.id}>{k.name.split(' ')[0]}</option>)}
            </select>
          ) : <span />}
        </div>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
