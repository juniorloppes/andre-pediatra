import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Info, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { familyCanSend, pendingVaccines } from '../domain'
import { GrowthPanel } from '../panels/GrowthPanel'
import { VaccinePanel } from '../panels/VaccinePanel'
import { VACCINE_SOURCE } from '../reference'
import { isClinical, ROLE_LABEL, useStore } from '../store'
import type { Patient, Role, User, VaccineDose } from '../types'
import { Card, Empty, Field, Modal, PageHeader, PatientName, StatusBadge, Tabs } from '../ui'
import { activeEnrollment, addMonths, ageLabel, currentSale, finalPrice, fmtDate, followUpSituation, monthShort, money, programStatus, TODAY, uid } from '../utils'
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
      <PageHeader title="Crescimento" subtitle={user.role === 'parent' ? 'Acompanhe a evolução da sua criança.' : 'Peso, altura, perímetro cefálico e IMC — a equipe pesa, mede e acompanha a curva entre consultas.'} actions={picker} />
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
      <PageHeader title="Vacinação" subtitle={`Referência: ${VACCINE_SOURCE}.`} actions={staff && tab === 'patient' ? picker : undefined} />
      {staff && <Tabs value={tab} onChange={setTab} items={[{ id: 'patient', label: 'Por paciente' }, { id: 'catalog', label: 'Calendário cadastrado' }]} />}
      <div className="tab-body">
        {tab === 'patient' || !staff ? <VaccinePanel patient={patient} canEdit={staff} /> : <VaccineCatalog />}
      </div>
    </>
  )
}

