import { useState, type FormEvent } from 'react'
import { Check, ClipboardPlus, Eye, EyeOff, Flag, Info, Plus, Stethoscope, Trash2, Users } from 'lucide-react'
import { PILLARS, TEAM_CAN, TEAM_CANNOT, TEAM_INTRO, TRIAGE_FLAGS } from '../reference'
import { useStore } from '../store'
import type { EncounterKind, FollowUp, Patient, Pendency, ProgramStep } from '../types'
import { Badge, Card, Empty, Field, Modal, StatusBadge } from '../ui'
import { addDays, ageDays, fmtDate, followUpSituation, TODAY, uid, type Enrollment } from '../utils'
import { SOURCE_BADGE } from '../pages/Programs'

/** Sinalizadores de triagem do documento vinculados ao passo (por número do passo). */
export const flagsForStep = (step: ProgramStep) => TRIAGE_FLAGS.filter((f) => step.n >= f.fromStep && step.n <= f.toStep)

/** Mapa do Passo: o documento define o formato (sim/não por pilar), mas não as perguntas. */
export const MapPending = () => (
  <p className="small muted">Avaliação objetiva <b>sim/não por pilar</b> ({PILLARS.join(' · ')}). As perguntas de cada passo ainda não estão definidas no documento — pendente de definição pelo Dr. André.</p>
)

export const EncounterIcon = ({ kind }: { kind: EncounterKind }) => (kind === 'Consulta com o Dr. André' ? <Stethoscope size={14} /> : <Users size={14} />)

export function StepDetails({ step }: { step: ProgramStep }) {
  const flags = flagsForStep(step)
  const empty = <span className="muted">Não informado.</span>
  return (
    <div className="step-detail">
      <p className="chips"><Badge tone={SOURCE_BADGE[step.source].tone}>{SOURCE_BADGE[step.source].label}</Badge></p>
      <dl className="dl stacked">
        <dt>Tema central</dt><dd>{step.title}</dd>
        <dt>Principais desafios</dt><dd>{step.challenges.length ? step.challenges.join(' · ') : empty}</dd>
        <dt>Encontro do passo</dt><dd>{step.encounter}</dd>
        <dt>Meta evolutiva</dt><dd>{step.goal || empty}</dd>
        <dt>Desafio para os pais</dt><dd>{step.parentChallenge || empty}</dd>
        <dt>Comemoração</dt><dd>{step.celebration || empty}</dd>
      </dl>
      <dl className="dl stacked"><dt>Mapa do Passo</dt><dd>{step.map.length ? `${step.map.length} perguntas sim/não` : <MapPending />}</dd></dl>
      {flags.length > 0 && (
        <div className="flag-box">
          <Flag size={14} />
          <span>
            <b>Sinalizadores para avaliação (passos {flags[0].fromStep}–{flags[0].toStep}):</b>
            <ul className="bullets">{flags.map((f) => <li key={f.area}><b>{f.area}</b> — {f.trigger}</li>)}</ul>
            Requer avaliação do Dr. André. Não é diagnóstico nem encaminhamento automático.
          </span>
        </div>
      )}
    </div>
  )
}

