import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Plus, Search, Users } from 'lucide-react'
import { useStore } from '../store'
import type { AppState, Patient, Sex } from '../types'
import { Card, Empty, Field, Modal, PageHeader, PatientName, StatusBadge, Tabs } from '../ui'
import { activeEnrollment, ageLabel, currentSale, followUpSituation, normalize, TODAY, uid } from '../utils'

type Filter = 'all' | 'program' | 'pending' | 'none'

export const patientSituation = (state: AppState, p: Patient) => {
  const enr = activeEnrollment(state, p.id)
  if (enr) {
    const sit = followUpSituation(state, p, enr.program)
    return { program: `${enr.program.name} · ${enr.program.ageLabel}`, status: sit.status, step: sit.step?.n, kind: 'program' as const, sit }
  }
  const sale = currentSale(state, p.id)
  if (sale?.status === 'Pendente') {
    const pr = state.programs.find((x) => x.id === sale.programId)
    return { program: `${pr?.name} · ${pr?.ageLabel}`, status: 'Pagamento pendente', kind: 'pending' as const }
  }
  return { program: 'Consulta avulsa', status: 'Sem programa', kind: 'none' as const }
}

export function Patients() {
  const { state, go } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => state.patients
    .map((p) => ({ p, s: patientSituation(state, p) }))
    .filter(({ p, s }) => (filter === 'all' || s.kind === filter) && normalize(`${p.name} ${p.guardian}`).includes(normalize(q)))
    .sort((a, b) => a.p.name.localeCompare(b.p.name)), [state, q, filter])

  return (
    <>
      <PageHeader title="Pacientes" subtitle="Crianças, responsáveis, programa contratado e situação do acompanhamento."
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Novo paciente</button>} />
      <Card>
        <div className="toolbar">
          <Tabs value={filter} onChange={setFilter} items={[
            { id: 'all', label: 'Todos' }, { id: 'program', label: 'Em programa' }, { id: 'pending', label: 'Pagamento pendente' }, { id: 'none', label: 'Sem programa' },
          ]} />
          <label className="search"><Search size={16} /><input placeholder="Buscar criança ou responsável" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Criança</th><th>Idade</th><th>Responsável</th><th>Programa contratado</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {rows.map(({ p, s }) => (
                  <tr key={p.id} className="clickable" onClick={() => go('patient', p.id)}>
                    <td><PatientName patient={p} sub={p.sex === 'F' ? 'Menina' : 'Menino'} /></td>
                    <td>{ageLabel(p.birthDate, undefined, true)}</td>
                    <td>{p.guardian}<small className="block muted">{p.guardianRelation} · {p.phone}</small></td>
                    <td>{s.program}{s.kind === 'program' && <small className="block muted">Passo {s.step}</small>}</td>
                    <td><StatusBadge status={s.status === 'Pagamento pendente' ? 'Pendente' : s.status} /></td>
                    <td><ArrowRight size={16} className="muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={<Users />} title="Nenhum paciente encontrado" />}
      </Card>
      {creating && <PatientForm onClose={() => setCreating(false)} />}
    </>
  )
}

export function PatientForm({ onClose, patient }: { onClose: () => void; patient?: Patient }) {
  const { update, toast, go } = useStore()
  const [f, setF] = useState({
    name: patient?.name ?? '', sex: patient?.sex ?? ('F' as Sex), birthDate: patient?.birthDate ?? '',
    guardian: patient?.guardian ?? '', guardianRelation: patient?.guardianRelation ?? 'Mãe', phone: patient?.phone ?? '', email: patient?.email ?? '', notes: patient?.notes ?? '',
  })
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || !f.birthDate || !f.guardian.trim()) return setError('Preencha nome da criança, data de nascimento e responsável.')
    if (f.birthDate > TODAY) return setError('A data de nascimento não pode estar no futuro.')
    if (patient) {
      update((s) => ({ ...s, patients: s.patients.map((p) => (p.id === patient.id ? { ...p, ...f } : p)) }))
      toast('Cadastro atualizado')
      onClose()
    } else {
      const id = `p-${uid()}`
      update((s) => ({ ...s, patients: [...s.patients, { id, ...f, name: f.name.trim(), createdAt: TODAY }] }))
      toast('Paciente cadastrado')
      onClose()
      go('patient', id)
    }
  }

  return (
    <Modal title={patient ? 'Editar cadastro' : 'Novo paciente'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="patient-form">Salvar</button></>}>
      <form id="patient-form" className="form-grid" onSubmit={submit}>
        <p className="form-section field-full">Criança</p>
        <Field label="Nome completo" full><input value={f.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Data de nascimento"><input type="date" value={f.birthDate} max={TODAY} onChange={set('birthDate')} /></Field>
        <Field label="Sexo (curvas de crescimento)">
          <select value={f.sex} onChange={set('sex')}><option value="F">Feminino</option><option value="M">Masculino</option></select>
        </Field>
        <p className="form-section field-full">Responsável</p>
        <Field label="Nome do responsável"><input value={f.guardian} onChange={set('guardian')} /></Field>
        <Field label="Parentesco">
          <select value={f.guardianRelation} onChange={set('guardianRelation')}>{['Mãe', 'Pai', 'Avó', 'Avô', 'Responsável legal'].map((r) => <option key={r}>{r}</option>)}</select>
        </Field>
        <Field label="Telefone"><input value={f.phone} onChange={set('phone')} placeholder="(11) 90000-0000" /></Field>
        <Field label="E-mail"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Observações" full><textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}