function VaccineCatalog() {
  const { state, update, toast, user } = useStore()
  const [editing, setEditing] = useState<VaccineDose | 'new' | null>(null)
  const canEdit = user ? isClinical(user.role) : false
  const remove = (d: VaccineDose) => {
    if (state.vaccineRecords.some((r) => r.doseId === d.id)) return toast('Há registros para esta dose — não é possível excluir.')
    if (!confirm(`Excluir ${d.vaccine} (${d.dose}) do calendário?`)) return
    update((s) => ({ ...s, vaccineCatalog: s.vaccineCatalog.filter((x) => x.id !== d.id) }))
  }
  const list = [...state.vaccineCatalog].sort((a, b) => a.ageMonths - b.ageMonths || a.vaccine.localeCompare(b.vaccine))
  return (
    <Card title={`Calendário 0–24 meses (${list.length} doses)`} action={canEdit && <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={14} /> Cadastrar vacina</button>}>
      <p className="muted small">{VACCINE_SOURCE}. O calendário SBP é elaborado para crianças hígidas; esquemas podem ser adaptados pelo médico.</p>
      <div className="table-wrap mt">
        <table className="table">
          <thead><tr><th>Idade</th><th>Vacina</th><th>Dose</th><th>Observação (SBP)</th>{canEdit && <th />}</tr></thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td>{d.ageMonths === 0 ? 'Ao nascer' : `${d.ageMonths} meses`}</td>
                <td><strong>{d.vaccine}</strong></td>
                <td>{d.dose}</td>
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
  const [f, setF] = useState({ vaccine: dose?.vaccine ?? '', dose: dose?.dose ?? '1ª dose', ageMonths: String(dose?.ageMonths ?? 0), notes: dose?.notes ?? '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.vaccine.trim()) return
    const data: VaccineDose = { id: dose?.id ?? `v-${uid()}`, vaccine: f.vaccine.trim(), dose: f.dose, ageMonths: Number(f.ageMonths) || 0, notes: f.notes || undefined }
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
        <Field label="Observação" full><input value={f.notes} onChange={set('notes')} /></Field>
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
    .map(({ p, enr }) => ({ p, enr: enr!, sit: followUpSituation(state, p, enr!) }))
    .filter((r) => filter === 'all' || r.sit.status !== 'Encontro registrado' || r.sit.openPendencies > 0 || r.sit.flagged > 0)
    .sort((a, b) => (a.sit.stepWindowEnd ?? '').localeCompare(b.sit.stepWindowEnd ?? '')), [state, filter])

  return (
    <>
      <PageHeader title="Acompanhamento" subtitle="Crianças com programa ativo: passo atual, encontro do passo (consulta ou triagem), Mapa do Passo e pendências." />
      <Card>
        <div className="toolbar">
          <Tabs value={filter} onChange={setFilter} items={[{ id: 'all', label: 'Todos com programa ativo' }, { id: 'attention', label: 'Sem encontro no passo / pendências' }]} />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Criança</th><th>Contrato</th><th>Passo atual</th><th>Janela do passo até</th><th>Encontros</th><th>Pendências</th><th /></tr></thead>
              <tbody>
                {rows.map(({ p, enr, sit }) => (
                  <tr key={p.id} className="clickable" onClick={() => go('patient', p.id, 'followup')}>
                    <td><PatientName patient={p} sub={ageLabel(p.birthDate, undefined, true)} /></td>
                    <td>{enr.contract.label.split(' —')[0]}</td>
                    <td>{sit.step ? `${sit.step.n} — ${sit.step.title}` : '—'}</td>
                    <td>{fmtDate(sit.stepWindowEnd)}</td>
                    <td><StatusBadge status={sit.status} />{sit.missing.length > 0 && <small className="block muted">Passo(s) {sit.missing.map((m) => m.n).join(', ')}</small>}</td>
                    <td>{sit.openPendencies || '—'}{sit.flagged > 0 && <small className="block muted">{sit.flagged} p/ Dr. André</small>}</td>
                    <td><ArrowRight size={16} className="muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Nada por aqui" />}
        <p className="demo-note"><Info size={12} /> “Sem encontro registrado” é informativo. Se todo passo exige encontro e quando ele fica atrasado ainda será definido com o Dr. André.</p>
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
  const sale = enr?.sale ?? currentSale(state, child.id)
  const sit = enr && followUpSituation(state, child, enr)
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
            <dt>Programa</dt><dd>{sale ? <StatusBadge status={programStatus(sale)} /> : 'Sem programa'}</dd>
            {sale && <><dt>Vigência</dt><dd>{fmtDate(sale.startDate)} a {fmtDate(sale.endDate)}</dd></>}
          </dl>
          <p className="muted small mt">Para alterar dados, fale com a secretaria.</p>
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
                    <b>Passo {r.step} · {r.kind} · {fmtDate(r.date)}</b>
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
/* Relatórios (Dr. André, secretaria e admin — inclui financeiro)      */
/* ------------------------------------------------------------------ */

export function Reports() {
  const { state } = useStore()
  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(TODAY.slice(0, 7) + '-01', i - 11))
    const revenue = months.map((m) => ({
      month: `${monthShort(m)}/${m.slice(2, 4)}`,
      valor: state.sales.filter((s) => s.paymentStatus === 'Pago' && (s.paidAt ?? s.saleDate).slice(0, 7) === m.slice(0, 7)).reduce((n, s) => n + finalPrice(s), 0),
    }))
    const byStatus = new Map<string, number>()
    state.sales.forEach((s) => byStatus.set(programStatus(s), (byStatus.get(programStatus(s)) ?? 0) + 1))
    const byContract = new Map<string, { count: number; value: number }>()
    state.sales.filter((s) => s.paymentStatus === 'Pago').forEach((s) => {
      const k = state.programs.find((p) => p.id === s.programId)?.contracts.find((c) => c.id === s.contractId)?.label ?? s.contractId
      const cur = byContract.get(k) ?? { count: 0, value: 0 }
      byContract.set(k, { count: cur.count + 1, value: cur.value + finalPrice(s) })
    })
    const vaccineLate = state.patients.map((p) => ({ p, n: pendingVaccines(state, p).filter((v) => v.status === 'Atrasada' || v.status === 'Pendente').length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
    const totalPaid = state.sales.filter((s) => s.paymentStatus === 'Pago').reduce((n, s) => n + finalPrice(s), 0)
    const totalPending = state.sales.filter((s) => s.paymentStatus === 'Pendente').reduce((n, s) => n + finalPrice(s), 0)
    const active = state.patients.filter((p) => familyCanSend(state, p.id)).length
    return { revenue, byStatus, byContract, vaccineLate, totalPaid, totalPending, active }
  }, [state])

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Indicadores comerciais, financeiros e do acompanhamento." />
      <div className="stats">
        <div className="stat plain"><span><strong>{money(data.totalPaid)}</strong><small>Recebido (registrado)</small></span></div>
        <div className="stat plain"><span><strong>{money(data.totalPending)}</strong><small>Pagamentos pendentes</small></span></div>
        <div className="stat plain"><span><strong>{data.active}</strong><small>Crianças com programa ativo</small></span></div>
        <div className="stat plain"><span><strong>{state.patients.length - data.active}</strong><small>Famílias sem programa ativo</small></span></div>
      </div>
      <div className="grid-2">
        <Card title="Recebimentos por mês">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
              <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: 'var(--brand-soft)' }} />
              <Bar dataKey="valor" name="Recebido" fill="#2f6b5a" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Vendas por situação do programa">
          <ul className="simple-list">{[...data.byStatus.entries()].map(([k, v]) => <li key={k}><span className="grow"><StatusBadge status={k} /></span><b>{v}</b></li>)}</ul>
          <h4 className="mt small">Pagos por contrato</h4>
          <ul className="simple-list">{[...data.byContract.entries()].map(([k, v]) => <li key={k}><span className="grow">{k}<small className="block muted">{v.count} venda(s)</small></span><b className="num">{money(v.value)}</b></li>)}</ul>
        </Card>
        <Card title="Vacinas em aberto por criança">
          {data.vaccineLate.length ? (
            <ul className="simple-list">{data.vaccineLate.map(({ p, n }) => <li key={p.id}><PatientName patient={p} sub={ageLabel(p.birthDate, undefined, true)} /><b>{n}</b></li>)}</ul>
          ) : <Empty title="Todas em dia" />}
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

const PERMS: Array<[string, Role[]]> = [
  ['Dashboard (operação e financeiro)', ['doctor', 'secretary', 'admin']],
  ['Famílias / pacientes', ['doctor', 'secretary', 'admin']],
  ['Agenda', ['doctor', 'secretary', 'admin']],
  ['Programas — consultar', ['doctor', 'secretary', 'admin']],
  ['Programas — editar passos, contratos e valores', ['doctor', 'admin']],
  ['Acompanhamento — consultar', ['doctor', 'secretary', 'admin']],
  ['Acompanhamento — registrar encontro / Mapa do Passo', ['doctor', 'admin']],
  ['Conteúdos', ['doctor', 'admin']],
  ['Crescimento — registrar medições', ['doctor', 'admin']],
  ['Vacinação — registrar doses', ['doctor', 'secretary', 'admin']],
  ['Mensagens — ler e responder', ['doctor', 'secretary', 'admin']],
  ['Vendas, pagamentos e vigência', ['doctor', 'secretary', 'admin']],
  ['Relatórios financeiros', ['doctor', 'secretary', 'admin']],
  ['Usuários e permissões', ['doctor', 'admin']],
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
      <PageHeader title="Usuários" subtitle="Dr. André, secretaria, administradores e contas das famílias."
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><UserPlus size={16} /> Novo usuário</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'team', label: 'Equipe' }, { id: 'families', label: 'Famílias' }, { id: 'perms', label: 'Permissões' }]} />
      <Card className="mt">
        {tab === 'perms' ? (
          <div className="table-wrap">
            <table className="table perms">
              <thead><tr><th>Módulo</th><th>Dr. André</th><th>Secretaria</th><th>Admin</th></tr></thead>
              <tbody>{PERMS.map(([label, roles]) => (
                <tr key={label}><td>{label}</td>{(['doctor', 'secretary', 'admin'] as Role[]).map((r) => <td key={r}>{roles.includes(r) ? '✓' : '—'}</td>)}</tr>
              ))}</tbody>
            </table>
            <ul className="bullets small mt">
              <li>Dr. André é médico e proprietário: acesso total, inclusive financeiro.</li>
              <li>A secretaria responde mensagens administrativas e orientações já definidas; assuntos clínicos são sinalizados ao Dr. André.</li>
              <li>Toda família tem conta no Crescer. Somente famílias com programa pago e ativo podem enviar mensagens.</li>
              <li>A técnica de enfermagem (triagem) ainda não tem perfil próprio no protótipo; a triagem é registrada como “Triagem com a equipe”.</li>
            </ul>
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
        <Field label="Cargo / descrição"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
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
            <small>Como funciona família com dois ou mais filhos (login, contratos, condições) ainda será definido com o Dr. André.</small>
          </div>
        )}
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}
