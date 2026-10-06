import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { pendingVaccines } from '../domain'
import { GrowthPanel } from '../panels/GrowthPanel'
import { VaccinePanel } from '../panels/VaccinePanel'
import { isClinical, ROLE_LABEL, useStore } from '../store'
import type { Patient, Role, User, VaccineDose } from '../types'
import { Badge, Card, Empty, Field, Modal, PageHeader, PatientName, StatusBadge, Tabs } from '../ui'
import { activeEnrollment, addMonths, ageLabel, finalPrice, fmtDate, followUpSituation, monthShort, money, TODAY, uid } from '../utils'
import { useChild } from './FamilyHome'

/* ------------------------------------------------------------------ */
/* Seletor de paciente (equipe) / criança (família)                    */
/* ------------------------------------------------------------------ */

function usePatientPicker(): [Patient | undefined, ReactNode] {
  const { state, user, route, go } = useStore()
  const child = useChild()
  if (user?.role === 'parent') return [child, null]
  const sorted = [...state.patients].sort((a, b) => a.name.localeCompare(b.name))
  const patient = state.patients.find((p) => p.id === route.id) ?? sorted[0]
  const picker = (
    <select className="patient-select" value={patient?.id} onChange={(e) => go(route.page, e.target.value)} aria-label="Paciente">
      {sorted.map((p) => <option key={p.id} value={p.id}>{p.name} — {ageLabel(p.birthDate, undefined, true)}</option>)}
    </select>
  )
  return [patient, picker]
}

export function GrowthPage() {
  const { user } = useStore()
  const [patient, picker] = usePatientPicker()
  if (!patient || !user) return <Empty title="Nenhum paciente" />
  return (
    <>
      <PageHeader title="Crescimento" subtitle={user.role === 'parent' ? 'Acompanhe a evolução da sua criança.' : 'Peso, altura, perímetro cefálico e IMC nas curvas de referência.'} actions={picker} />
      <GrowthPanel patient={patient} canEdit={isClinical(user.role)} />
    </>
  )
}

export function VaccinesPage() {
  const { user } = useStore()
  const [patient, picker] = usePatientPicker()
  const [tab, setTab] = useState<'patient' | 'catalog'>('patient')
  if (!patient || !user) return <Empty title="Nenhum paciente" />
  const staff = user.role !== 'parent'
  return (
    <>
      <PageHeader title="Vacinação" subtitle="Baseado no Calendário de Vacinação da Sociedade Brasileira de Pediatria 2025/2026." actions={staff && tab === 'patient' ? picker : undefined} />
      {staff && <Tabs value={tab} onChange={setTab} items={[{ id: 'patient', label: 'Por paciente' }, { id: 'catalog', label: 'Vacinas cadastradas' }]} />}
      <div className="tab-body">
        {tab === 'patient' || !staff ? <VaccinePanel patient={patient} canEdit={staff} /> : <VaccineCatalog />}
      </div>
    </>
  )
}

