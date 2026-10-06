import { useState, type FormEvent } from 'react'
import { ArrowLeft, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { isClinical, useStore } from '../store'
import type { Program, ProgramStep } from '../types'
import { Card, Empty, Field, Modal, PageHeader, PatientName, StatusBadge } from '../ui'
import { activeEnrollment, currentStepOf, money, uid } from '../utils'

export function Programs() {
  const { state, go, user } = useStore()
  const [creating, setCreating] = useState(false)
  const canEdit = user?.role === 'admin' || user?.role === 'doctor'

  return (
    <>
      <PageHeader title="Programas" subtitle="Programas de acompanhamento oferecidos pela clínica."
        actions={canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Novo programa</button>} />
      <div className="program-grid">
        {state.programs.map((p) => {
          const enrolled = state.patients.filter((pt) => activeEnrollment(state, pt.id)?.program.id === p.id).length
          return (
            <button key={p.id} className="card program-card" onClick={() => go('program', p.id)}>
              <span className="stat-icon tone-green"><Layers /></span>
              <h3>{p.name}</h3>
              <p className="program-age">{p.ageLabel}</p>
              <p className="muted small">{p.description}</p>
              <dl className="mini-dl">
                <div><dt>Passos</dt><dd>{p.steps.length}</dd></div>
                <div><dt>Encontros</dt><dd>a cada {p.cadenceDays} d</dd></div>
                <div><dt>Valor</dt><dd>{money(p.price)}</dd></div>
                <div><dt>Ativos</dt><dd>{enrolled}</dd></div>
              </dl>
              {!p.active && <StatusBadge status="Inativo" />}
            </button>
          )
        })}
        <div className="card program-card ghost">
          <span className="stat-icon tone-gray"><Plus /></span>
          <h3>Outros programas futuros</h3>
          <p className="muted small">Gestante, 2 a 3 anos, sono, introdução alimentar… Crie novos programas com seus próprios passos.</p>
          {canEdit && <button className="btn btn-soft btn-sm" onClick={() => setCreating(true)}>Criar programa</button>}
        </div>
      </div>
      {creating && <ProgramForm onClose={() => setCreating(false)} />}
    </>
  )
}

export function ProgramDetail() {
  const { state, route, go, user, update, toast } = useStore()
  const program = state.programs.find((p) => p.id === route.id)
  const [editing, setEditing] = useState(false)
  const [editingStep, setEditingStep] = useState<ProgramStep | 'new' | null>(null)
  if (!program || !user) return <Empty title="Programa não encontrado" />
  const canEdit = isClinical(user.role)
  const enrolled = state.patients.map((p) => ({ p, enr: activeEnrollment(state, p.id) })).filter((x) => x.enr?.program.id === program.id)

  const removeStep = (n: number) => {
    if (!confirm(`Remover o passo ${n}? Registros de acompanhamento existentes não são apagados.`)) return
    update((s) => ({ ...s, programs: s.programs.map((p) => (p.id === program.id ? { ...p, steps: p.steps.filter((x) => x.n !== n).map((x, i) => ({ ...x, n: i + 1 })) } : p)) }))
    toast('Passo removido')
  }

  return (
    <>
      <button className="back" onClick={() => go('programs')}><ArrowLeft size={16} /> Programas</button>
      <PageHeader title={`${program.name} · ${program.ageLabel}`} subtitle={program.description}
        actions={canEdit && <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Editar programa</button>} />
      <div className="grid-2 wide-left">
        <Card title={`Etapas (${program.steps.length})`} action={canEdit && <button className="btn btn-soft btn-sm" onClick={() => setEditingStep('new')}><Plus size={14} /> Passo</button>}>
          <ol className="step-list">
            {program.steps.map((s) => (
              <li key={s.n}>
                <span className="step-n">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <small className="muted">{s.startDay}–{s.endDay} dias · {s.subtitle}</small>
                  <p className="small">{s.goal}</p>
                  <p className="chips">{s.themes.map((t) => <span key={t} className="tag">{t}</span>)}</p>
                </div>
                {canEdit && (
                  <span className="row-actions">
                    <button className="icon-btn" aria-label="Editar passo" onClick={() => setEditingStep(s)}><Pencil size={15} /></button>
                    <button className="icon-btn" aria-label="Remover passo" onClick={() => removeStep(s.n)}><Trash2 size={15} /></button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Card>
        <Card title={`Pacientes no programa (${enrolled.length})`}>
          {enrolled.length ? (
            <ul className="simple-list">
              {enrolled.map(({ p, enr }) => (
                <li key={p.id} className="clickable" onClick={() => go('patient', p.id, 'followup')}>
                  <PatientName patient={p} sub={`Passo ${currentStepOf(enr!.program, p)?.n ?? '—'}`} />
                </li>
              ))}
            </ul>
          ) : <Empty title="Nenhum paciente ativo" />}
        </Card>
      </div>
      {editing && <ProgramForm program={program} onClose={() => setEditing(false)} />}
      {editingStep && <StepForm program={program} step={editingStep === 'new' ? undefined : editingStep} onClose={() => setEditingStep(null)} />}
    </>
  )
}

function ProgramForm({ program, onClose }: { program?: Program; onClose: () => void }) {
  const { update, toast, go } = useStore()
  const [f, setF] = useState({
    name: program?.name ?? '', ageLabel: program?.ageLabel ?? '', startAgeDays: String(program?.startAgeDays ?? 0), endAgeDays: String(program?.endAgeDays ?? 365),
    cadenceDays: String(program?.cadenceDays ?? 45), price: String(program?.price ?? ''), description: program?.description ?? '', active: program?.active ?? true,
  })
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const start = Number(f.startAgeDays), end = Number(f.endAgeDays), cad = Number(f.cadenceDays), price = Number(f.price.replace(',', '.'))
    if (!f.name.trim() || !f.ageLabel.trim()) return setError('Informe nome e faixa etária.')
    if (!(end > start) || !(cad > 0) || !(price >= 0)) return setError('Verifique idades, intervalo e valor.')
    const base = { name: f.name.trim(), ageLabel: f.ageLabel.trim(), startAgeDays: start, endAgeDays: end, cadenceDays: cad, price, description: f.description, active: f.active }
    if (program) {
      update((s) => ({ ...s, programs: s.programs.map((p) => (p.id === program.id ? { ...p, ...base } : p)) }))
      toast('Programa atualizado')
      onClose()
    } else {
      // Gera passos vazios conforme o intervalo entre encontros.
      const steps: ProgramStep[] = []
      for (let d = start, n = 1; d < end; d += cad, n++) {
        steps.push({ n, startDay: d, endDay: Math.min(end, d + cad), title: `Passo ${n}`, subtitle: '', goal: '', themes: [], orientations: [], checklist: [], challenge: '', celebration: '' })
      }
      const id = `pr-${uid()}`
      update((s) => ({ ...s, programs: [...s.programs, { id, ...base, steps }] }))
      toast(`Programa criado com ${steps.length} passos`)
      onClose()
      go('program', id)
    }
  }

  return (
    <Modal title={program ? 'Editar programa' : 'Novo programa'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="program-form">Salvar</button></>}>
      <form id="program-form" className="form-grid" onSubmit={submit}>
        <Field label="Nome"><input value={f.name} onChange={set('name')} placeholder="Primeiros Passos" /></Field>
        <Field label="Faixa etária (rótulo)"><input value={f.ageLabel} onChange={set('ageLabel')} placeholder="2 a 3 anos" /></Field>
        <Field label="Idade inicial (dias)"><input type="number" value={f.startAgeDays} onChange={set('startAgeDays')} /></Field>
        <Field label="Idade final (dias)"><input type="number" value={f.endAgeDays} onChange={set('endAgeDays')} /></Field>
        <Field label="Encontro a cada (dias)"><input type="number" value={f.cadenceDays} onChange={set('cadenceDays')} disabled={!!program} /></Field>
        <Field label="Valor (R$)"><input inputMode="decimal" value={f.price} onChange={set('price')} /></Field>
        <Field label="Descrição" full><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
        <label className="check field-full"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Disponível para venda</label>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

function StepForm({ program, step, onClose }: { program: Program; step?: ProgramStep; onClose: () => void }) {
  const { update, toast } = useStore()
  const last = program.steps[program.steps.length - 1]
  const [f, setF] = useState({
    title: step?.title ?? '', subtitle: step?.subtitle ?? '', startDay: String(step?.startDay ?? last?.endDay ?? program.startAgeDays),
    endDay: String(step?.endDay ?? (last?.endDay ?? program.startAgeDays) + program.cadenceDays), goal: step?.goal ?? '',
    themes: step?.themes.join('\n') ?? '', orientations: step?.orientations.join('\n') ?? '', checklist: step?.checklist.join('\n') ?? '',
    challenge: step?.challenge ?? '', celebration: step?.celebration ?? '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.title.trim()) return
    const data: ProgramStep = {
      n: step?.n ?? program.steps.length + 1, startDay: Number(f.startDay), endDay: Number(f.endDay), title: f.title.trim(), subtitle: f.subtitle, goal: f.goal,
      themes: lines(f.themes), orientations: lines(f.orientations), checklist: lines(f.checklist), challenge: f.challenge, celebration: f.celebration,
    }
    update((s) => ({ ...s, programs: s.programs.map((p) => (p.id === program.id ? { ...p, steps: step ? p.steps.map((x) => (x.n === step.n ? data : x)) : [...p.steps, data] } : p)) }))
    toast(step ? 'Passo atualizado' : 'Passo adicionado')
    onClose()
  }

  return (
    <Modal wide title={step ? `Editar passo ${step.n}` : 'Novo passo'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="step-form">Salvar</button></>}>
      <form id="step-form" className="form-grid" onSubmit={submit}>
        <Field label="Título"><input value={f.title} onChange={set('title')} autoFocus /></Field>
        <Field label="Subtítulo"><input value={f.subtitle} onChange={set('subtitle')} /></Field>
        <Field label="Início (dias de vida)"><input type="number" value={f.startDay} onChange={set('startDay')} /></Field>
        <Field label="Fim (dias de vida)"><input type="number" value={f.endDay} onChange={set('endDay')} /></Field>
        <Field label="Meta do passo" full><textarea rows={2} value={f.goal} onChange={set('goal')} /></Field>
        <Field label="Temas (um por linha)"><textarea rows={4} value={f.themes} onChange={set('themes')} /></Field>
        <Field label="Orientações (uma por linha)"><textarea rows={4} value={f.orientations} onChange={set('orientations')} /></Field>
        <Field label="Checklist da família (um por linha)"><textarea rows={4} value={f.checklist} onChange={set('checklist')} /></Field>
        <div className="stack">
          <Field label="Desafio para os pais"><textarea rows={2} value={f.challenge} onChange={set('challenge')} /></Field>
          <Field label="Comemoração"><input value={f.celebration} onChange={set('celebration')} /></Field>
        </div>
      </form>
    </Modal>
  )
}
