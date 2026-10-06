import { useState, type FormEvent } from 'react'
import { Check, ClipboardPlus, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { FollowUp, Patient, Pendency, Program } from '../types'
import { Card, Empty, Field, Modal, StatusBadge } from '../ui'
import { addDays, ageDays, fmtDate, followUpSituation, TODAY, uid } from '../utils'

export function FollowUpPanel({ patient, program, canEdit }: { patient: Patient; program: Program; canEdit: boolean }) {
  const { state, update, user } = useStore()
  const sit = followUpSituation(state, patient, program)
  const [selected, setSelected] = useState(sit.step?.n ?? 1)
  const [editing, setEditing] = useState<FollowUp | 'new' | null>(null)
  const days = ageDays(patient.birthDate)
  const step = program.steps.find((s) => s.n === selected)!
  const record = sit.records.find((r) => r.step === selected)

  const togglePendency = (fid: string, pid: string) =>
    update((s) => ({ ...s, followUps: s.followUps.map((f) => (f.id === fid ? { ...f, pendencies: f.pendencies.map((p) => (p.id === pid ? { ...p, done: !p.done } : p)) } : f)) }))

  const allPendencies = sit.records.flatMap((r) => r.pendencies.map((p) => ({ ...p, step: r.step, fid: r.id }))).filter((p) => !p.done && (canEdit || p.familyVisible))

  return (
    <div className="followup">
      <Card>
        <div className="followup-summary">
          <div><small className="muted">Programa</small><strong>{program.name} · {program.ageLabel}</strong></div>
          <div><small className="muted">Passo atual</small><strong>{sit.step ? `${sit.step.n} de ${program.steps.length}` : '—'}</strong></div>
          <div><small className="muted">Encontros</small><strong>{sit.records.length} registrados · a cada {program.cadenceDays} dias</strong></div>
          <div><small className="muted">Situação</small><StatusBadge status={sit.status} /></div>
        </div>
        <ol className="stepper">
          {program.steps.map((s) => {
            const done = sit.doneSteps.has(s.n)
            const late = !done && s.endDay <= days
            const current = s.n === sit.step?.n
            return (
              <li key={s.n}>
                <button className={`${done ? 'done' : ''} ${late ? 'late' : ''} ${current ? 'current' : ''} ${selected === s.n ? 'selected' : ''}`} onClick={() => setSelected(s.n)}>
                  <span className="dot">{done ? <Check size={14} /> : s.n}</span>
                  <small>{s.startDay}–{s.endDay} dias</small>
                </button>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid-2 wide-left">
        <Card title={`Passo ${step.n} — ${step.title}`}
          action={canEdit && (record
            ? <button className="btn btn-ghost btn-sm" onClick={() => setEditing(record)}>Editar registro</button>
            : <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')} disabled={step.startDay > days}><ClipboardPlus size={15} /> Registrar encontro</button>)}>
          <p className="muted small">Janela do passo: {fmtDate(addDays(patient.birthDate, step.startDay))} a {fmtDate(addDays(patient.birthDate, step.endDay))}</p>
          {record ? (
            <div className="record">
              <p className="record-meta">Encontro em <b>{fmtDate(record.date)}</b> · {record.author}</p>
              <h4>Evolução</h4>
              <p>{record.evolution || '—'}</p>
              <h4>Orientações</h4>
              <p>{record.orientations || '—'}</p>
              {record.pendencies.length > 0 && <>
                <h4>Pendências</h4>
                <ul className="checks">
                  {record.pendencies.filter((p) => canEdit || p.familyVisible).map((p) => (
                    <li key={p.id}>
                      <label><input type="checkbox" checked={p.done} disabled={!canEdit} onChange={() => togglePendency(record.id, p.id)} /> <span className={p.done ? 'striked' : ''}>{p.text}</span></label>
                      {canEdit && !p.familyVisible && <span className="tag">interno</span>}
                    </li>
                  ))}
                </ul>
              </>}
            </div>
          ) : step.startDay > days ? (
            <Empty title="Passo futuro" text={`Começa em ${fmtDate(addDays(patient.birthDate, step.startDay))}.`} />
          ) : (
            <Empty title={step.endDay <= days ? 'Encontro não registrado' : 'Encontro ainda não realizado'} text={step.endDay <= days ? 'A janela deste passo já passou — registre o encontro ou anote o motivo.' : `Previsto até ${fmtDate(addDays(patient.birthDate, step.endDay))}.`} />
          )}
          <details className="step-guide">
            <summary>Roteiro do passo (programa)</summary>
            <p><b>Meta:</b> {step.goal}</p>
            <p><b>Temas:</b> {step.themes.join(' · ')}</p>
            <ul>{step.orientations.map((o) => <li key={o}>{o}</li>)}</ul>
          </details>
        </Card>

        <Card title="Pendências em aberto">
          {allPendencies.length ? (
            <ul className="checks">
              {allPendencies.map((p) => (
                <li key={p.id}>
                  <label><input type="checkbox" checked={false} disabled={!canEdit} onChange={() => togglePendency(p.fid, p.id)} /> <span>{p.text}</span></label>
                  <small className="muted">Passo {p.step}</small>
                </li>
              ))}
            </ul>
          ) : <Empty title="Sem pendências" />}
        </Card>
      </div>

      {editing && user && (
        <FollowUpForm patient={patient} program={program} stepN={selected} record={editing === 'new' ? undefined : editing} author={user.name} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function FollowUpForm({ patient, program, stepN, record, author, onClose }: { patient: Patient; program: Program; stepN: number; record?: FollowUp; author: string; onClose: () => void }) {
  const { update, toast } = useStore()
  const step = program.steps.find((s) => s.n === stepN)!
  const [date, setDate] = useState(record?.date ?? TODAY)
  const [evolution, setEvolution] = useState(record?.evolution ?? '')
  const [orientations, setOrientations] = useState(record?.orientations ?? step.orientations.join('\n'))
  const [pendencies, setPendencies] = useState<Pendency[]>(record?.pendencies ?? [])
  const [newP, setNewP] = useState('')

  const addP = () => {
    if (!newP.trim()) return
    setPendencies([...pendencies, { id: uid(), text: newP.trim(), done: false, familyVisible: true }])
    setNewP('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const data: FollowUp = { id: record?.id ?? uid(), patientId: patient.id, programId: program.id, step: stepN, date, author: record?.author ?? author, evolution, orientations, pendencies }
    update((s) => ({ ...s, followUps: record ? s.followUps.map((f) => (f.id === record.id ? data : f)) : [...s.followUps, data] }))
    toast(record ? 'Registro atualizado' : 'Encontro registrado')
    onClose()
  }

  return (
    <Modal wide title={`${record ? 'Editar' : 'Registrar'} encontro — Passo ${stepN}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="fu-form">Salvar</button></>}>
      <form id="fu-form" className="form-grid" onSubmit={submit}>
        <Field label="Data do encontro"><input type="date" value={date} max={TODAY} min={patient.birthDate} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Passo"><input value={`${step.n} — ${step.title}`} disabled /></Field>
        <Field label="Evolução" full><textarea rows={4} value={evolution} onChange={(e) => setEvolution(e.target.value)} placeholder="Desenvolvimento, alimentação, sono, exame físico…" autoFocus /></Field>
        <Field label="Orientações para a família" full hint="Pré-preenchido com as orientações do passo — ajuste conforme o encontro."><textarea rows={4} value={orientations} onChange={(e) => setOrientations(e.target.value)} /></Field>
        <div className="field field-full">
          <span>Pendências</span>
          <ul className="checks editable">
            {pendencies.map((p) => (
              <li key={p.id}>
                <label><input type="checkbox" checked={p.done} onChange={() => setPendencies(pendencies.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))} /> {p.text}</label>
                <button type="button" className="icon-btn" title={p.familyVisible ? 'Visível para a família' : 'Somente equipe'} onClick={() => setPendencies(pendencies.map((x) => (x.id === p.id ? { ...x, familyVisible: !x.familyVisible } : x)))}>
                  {p.familyVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button type="button" className="icon-btn" aria-label="Remover" onClick={() => setPendencies(pendencies.filter((x) => x.id !== p.id))}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
          <span className="inline-add">
            <input value={newP} onChange={(e) => setNewP(e.target.value)} placeholder="Nova pendência (ex.: exame, vacina, retorno)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addP() } }} />
            <button type="button" className="btn btn-soft btn-sm" onClick={addP}><Plus size={14} /> Adicionar</button>
          </span>
        </div>
      </form>
    </Modal>
  )
}