export function FollowUpPanel({ patient, enrollment, canEdit }: { patient: Patient; enrollment: Enrollment; canEdit: boolean }) {
  const { state, update, user } = useStore()
  const { program, contract } = enrollment
  const sit = followUpSituation(state, patient, enrollment)
  const [selected, setSelected] = useState(sit.step?.n ?? contract.fromStep)
  const [editing, setEditing] = useState<FollowUp | 'new' | null>(null)
  const days = ageDays(patient.birthDate)
  const step = program.steps.find((s) => s.n === selected)!
  const record = sit.records.find((r) => r.step === selected)
  const inContract = selected >= contract.fromStep && selected <= contract.toStep

  const togglePendency = (fid: string, pid: string) =>
    update((s) => ({ ...s, followUps: s.followUps.map((f) => (f.id === fid ? { ...f, pendencies: f.pendencies.map((p) => (p.id === pid ? { ...p, done: !p.done } : p)) } : f)) }))

  const openPendencies = sit.records.flatMap((r) => r.pendencies.map((p) => ({ ...p, step: r.step, fid: r.id }))).filter((p) => !p.done)

  return (
    <div className="followup">
      <Card>
        <div className="followup-summary">
          <div><small className="muted">Programa</small><strong>{program.name}</strong></div>
          <div><small className="muted">Contrato vigente</small><strong>{contract.label}</strong></div>
          <div><small className="muted">Passo atual</small><strong>{sit.step ? `${sit.step.n} de ${program.steps.length}` : '—'}</strong></div>
          <div><small className="muted">Encontros</small><StatusBadge status={sit.status} /></div>
        </div>
        {['Ano 1', 'Ano 2'].map((label, yi) => (
          <div key={label} className="stepper-row">
            <span className="stepper-label">{label}</span>
            <ol className="stepper">
              {program.steps.slice(yi * 8, yi * 8 + 8).map((s) => {
                const done = sit.doneSteps.has(s.n)
                const missing = sit.missing.some((m) => m.n === s.n)
                const current = s.n === sit.step?.n
                const outside = s.n < contract.fromStep || s.n > contract.toStep
                return (
                  <li key={s.n}>
                    <button className={`${done ? 'done' : ''} ${missing ? 'missing' : ''} ${current ? 'current' : ''} ${selected === s.n ? 'selected' : ''} ${outside ? 'outside' : ''}`} onClick={() => setSelected(s.n)} title={s.title}>
                      <span className="dot">{done ? <Check size={14} /> : s.n}</span>
                      <small>{s.rangeLabel}</small>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
        <p className="muted small"><Info size={12} /> Passos sem encontro registrado são apenas informados. Se todo passo exige encontro e quando ele é considerado atrasado ainda será definido com o Dr. André.</p>
      </Card>

      <div className="grid-2 wide-left">
        <Card title={`Passo ${step.n} — ${step.title}`}
          action={canEdit && inContract && (record
            ? <button className="btn btn-ghost btn-sm" onClick={() => setEditing(record)}>Editar encontro</button>
            : <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')} disabled={step.startDay > days}><ClipboardPlus size={15} /> Registrar encontro</button>)}>
          <p className="muted small">{step.rangeLabel} · {fmtDate(addDays(patient.birthDate, step.startDay))} a {fmtDate(addDays(patient.birthDate, step.endDay))}{!inContract && ' · fora do contrato vigente'}</p>
          {record ? (
            <div className="record">
              <p className="record-meta"><span className="type-chip"><EncounterIcon kind={record.kind} /> {record.kind}</span> · {fmtDate(record.date)} · {record.author}
                {record.flaggedForDoctor && <Badge tone="lilac">Requer avaliação do Dr. André</Badge>}</p>
              {step.map.length > 0 && <>
                <h4>Mapa do Passo</h4>
                <ul className="map-answers">
                  {step.map.map((m, i) => (
                    <li key={i}><span>{m.question}<small className="block muted">{m.pillar}</small></span><b className={record.mapAnswers[i] === 'SIM' ? 'yes' : record.mapAnswers[i] === 'NÃO' ? 'no' : 'na'}>{record.mapAnswers[i] ?? '—'}</b></li>
                  ))}
                </ul>
              </>}
              <h4>Observações do acompanhamento</h4>
              <p>{record.evolution || '—'}</p>
              <h4>Orientações para a família</h4>
              <p>{record.orientations || '—'}</p>
              {record.pendencies.length > 0 && <>
                <h4>Pendências</h4>
                <ul className="checks">
                  {record.pendencies.map((p) => (
                    <li key={p.id}>
                      <label><input type="checkbox" checked={p.done} disabled={!canEdit} onChange={() => togglePendency(record.id, p.id)} /> <span className={p.done ? 'striked' : ''}>{p.text}</span></label>
                      {!p.familyVisible && <span className="tag">interno</span>}
                    </li>
                  ))}
                </ul>
              </>}
            </div>
          ) : step.startDay > days ? (
            <Empty title="Passo futuro" text={`Começa em ${fmtDate(addDays(patient.birthDate, step.startDay))}.`} />
          ) : (
            <Empty title="Nenhum encontro registrado neste passo" text={`Encontro do passo: ${step.encounter}.`} />
          )}
          <details className="step-guide" open={!record}>
            <summary>Estrutura do passo (programa)</summary>
            <StepDetails step={step} />
          </details>
        </Card>

        <div className="stack">
          <Card title="Pendências em aberto">
            {openPendencies.length ? (
              <ul className="checks">
                {openPendencies.map((p) => (
                  <li key={p.id}>
                    <label><input type="checkbox" checked={false} disabled={!canEdit} onChange={() => togglePendency(p.fid, p.id)} /> <span>{p.text}</span></label>
                    <small className="muted">Passo {p.step}</small>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Sem pendências" />}
          </Card>
          <Card title="O que a técnica de enfermagem pode conduzir">
            <p className="small muted">{TEAM_INTRO}</p>
            <p className="small mt"><b>Pode conduzir:</b></p>
            <ul className="bullets small">{TEAM_CAN.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="small mt"><b>Não pode conduzir (sempre encaminhar ao médico):</b></p>
            <ul className="bullets small">{TEAM_CANNOT.map((t) => <li key={t}>{t}</li>)}</ul>
          </Card>
        </div>
      </div>

      {editing && user && (
        <FollowUpForm patient={patient} programId={program.id} step={step} record={editing === 'new' ? undefined : editing} author={user.name} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function FollowUpForm({ patient, programId, step, record, author, onClose }: { patient: Patient; programId: string; step: ProgramStep; record?: FollowUp; author: string; onClose: () => void }) {
  const { update, toast } = useStore()
  const [kind, setKind] = useState<EncounterKind>(record?.kind ?? 'Consulta com o Dr. André')
  const [date, setDate] = useState(record?.date ?? TODAY)
  const [mapAnswers, setMapAnswers] = useState<FollowUp['mapAnswers']>(record?.mapAnswers ?? {})
  const [evolution, setEvolution] = useState(record?.evolution ?? '')
  const [orientations, setOrientations] = useState(record?.orientations ?? '')
  const [pendencies, setPendencies] = useState<Pendency[]>(record?.pendencies ?? [])
  const [flagged, setFlagged] = useState(record?.flaggedForDoctor ?? false)
  const [newP, setNewP] = useState('')

  const addP = () => {
    if (!newP.trim()) return
    setPendencies([...pendencies, { id: uid(), text: newP.trim(), done: false, familyVisible: true }])
    setNewP('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const data: FollowUp = {
      id: record?.id ?? uid(), patientId: patient.id, programId, step: step.n, kind, date,
      author: record?.author ?? (kind === 'Triagem com a equipe' ? `${author} (registro da triagem)` : author),
      mapAnswers, evolution, orientations, pendencies, flaggedForDoctor: flagged,
    }
    update((s) => ({ ...s, followUps: record ? s.followUps.map((f) => (f.id === record.id ? data : f)) : [...s.followUps, data] }))
    toast(record ? 'Encontro atualizado' : 'Encontro registrado')
    onClose()
  }

  return (
    <Modal wide title={`${record ? 'Editar' : 'Registrar'} encontro — Passo ${step.n}: ${step.title}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="fu-form">Salvar</button></>}>
      <form id="fu-form" className="form-grid" onSubmit={submit}>
        <div className="field field-full">
          <span>Tipo de encontro</span>
          <div className="segmented">
            {(['Consulta com o Dr. André', 'Triagem com a equipe'] as EncounterKind[]).map((k) => (
              <button type="button" key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}><EncounterIcon kind={k} /> {k}</button>
            ))}
          </div>
        </div>
        <Field label="Data do encontro"><input type="date" value={date} max={TODAY} min={patient.birthDate} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Faixa do passo"><input value={step.rangeLabel} disabled /></Field>

        <div className="field field-full">
          <span>Mapa do Passo (SIM/NÃO)</span>
          {step.map.length ? (
            <ul className="map-answers editable">
              {step.map.map((m, i) => (
                <li key={i}>
                  <span>{m.question}<small className="block muted">{m.pillar}</small></span>
                  <span className="segmented sm">
                    {(['SIM', 'NÃO'] as const).map((v) => (
                      <button type="button" key={v} className={mapAnswers[i] === v ? 'active' : ''} onClick={() => setMapAnswers({ ...mapAnswers, [i]: v })}>{v}</button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          ) : <MapPending />}
        </div>

        <Field label="Observações do acompanhamento" full hint="Registro do programa. Não substitui o prontuário — o prontuário clínico continua no Clínica Experts.">
          <textarea rows={3} value={evolution} onChange={(e) => setEvolution(e.target.value)} />
        </Field>
        <Field label="Orientações para a família" full hint={kind === 'Triagem com a equipe' ? 'Na triagem, a equipe reforça orientações previamente definidas pelo médico.' : undefined}>
          <textarea rows={3} value={orientations} onChange={(e) => setOrientations(e.target.value)} />
        </Field>
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
            <input value={newP} onChange={(e) => setNewP(e.target.value)} placeholder="Nova pendência" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addP() } }} />
            <button type="button" className="btn btn-soft btn-sm" onClick={addP}><Plus size={14} /> Adicionar</button>
          </span>
        </div>
        <label className="check field-full"><input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} /> <Flag size={14} /> Requer avaliação do Dr. André (sinalizador — a decisão é do médico)</label>
      </form>
    </Modal>
  )
}
