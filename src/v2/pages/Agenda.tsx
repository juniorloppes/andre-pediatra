import { useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useStore } from '../store'
import type { Appointment } from '../types'
import { Card, Empty, Field, Modal, PageHeader, PatientName, StatusBadge } from '../ui'
import { addDays, ageLabel, fmtDate, fmtLongDate, TODAY, uid } from '../utils'
import { useChild } from './FamilyHome'

export function Agenda() {
  const { state, user, update, go, toast } = useStore()
  const child = useChild()
  const isParent = user?.role === 'parent'
  const [day, setDay] = useState(TODAY)
  const [creating, setCreating] = useState(false)

  const patient = (id: string) => state.patients.find((p) => p.id === id)!

  const dayList = useMemo(() => state.appointments.filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time)), [state.appointments, day])
  const upcoming = useMemo(() => state.appointments.filter((a) => a.date > day && a.status === 'Agendado').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8), [state.appointments, day])

  const setStatus = (id: string, status: Appointment['status']) => {
    update((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }))
    toast(`Atendimento marcado como ${status.toLowerCase()}`)
  }

  if (isParent) {
    if (!child) return null
    const mine = state.appointments.filter((a) => a.patientId === child.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    const next = mine.filter((a) => a.date >= TODAY && a.status === 'Agendado').reverse()
    const past = mine.filter((a) => !(a.date >= TODAY && a.status === 'Agendado'))
    return (
      <>
        <PageHeader title="Agenda" subtitle={`Encontros e consultas de ${child.name.split(' ')[0]}.`} />
        <div className="grid-2">
          <Card title="Próximos">
            {next.length ? <ul className="simple-list">{next.map((a) => <li key={a.id}><span><strong>{fmtDate(a.date)} · {a.time}</strong><small className="block muted">{a.kind} · {a.professional}</small></span><StatusBadge status={a.status} /></li>)}</ul>
              : <Empty title="Nenhum encontro agendado" text="Fale com a secretaria para agendar." />}
          </Card>
          <Card title="Histórico">
            {past.length ? <ul className="simple-list">{past.map((a) => <li key={a.id}><span><strong>{fmtDate(a.date)} · {a.time}</strong><small className="block muted">{a.kind}</small></span><StatusBadge status={a.status} /></li>)}</ul>
              : <Empty title="Sem histórico" />}
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Encontros do passo (consulta com o Dr. André ou triagem com a equipe) e demais atendimentos."
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Agendar</button>} />
      <div className="grid-2 wide-left">
        <Card title={
          <span className="day-nav">
            <button className="icon-btn" aria-label="Dia anterior" onClick={() => setDay(addDays(day, -1))}><ChevronLeft size={18} /></button>
            {fmtLongDate(day)}
            <button className="icon-btn" aria-label="Próximo dia" onClick={() => setDay(addDays(day, 1))}><ChevronRight size={18} /></button>
          </span>
        } action={<span className="toolbar-right">{day !== TODAY && <button className="link-btn" onClick={() => setDay(TODAY)}>Hoje</button>}<input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Data" /></span>}>
          {dayList.length ? (
            <ul className="agenda-list">
              {dayList.map((a) => {
                const p = patient(a.patientId)
                return (
                  <li key={a.id}>
                    <time>{a.time}</time>
                    <PatientName patient={p} sub={`${ageLabel(p.birthDate, undefined, true)} · ${a.kind} · ${a.professional}`} />
                    <StatusBadge status={a.status} />
                    <span className="row-actions">
                      {a.status === 'Agendado' && <button className="btn btn-soft btn-sm" onClick={() => setStatus(a.id, 'Realizado')}>Concluir</button>}
                      {a.status === 'Agendado' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a.id, 'Cancelado')}>Cancelar</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => go('patient', p.id)}>Abrir</button>
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : <Empty title="Nenhum atendimento neste dia" />}
        </Card>
        <Card title="Próximos agendamentos">
          {upcoming.length ? (
            <ul className="simple-list">
              {upcoming.map((a) => (
                <li key={a.id} className="clickable" onClick={() => setDay(a.date)}>
                  <PatientName patient={patient(a.patientId)} sub={`${fmtDate(a.date)} · ${a.time} · ${a.kind}`} />
                </li>
              ))}
            </ul>
          ) : <Empty title="Nada agendado" />}
        </Card>
      </div>
      {creating && <AppointmentForm date={day} onClose={() => setCreating(false)} />}
    </>
  )
}

function AppointmentForm({ date, onClose }: { date: string; onClose: () => void }) {
  const { state, update, toast } = useStore()
  const [f, setF] = useState({ patientId: '', date: date < TODAY ? TODAY : date, time: '09:00', kind: 'Encontro do passo — consulta', professional: 'Dr. André' })
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.patientId) return setError('Selecione o paciente.')
    if (state.appointments.some((a) => a.date === f.date && a.time === f.time && a.professional === f.professional && a.status !== 'Cancelado')) return setError('Já existe atendimento neste horário para este profissional.')
    update((s) => ({ ...s, appointments: [...s.appointments, { id: uid(), ...f, status: 'Agendado' }] }))
    toast('Atendimento agendado')
    onClose()
  }

  return (
    <Modal title="Agendar atendimento" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="appt-form">Agendar</button></>}>
      <form id="appt-form" className="form-grid" onSubmit={submit}>
        <Field label="Paciente" full>
          <select value={f.patientId} onChange={set('patientId')}>
            <option value="">Selecione…</option>
            {[...state.patients].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.guardian}</option>)}
          </select>
        </Field>
        <Field label="Data"><input type="date" value={f.date} min={TODAY} onChange={set('date')} /></Field>
        <Field label="Horário"><input type="time" value={f.time} onChange={set('time')} /></Field>
        <Field label="Tipo">
          <select value={f.kind} onChange={set('kind')}>{['Encontro do passo — consulta', 'Encontro do passo — triagem', 'Consulta', 'Vacinação', 'Pesagem e medidas'].map((k) => <option key={k}>{k}</option>)}</select>
        </Field>
        <Field label="Profissional">
          <select value={f.professional} onChange={set('professional')}>{['Dr. André', 'Equipe (técnica de enfermagem)'].map((k) => <option key={k}>{k}</option>)}</select>
        </Field>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}
