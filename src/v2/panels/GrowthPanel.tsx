import { useMemo, useState, type FormEvent } from 'react'
import { Info, MapPin, Plus, Trash2 } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { curveRows, METRIC_LABEL, PERCENTILES, percentileBand, type Metric } from '../reference'
import { useStore } from '../store'
import type { Patient } from '../types'
import { Card, Empty, Field, Modal, Tabs } from '../ui'
import { ageLabel, ageMonthsExact, bmi, fmtDate, TODAY, uid } from '../utils'

const PCT_COLORS: Record<string, string> = { P3: '#e58fb4', P15: '#c9a0e6', P50: '#7cc4a4', P85: '#f2c46b', P97: '#f09a86' }
const fmt = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

export function GrowthPanel({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { state, update, toast } = useStore()
  const [metric, setMetric] = useState<Metric>('weight')
  const [adding, setAdding] = useState(false)
  const [showMarkers, setShowMarkers] = useState(true)

  const records = useMemo(() => state.growth.filter((g) => g.patientId === patient.id).sort((a, b) => a.date.localeCompare(b.date)), [state.growth, patient.id])
  const curves = useMemo(() => curveRows(patient.sex, metric), [patient.sex, metric])
  const points = records
    .map((r) => ({ m: +ageMonthsExact(patient.birthDate, r.date).toFixed(2), v: metric === 'bmi' ? +bmi(r.weight, r.height).toFixed(2) : r[metric] }))
    .filter((p) => p.m <= 24.5)
  const last = records[records.length - 1]
  const lastValue = last && (metric === 'bmi' ? bmi(last.weight, last.height) : last[metric])
  const { unit, label } = METRIC_LABEL[metric]
  /*
   * Marcadores na linha do tempo — DEMONSTRAÇÃO do conceito "curva + eventos".
   * Usa apenas os encontros do programa já registrados (não são eventos clínicos).
   * Quais eventos o Dr. André quer correlacionar, quem registra e a origem (Crescer ou Clínica Experts) ainda serão definidos.
   */
  const markers = state.followUps
    .filter((f) => f.patientId === patient.id)
    .map((f) => ({ id: f.id, m: +ageMonthsExact(patient.birthDate, f.date).toFixed(2), date: f.date, label: `Passo ${f.step}`, text: `Encontro do passo ${f.step} — ${f.kind}` }))
    .filter((x) => x.m <= 24.5)
    .sort((a, b) => a.m - b.m)

  const remove = (id: string) => {
    if (!confirm('Excluir esta medição?')) return
    update((s) => ({ ...s, growth: s.growth.filter((g) => g.id !== id) }))
    toast('Medição excluída')
  }

  return (
    <div className="growth">
      <Card className="growth-chart">
        <div className="toolbar">
          <Tabs value={metric} onChange={setMetric} items={(['weight', 'height', 'head', 'bmi'] as Metric[]).map((m) => ({ id: m, label: METRIC_LABEL[m].label }))} />
          {canEdit && <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Nova medição</button>}
        </div>
        <div className="chart-side">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="var(--line)" />
                <XAxis dataKey="m" type="number" domain={[0, 24]} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]} tickFormatter={(m) => (m === 0 ? 'Nasc.' : m === 12 ? '1 ano' : m === 24 ? '2 anos' : `${m}m`)} fontSize={11} />
                <YAxis domain={['auto', 'auto']} fontSize={11} width={44} unit={metric === 'bmi' ? '' : ` ${unit}`} />
                <Tooltip formatter={(v) => `${fmt(Number(v), metric === 'weight' ? 2 : 1)} ${unit}`} labelFormatter={(m) => `${fmt(Number(m), 1)} meses`} />
                <Legend verticalAlign="bottom" height={28} iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                {showMarkers && markers.map((mk) => (
                  <ReferenceLine key={mk.id} x={mk.m} stroke="#b9a7e6" strokeDasharray="3 3" label={{ value: mk.label, position: 'top', fontSize: 9, fill: '#7766b8' }} />
                ))}
                {PERCENTILES.map((p) => (
                  <Line key={p} data={curves} dataKey={p} name={p} stroke={PCT_COLORS[p]} dot={false} strokeWidth={p === 'P50' ? 2 : 1.4} isAnimationActive={false} />
                ))}
                <Line data={points} dataKey="v" name={patient.name.split(' ')[0]} stroke="#5b4fcf" strokeWidth={2.4} dot={{ r: 4, fill: '#5b4fcf' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <aside className="chart-aside">
            <h4>Curvas ({patient.sex === 'F' ? 'meninas' : 'meninos'})</h4>
            <p className="muted small">Valores APROXIMADOS de demonstração (base OMS 0–2 anos). Substituir pelas tabelas oficiais antes de uso clínico.</p>
            {last ? (
              <div className="last-measure">
                <small>Última medição · {fmtDate(last.date)}</small>
                <strong>{fmt(lastValue!, metric === 'weight' ? 3 : 1)} {unit}</strong>
                <span className="badge badge-lilac">{percentileBand(patient.sex, metric, ageMonthsExact(patient.birthDate, last.date), lastValue!)}</span>
              </div>
            ) : <p className="muted small">Sem medições de {label.toLowerCase()}.</p>}
          </aside>
        </div>
        {markers.length > 0 && (
          <div className="markers">
            <label className="check"><input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} /> <MapPin size={14} /> Marcadores na linha do tempo <span className="badge badge-gray">demonstração</span></label>
            {showMarkers && <ul>{markers.map((mk) => <li key={mk.id} title={mk.text}><b>{fmtDate(mk.date)}</b> {mk.text}</li>)}</ul>}
            <p className="demo-note"><Info size={12} /> Conceito para validar com o Dr. André: quais eventos/informações devem aparecer correlacionados ao gráfico. Aqui são usados apenas os encontros do programa.</p>
          </div>
        )}
      </Card>

      <Card title="Medições">
        {records.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Data</th><th>Idade</th><th>Peso (kg)</th><th>Altura (cm)</th><th>Per. cefálico (cm)</th><th>IMC</th>{canEdit && <th />}</tr></thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td>{ageLabel(patient.birthDate, r.date)}</td>
                    <td>{fmt(r.weight, 3)}</td>
                    <td>{fmt(r.height)}</td>
                    <td>{fmt(r.head)}</td>
                    <td>{fmt(bmi(r.weight, r.height), 2)}</td>
                    {canEdit && <td><button className="icon-btn" aria-label="Excluir" onClick={() => remove(r.id)}><Trash2 size={15} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Nenhuma medição registrada" />}
      </Card>
      {adding && <MeasureForm patient={patient} onClose={() => setAdding(false)} />}
    </div>
  )
}

function MeasureForm({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { update, toast } = useStore()
  const [f, setF] = useState({ date: TODAY, weight: '', height: '', head: '' })
  const [error, setError] = useState('')
  const num = (s: string) => Number(s.replace(',', '.'))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const weight = num(f.weight), height = num(f.height), head = num(f.head)
    if (!(weight > 0.5 && weight < 40)) return setError('Peso inválido (kg).')
    if (!(height > 30 && height < 130)) return setError('Altura inválida (cm).')
    if (!(head > 25 && head < 60)) return setError('Perímetro cefálico inválido (cm).')
    if (f.date < patient.birthDate || f.date > TODAY) return setError('Data fora do intervalo válido.')
    update((s) => ({ ...s, growth: [...s.growth, { id: uid(), patientId: patient.id, date: f.date, weight, height, head }] }))
    toast('Medição registrada')
    onClose()
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal title={`Nova medição — ${patient.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="measure-form">Salvar medição</button></>}>
      <form id="measure-form" className="form-grid" onSubmit={submit}>
        <Field label="Data"><input type="date" value={f.date} min={patient.birthDate} max={TODAY} onChange={set('date')} /></Field>
        <Field label="Peso (kg)"><input inputMode="decimal" placeholder="6,050" value={f.weight} onChange={set('weight')} autoFocus /></Field>
        <Field label="Altura / comprimento (cm)"><input inputMode="decimal" placeholder="60,2" value={f.height} onChange={set('height')} /></Field>
        <Field label="Perímetro cefálico (cm)"><input inputMode="decimal" placeholder="40,1" value={f.head} onChange={set('head')} /></Field>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}
