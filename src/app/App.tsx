import { useEffect } from 'react'
import { unreadCount } from './domain'
import { Layout } from './Layout'
import { Agenda } from './pages/Agenda'
import { Contents, Materials } from './pages/Contents'
import { FamilyHome } from './pages/FamilyHome'
import { Login } from './pages/Login'
import { Messages } from './pages/Messages'
import { ChildPage, FollowUpList, GrowthPage, Reports, Users, VaccinesPage } from './pages/Modules'
import { MyProgram } from './pages/MyProgram'
import { PatientDetail } from './pages/PatientDetail'
import { Patients } from './pages/Patients'
import { ProgramDetail, Programs } from './pages/Programs'
import { NewSale, Sales } from './pages/Sales'
import { StaffHome } from './pages/StaffHome'
import { can, StoreProvider, useStore } from './store'
import type { Page } from './types'
import './app.css'

const PAGES: Record<Page, () => React.JSX.Element | null> = {
  home: StaffHome,
  patients: Patients,
  patient: PatientDetail,
  agenda: Agenda,
  programs: Programs,
  program: ProgramDetail,
  followup: FollowUpList,
  contents: Contents,
  growth: GrowthPage,
  vaccines: VaccinesPage,
  messages: Messages,
  sales: Sales,
  'new-sale': NewSale,
  reports: Reports,
  users: Users,
  child: ChildPage,
  'my-program': MyProgram,
  materials: Materials,
}

function Shell() {
  const { user, route, go, state, childId, toastText } = useStore()

  // Página fora do perfil (ex.: sessão antiga) volta para o início.
  const allowed = user ? can(user.role, route.page) : false
  useEffect(() => {
    if (user && !allowed) go('home')
  }, [user, allowed, go])

  useEffect(() => {
    document.title = user ? 'Crescer' : 'Crescer — Entrar'
  }, [user])

  if (!user) return <><Login />{toastText && <div className="toast">{toastText}</div>}</>

  const Current = user.role === 'parent' && route.page === 'home' ? FamilyHome : PAGES[allowed ? route.page : 'home']
  return (
    <>
      <Layout unread={unreadCount(state, user, childId)}>
        <Current key={`${route.page}:${route.id ?? ''}:${childId ?? ''}`} />
      </Layout>
      {toastText && <div className="toast" role="status">{toastText}</div>}
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