function VaccineCatalog() {
  const { state, update, toast, user } = useStore()
  const [editing, setEditing] = useState<VaccineDose | 'new' | null>(null)
  const canEdit = user?.role === 'admin' || user?.role === 'doctor'
  const remove = (d: VaccineDose) => {
    if (state.vaccineRecords.some((r) => r.doseId === d.id)) return toast('Há registros para esta dose — não é possível excluir.')
    if (!confirm(`Excluir ${d.vaccine} (${d.dose}) do calendário?`)) return
    update((s) => ({ ...s, vaccineCatalog: s.vaccineCatalog.filter((x) => x.id !== d.id) }))
  }
  const list = [...state.vaccineCatalog].sort((a, b) => a.ageMonths - b.ageMonths || a.vaccine.localeCompare(b.vaccine))
  return (
    <Card title={`Calendário cadastrado (${list.length} doses)`} action={canEdit && <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={14} /> Cadastrar vacina</button>}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Idade</th><th>Vacina</th><th>Dose</th><th>Rede</th><th>Observação</th>{canEdit && <th />}</tr></thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>{d.ageMonths === 0 ? 'Ao nascer' : `${d.ageMonths} meses`}</td>
                <td><strong>{d.vaccine}</strong></td>
                <td>{d.dose}</td>
                <td>{d.network === 'Particular' ? <Badge tone="lilac">Particular</Badge> : <Badge tone="green">SUS + particular</Badge>}</td>
                <td className="muted small">{d.notes ?? '—'}</td>
                {canEdit && <td className="row-actions">
                  <button className="icon-btn" aria-label="Editar" onClick={() => setEditing(d)}><Pencil size={15} /></button>
                  <button className="icon-btn" aria-label="Excluir" onClick={() => remove(d)}><Trash2 size={15} /></button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <DoseForm dose={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function DoseForm({ dose, onClose }: { dose?: VaccineDose; onClose: () => void }) {
  const { update, toast } = useStore()
  const [f, setF] = useState({ vaccine: dose?.vaccine ?? '', dose: dose?.dose ?? '1ª dose', ageMonths: String(dose?.ageMonths ?? 0), network: dose?.network ?? 'SUS + particular', notes: dose?.notes ?? '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.vaccine.trim()) return
    const data: VaccineDose = { id: dose?.id ?? `v-${uid()}`, vaccine: f.vaccine.trim(), dose: f.dose, ageMonths: Number(f.ageMonths) || 0, network: f.network as VaccineDose['network'], notes: f.notes || undefined }
    update((s) => ({ ...s, vaccineCatalog: dose ? s.vaccineCatalog.map((d) => (d.id === dose.id ? data : d)) : [...s.vaccineCatalog, data] }))
    toast(dose ? 'Vacina atualizada' : 'Vacina cadastrada')
    onClose()
  }
  return (
    <Modal title={dose ? 'Editar vacina' : 'Cadastrar vacina'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="dose-form">Salvar</button></>}>
      <form id="dose-form" className="form-grid" onSubmit={submit}>
        <Field label="Vacina" full><input value={f.vaccine} onChange={set('vaccine')} autoFocus /></Field>
        <Field label="Dose"><input value={f.dose} onChange={set('dose')} /></Field>
        <Field label="Idade recomendada (meses)"><input type="number" min={0} value={f.ageMonths} onChange={set('ageMonths')} /></Field>
        <Field label="Rede"><select value={f.network} onChange={set('network')}><option>SUS + particular</option><option>Particular</option></select></Field>
        <Field label="Observação"><input value={f.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Acompanhamento — visão geral da equipe                              */
/* ------------------------------------------------------------------ */

export function FollowUpList() {
  const { state, go } = useStore()
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const rows = useMemo(() => state.patients
    .map((p) => ({ p, enr: activeEnrollment(state, p.id) }))
    .filter((x) => x.enr)
    .map(({ p, enr }) => ({ p, program: enr!.program, sit: followUpSituation(state, p, enr!.program) }))
    .filter((r) => filter === 'all' || r.sit.status !== 'Em dia' || r.sit.openPendencies > 0)
    .sort((a, b) => (a.sit.nextDue ?? '').localeCompare(b.sit.nextDue ?? '')), [state, filter])

  return (
    <>
      <PageHeader title="Acompanhamento" subtitle="Etapas, encontros periódicos (a cada 45 dias no 0–1 ano), evolução, orientações e pendências." />
      <Card>
        <div className="toolbar">
          <Tabs value={filter} onChange={setFilter} items={[{ id: 'all', label: 'Todos em programa' }, { id: 'attention', label: 'Pedem atenção' }]} />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Paciente</th><th>Programa</th><th>Passo atual</th><th>Encontros</th><th>Próximo encontro até</th><th>Pendências</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {rows.map(({ p, program, sit }) => (
                  <tr key={p.id} className="clickable" onClick={() => go('patient', p.id, 'followup')}>
                    <td><PatientName patient={p} sub={ageLabel(p.birthDate, undefined, true)} /></td>
                    <td>{program.ageLabel}</td>
                    <td>{sit.step ? `${sit.step.n} — ${sit.step.title}` : '—'}</td>
                    <td>{sit.records.length}/{program.steps.length}{sit.missing.length > 0 && <small className="block text-red">{sit.missing.length} sem registro</small>}</td>
                    <td>{sit.currentDone ? <span className="muted">Passo registrado</span> : fmtDate(sit.nextDue)}</td>
                    <td>{sit.openPendencies || '—'}</td>
                    <td><StatusBadge status={sit.status} /></td>
                    <td><ArrowRight size={16} className="muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Nenhum acompanhamento pendente" />}
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Meu filho (família)                                                 */
/* ------------------------------------------------------------------ */

export function ChildPage() {
  const { state, go } = useStore()
  const child = useChild()
  if (!child) return null
  const enr = activeEnrollment(state, child.id)
  const sit = enr && followUpSituation(state, child, enr.program)
  const last = state.growth.filter((g) => g.patientId === child.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const vacc = pendingVaccines(state, child)
  return (
    <>
      <PageHeader title={child.name} subtitle={`${ageLabel(child.birthDate)} · nascid${child.sex === 'F' ? 'a' : 'o'} em ${fmtDate(child.birthDate)}`} />
      <div className="grid-3">
        <Card title="Dados">
          <dl className="dl">
            <dt>Responsável</dt><dd>{child.guardian}</dd>
            <dt>Telefone</dt><dd>{child.phone}</dd>
            <dt>E-mail</dt><dd>{child.email}</dd>
          </dl>
          <p className="muted small">Para alterar dados, fale com a secretaria.</p>
        </Card>
        <Card title="Medidas" action={<button className="link-btn" onClick={() => go('growth')}>Ver curvas</button>}>
          {last ? (
            <dl className="dl">
              <dt>Peso</dt><dd>{last.weight.toLocaleString('pt-BR')} kg</dd>
              <dt>Altura</dt><dd>{last.height.toLocaleString('pt-BR')} cm</dd>
              <dt>Perímetro cefálico</dt><dd>{last.head.toLocaleString('pt-BR')} cm</dd>
              <dt>Medido em</dt><dd>{fmtDate(last.date)}</dd>
            </dl>
          ) : <Empty title="Sem medições" />}
        </Card>
        <Card title="Vacinas" action={<button className="link-btn" onClick={() => go('vaccines')}>Ver calendário</button>}>
          {vacc.length ? (
            <ul className="simple-list">{vacc.slice(0, 4).map((v) => <li key={v.dose.id}><span><strong>{v.dose.vaccine}</strong><small className="block muted">{v.dose.dose} · {fmtDate(v.due)}</small></span><StatusBadge status={v.status} /></li>)}</ul>
          ) : <Empty title="Vacinas em dia" />}
        </Card>
        {enr && sit && (
          <Card title="Encontros do programa" className="span-3">
            {sit.records.length ? (
              <ul className="timeline">
                {[...sit.records].sort((a, b) => b.step - a.step).map((r) => (
                  <li key={r.id}>
                    <b>Passo {r.step} · {fmtDate(r.date)}</b>
                    <p className="pre">{r.orientations}</p>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Nenhum encontro registrado ainda" />}
          </Card>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Relatórios                                                          */
/* ------------------------------------------------------------------ */

export function Reports() {
  const { state, user } = useStore()
  const showMoney = user?.role !== 'doctor'
  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(TODAY.slice(0, 7) + '-01', i - 11))
    const revenue = months.map((m) => ({
      month: `${monthShort(m)}/${m.slice(2, 4)}`,
      valor: state.sales.filter((s) => s.status === 'Pago' && s.saleDate.slice(0, 7) === m.slice(0, 7)).reduce((n, s) => n + finalPrice(s), 0),
    }))
    const enrolled = state.patients.filter((p) => activeEnrollment(state, p.id))
    const byStatus = { 'Em dia': 0, 'Encontro próximo': 0, Atrasado: 0, Concluído: 0 }
    enrolled.forEach((p) => { byStatus[followUpSituation(state, p, activeEnrollment(state, p.id)!.program).status]++ })
    const vaccineLate = state.patients.map((p) => ({ p, n: pendingVaccines(state, p).filter((v) => v.status === 'Atrasada' || v.status === 'Pendente').length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
    const totalPaid = state.sales.filter((s) => s.status === 'Pago').reduce((n, s) => n + finalPrice(s), 0)
    const totalPending = state.sales.filter((s) => s.status === 'Pendente').reduce((n, s) => n + finalPrice(s), 0)
    const conversion = state.patients.length ? Math.round((enrolled.length / state.patients.length) * 100) : 0
    return { revenue, byStatus, vaccineLate, totalPaid, totalPending, conversion, enrolled: enrolled.length }
  }, [state])

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Indicadores gerais da clínica." />
      <div className="stats">
        {showMoney && <div className="stat plain"><span><strong>{money(data.totalPaid)}</strong><small>Receita confirmada (total)</small></span></div>}
        {showMoney && <div className="stat plain"><span><strong>{money(data.totalPending)}</strong><small>A receber (pendente)</small></span></div>}
        <div className="stat plain"><span><strong>{data.enrolled}</strong><small>Crianças em programa</small></span></div>
        <div className="stat plain"><span><strong>{data.conversion}%</strong><small>Pacientes com programa ativo</small></span></div>
      </div>
      <div className="grid-2">
        {showMoney ? (
          <Card title="Vendas confirmadas por mês">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: 'var(--brand-soft)' }} />
                <Bar dataKey="valor" name="Vendas" fill="#2f6b5a" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="Situação dos acompanhamentos">
            <ul className="simple-list">{Object.entries(data.byStatus).map(([k, v]) => <li key={k}><StatusBadge status={k} /><b>{v}</b></li>)}</ul>
          </Card>
        )}
        <Card title="Vacinas pendentes por paciente">
          {data.vaccineLate.length ? (
            <ul className="simple-list">{data.vaccineLate.map(({ p, n }) => <li key={p.id}><PatientName patient={p} sub={ageLabel(p.birthDate, undefined, true)} /><b>{n}</b></li>)}</ul>
          ) : <Empty title="Todas em dia" />}
        </Card>
        {showMoney && (
          <Card title="Situação dos acompanhamentos">
            <ul className="simple-list">{Object.entries(data.byStatus).map(([k, v]) => <li key={k}><StatusBadge status={k} /><b>{v}</b></li>)}</ul>
          </Card>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Usuários (admin)                                                    */
/* ------------------------------------------------------------------ */

const PERMS: Array<[string, Role[]]> = [
  ['Dashboard', ['doctor', 'secretary', 'admin']],
  ['Pacientes (cadastro)', ['doctor', 'secretary', 'admin']],
  ['Acompanhamento — registrar evolução', ['doctor', 'admin']],
  ['Programas — editar etapas', ['doctor', 'admin']],
  ['Conteúdos', ['doctor', 'admin']],
  ['Crescimento — registrar medições', ['doctor', 'admin']],
  ['Vacinação — registrar doses', ['doctor', 'secretary', 'admin']],
  ['Mensagens (famílias com programa ativo)', ['doctor', 'secretary', 'admin']],
  ['Vendas', ['secretary', 'admin']],
  ['Relatórios financeiros', ['secretary', 'admin']],
  ['Usuários', ['admin']],
]

export function Users() {
  const { state, update, toast, user: me } = useStore()
  const [tab, setTab] = useState<'team' | 'families' | 'perms'>('team')
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const list = state.users.filter((u) => (tab === 'families' ? u.role === 'parent' : u.role !== 'parent'))

  const toggle = (u: User) => {
    if (u.id === me?.id) return toast('Você não pode desativar o próprio usuário.')
    update((s) => ({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)) }))
  }

  return (
    <>
      <PageHeader title="Usuários" subtitle="Dr. André, secretaria, administradores e acessos das famílias."
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><UserPlus size={16} /> Novo usuário</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'team', label: 'Equipe' }, { id: 'families', label: 'Famílias' }, { id: 'perms', label: 'Permissões' }]} />
      <Card className="mt">
        {tab === 'perms' ? (
          <div className="table-wrap">
            <table className="table perms">
              <thead><tr><th>Módulo</th><th>Médico</th><th>Secretaria</th><th>Admin</th></tr></thead>
              <tbody>{PERMS.map(([label, roles]) => (
                <tr key={label}><td>{label}</td>{(['doctor', 'secretary', 'admin'] as Role[]).map((r) => <td key={r}>{roles.includes(r) ? '✓' : '—'}</td>)}</tr>
              ))}</tbody>
            </table>
            <p className="muted small mt">Responsáveis acessam apenas os dados das próprias crianças. Mensagens e materiais só ficam disponíveis com programa ativo (pago).</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th>{tab === 'families' && <th>Crianças</th>}<th>Status</th><th /></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong><small className="block muted">{u.title}</small></td>
                    <td>{u.email}</td>
                    <td>{ROLE_LABEL[u.role]}</td>
                    {tab === 'families' && <td>{u.patientIds?.map((id) => state.patients.find((p) => p.id === id)?.name).filter(Boolean).join(', ') || '—'}</td>}
                    <td><button className="plain" onClick={() => toggle(u)} title="Ativar/desativar"><StatusBadge status={u.active ? 'Ativo' : 'Inativo'} /></button></td>
                    <td><button className="icon-btn" aria-label="Editar" onClick={() => setEditing(u)}><Pencil size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <UserForm u={editing === 'new' ? undefined : editing} defaultRole={tab === 'families' ? 'parent' : 'secretary'} onClose={() => setEditing(null)} />}
    </>
  )
}

function UserForm({ u, defaultRole, onClose }: { u?: User; defaultRole: Role; onClose: () => void }) {
  const { state, update, toast } = useStore()
  const [f, setF] = useState({ name: u?.name ?? '', email: u?.email ?? '', role: u?.role ?? defaultRole, title: u?.title ?? '', patientIds: u?.patientIds ?? [] as string[] })
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || !f.email.includes('@')) return setError('Informe nome e e-mail válidos.')
    if (state.users.some((x) => x.email.toLowerCase() === f.email.toLowerCase() && x.id !== u?.id)) return setError('Já existe um usuário com este e-mail.')
    const data: User = { id: u?.id ?? `u-${uid()}`, name: f.name.trim(), email: f.email.trim(), role: f.role, title: f.title || ROLE_LABEL[f.role], active: u?.active ?? true, patientIds: f.role === 'parent' ? f.patientIds : undefined }
    update((s) => ({ ...s, users: u ? s.users.map((x) => (x.id === u.id ? data : x)) : [...s.users, data] }))
    toast(u ? 'Usuário atualizado' : 'Usuário criado — convite enviado por e-mail (simulado)')
    onClose()
  }
  return (
    <Modal title={u ? 'Editar usuário' : 'Novo usuário'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="user-form">Salvar</button></>}>
      <form id="user-form" className="form-grid" onSubmit={submit}>
        <Field label="Nome"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="E-mail"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Perfil">
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
        <Field label="Cargo / descrição"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={f.role === 'parent' ? 'Mãe da …' : ''} /></Field>
        {f.role === 'parent' && (
          <div className="field field-full">
            <span>Crianças vinculadas</span>
            <div className="check-grid">
              {state.patients.map((p) => (
                <label key={p.id} className="check">
                  <input type="checkbox" checked={f.patientIds.includes(p.id)} onChange={() => setF({ ...f, patientIds: f.patientIds.includes(p.id) ? f.patientIds.filter((x) => x !== p.id) : [...f.patientIds, p.id] })} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}
