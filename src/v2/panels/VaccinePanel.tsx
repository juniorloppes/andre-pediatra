import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Undo2 } from 'lucide-react'
import { vaccineRows, type VaccineRow } from '../domain'
import { useStore } from '../store'
import type { Patient } from '../types'
import { Card, Empty, Field, Modal, StatusBadge, Tabs } from '../ui'
import { fmtDate, TODAY, uid } from '../utils'

type Filter = 'next' | 'done' | 'all'

const ageText = (m: number) => (m === 0 ? 'Ao nascer' : m < 12 ? `${m} ${m === 1 ? 'mês' : 'meses'}` : m % 12 === 0 ? `${m / 12} ${m === 12 ? 'ano' : 'anos'}` : `${m} meses`)

export function VaccinePanel({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { state, update, toast } = useStore()
  const [filter, setFilter] = useState<Filter>('next')
  const [registering, setRegistering] = useState<VaccineRow | 'pick' | null>(null)
  const rows = useMemo(() => vaccineRows(state, patient), [state, patient])
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'done' ? r.status === 'Realizada' : r.status !== 'Realizada' && r.status !== 'Futura'))
  const counts = { late: rows.filter((r) => r.status === 'Atrasada').length, pending: rows.filter((r) => r.status === 'Pendente' || r.status === 'Próxima').length, done: rows.filter((r) => r.status === 'Realizada').length }

  const undo = (r: VaccineRow) => {
    if (!r.record || !confirm(`Desfazer o registro de ${r.dose.vaccine} (${r.dose.dose})?`)) return
    update((s) => ({ ...s, vaccineRecords: s.vaccineRecords.filter((x) => x.id !== r.record!.id) }))
    toast('Registro removido')
  }

  return (
    <Card>
      <div className="toolbar">
        <Tabs value={filter} onChange={setFilter} items={[
          { id: 'next', label: `Próximas${counts.pending + counts.late ? ` (${counts.pending + counts.late})` : ''}` },
          { id: 'done', label: `Realizadas (${counts.done})` },
          { id: 'all', label: 'Todas' },
        ]} />
        {canEdit && <button className="btn btn-primary" onClick={() => setRegistering('pick')}><Plus size={16} /> Registrar vacina</button>}
      </div>
      {counts.late > 0 && <p className="alert alert-red">{counts.late} dose(s) em atraso há mais de 30 dias.</p>}
      {shown.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Idade</th><th>Vacina</th><th>Dose</th><th>Status</th><th>Data</th><th>Observação</th>{canEdit && <th />}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.dose.id}>
                  <td>{ageText(r.dose.ageMonths)}</td>
                  <td><strong>{r.dose.vaccine}</strong></td>
                  <td>{r.dose.dose}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.record ? fmtDate(r.record.date) : <span className="muted">prevista {fmtDate(r.due)}</span>}</td>
                  <td className="muted small">{r.dose.notes ?? r.record?.place ?? '—'}</td>
                  {canEdit && (
                    <td className="row-actions">
                      {r.record
                        ? <button className="icon-btn" aria-label="Desfazer registro" title="Desfazer registro" onClick={() => undo(r)}><Undo2 size={15} /></button>
                        : <button className="btn btn-soft btn-sm" onClick={() => setRegistering(r)}>Registrar</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title={filter === 'next' ? 'Nenhuma vacina pendente agora 🎉' : 'Nada por aqui'} />}
      {registering && <RegisterVaccine patient={patient} rows={rows} initial={registering === 'pick' ? undefined : registering} onClose={() => setRegistering(null)} />}
    </Card>
  )
}

function RegisterVaccine({ patient, rows, initial, onClose }: { patient: Patient; rows: VaccineRow[]; initial?: VaccineRow; onClose: () => void }) {
  const { update, toast } = useStore()
  const open = rows.filter((r) => !r.record)
  const [doseId, setDoseId] = useState(initial?.dose.id ?? open.find((r) => r.status !== 'Futura')?.dose.id ?? open[0]?.dose.id ?? '')
  const [date, setDate] = useState(TODAY)
  const [lot, setLot] = useState('')
  const [place, setPlace] = useState('Clínica Crescer')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!doseId) return
    update((s) => ({ ...s, vaccineRecords: [...s.vaccineRecords, { id: uid(), patientId: patient.id, doseId, date, lot: lot || undefined, place }] }))
    toast('Vacina registrada')
    onClose()
  }

  return (
    <Modal title={`Registrar vacina — ${patient.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="vac-form" disabled={!doseId}>Registrar</button></>}>
      <form id="vac-form" className="form-grid" onSubmit={submit}>
        <Field label="Vacina e dose" full>
          <select value={doseId} onChange={(e) => setDoseId(e.target.value)}>
            {open.map((r) => <option key={r.dose.id} value={r.dose.id}>{r.dose.vaccine} — {r.dose.dose} ({ageText(r.dose.ageMonths)}) · {r.status}</option>)}
          </select>
        </Field>
        <Field label="Data da aplicação"><input type="date" value={date} min={patient.birthDate} max={TODAY} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Lote (opcional)"><input value={lot} onChange={(e) => setLot(e.target.value)} /></Field>
        <Field label="Local" full>
          <select value={place} onChange={(e) => setPlace(e.target.value)}>{['Clínica Crescer', 'UBS', 'Outra clínica'].map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
      </form>
    </Modal>
  )
}
