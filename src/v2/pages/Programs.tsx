import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, FileWarning, Layers, Pencil, Plus } from 'lucide-react'
import { ENCOUNTER_DEFINITION, PRICING_REFERENCE, TRIAGE_FLAGS } from '../reference'
import { isClinical, useStore } from '../store'
import type { MapItem, Program, ProgramContract, ProgramStep } from '../types'
import { Badge, Card, Empty, Field, Modal, PageHeader, PatientName } from '../ui'
import { activeEnrollment, currentStepOf, money, uid } from '../utils'
import { CommercialFlow } from './Sales'

export const SOURCE_BADGE: Record<ProgramStep['source'], { tone: 'green' | 'amber' | 'gray'; label: string }> = {
  documento: { tone: 'green', label: 'Conteúdo do documento' },
  demonstrativo: { tone: 'amber', label: 'Texto demonstrativo' },
  pendente: { tone: 'gray', label: 'Conteúdo não cadastrado' },
}

export function Programs() {
  const { state, go, user } = useStore()
  const [creating, setCreating] = useState(false)
  const canEdit = user ? isClinical(user.role) : false

  return (
    <>
      <PageHeader title="Programas" subtitle="Produtos de acompanhamento que podem ser vendidos para uma criança/família."
        actions={canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Novo programa</button>} />
      <CommercialFlow />
      <div className="program-grid">
        {state.programs.map((p) => {
          const enrolled = state.patients.filter((pt) => activeEnrollment(state, pt.id)?.program.id === p.id).length
          return (
            <button key={p.id} className="card program-card" onClick={() => go('program', p.id)}>
              <span className="stat-icon tone-green"><Layers /></span>
              <h3>{p.name}</h3>
              <p className="program-age">{p.ageLabel} · {p.steps.length} passos de {p.stepDays} dias</p>
              <p className="muted small">{p.description}</p>
              <ul className="contract-list">
                {p.contracts.map((c) => <li key={c.id}><span>{c.label}</span><b>{money(c.price)}</b><small>{c.durationMonths} meses</small></li>)}
              </ul>
              <dl className="mini-dl">
                <div><dt>Contratos</dt><dd>{p.contracts.length}</dd></div>
                <div><dt>Passos</dt><dd>{p.steps.length}</dd></div>
                <div><dt>Ativos</dt><dd>{enrolled}</dd></div>
                <div><dt>Venda</dt><dd>{p.active ? 'Disponível' : 'Inativo'}</dd></div>
              </dl>
            </button>
          )
        })}
        <div className="card program-card ghost">
          <span className="stat-icon tone-gray"><Plus /></span>
          <h3>Outros programas/produtos</h3>
          <p className="muted small">O Crescer suporta vários programas, cada um com nome, duração, valor, contratos, passos, conteúdos e benefícios próprios. Nenhum outro programa foi definido ainda.</p>
          {canEdit && <button className="btn btn-soft btn-sm" onClick={() => setCreating(true)}>Cadastrar programa</button>}
        </div>
      </div>
      {creating && <ProgramForm onClose={() => setCreating(false)} />}
    </>
  )
}

export function ProgramDetail() {
  const { state, route, go, user } = useStore()
  const program = state.programs.find((p) => p.id === route.id)
  const [editing, setEditing] = useState(false)
  const [editingStep, setEditingStep] = useState<ProgramStep | null>(null)
  if (!program || !user) return <Empty title="Programa não encontrado" action={<button className="btn btn-ghost" onClick={() => go('programs')}>Ver programas</button>} />
  const canEdit = isClinical(user.role)
  const enrolled = state.patients.map((p) => ({ p, enr: activeEnrollment(state, p.id) })).filter((x) => x.enr?.program.id === program.id)
  const pendingCount = program.steps.filter((s) => s.source !== 'documento').length
  const mapPending = program.steps.filter((s) => !s.map.length).length

  return (
    <>
      <button className="back" onClick={() => go('programs')}><ArrowLeft size={16} /> Programas</button>
      <PageHeader title={program.name} subtitle={`${program.ageLabel} · ${program.steps.length} passos de ${program.stepDays} dias · ${program.description}`}
        actions={canEdit && <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Editar produto</button>} />

      {pendingCount > 0 && (
        <p className="alert alert-amber"><FileWarning size={15} /> {pendingCount} de {program.steps.length} passos sem conteúdo cadastrado.</p>
      )}
      {program.id === 'mpp' && mapPending > 0 && (
        <p className="alert alert-blue"><FileWarning size={15} /> Conteúdo dos 16 passos conforme o documento “Meus Primeiros Passos”. As perguntas sim/não do Mapa do Passo não constam no documento e estão pendentes de definição pelo Dr. André ({mapPending} passos).</p>
      )}

      <div className="grid-3">
        <Card title="Contratos (produto)">
          <ul className="contract-list">
            {program.contracts.map((c) => <li key={c.id}><span>{c.label}<small className="block muted">Passos {c.fromStep}–{c.toStep}</small></span><b>{money(c.price)}</b><small>{c.durationMonths} meses</small></li>)}
          </ul>
          <p className="muted small mt">Valores configuráveis. Dados de demonstração usam o valor da fase piloto do documento.</p>
        </Card>
        <Card title="Benefícios do programa ativo">
          <ul className="checks">{program.benefits.map((b) => <li key={b}><span className="check"><Check size={14} className="text-green" /> {b}</span></li>)}</ul>
        </Card>
        <Card title={`Crianças com programa ativo (${enrolled.length})`}>
          {enrolled.length ? (
            <ul className="simple-list">
              {enrolled.map(({ p, enr }) => (
                <li key={p.id} className="clickable" onClick={() => go('patient', p.id, 'followup')}>
                  <PatientName patient={p} sub={`${enr!.contract.label.split(' —')[0]} · Passo ${currentStepOf(enr!.program, p)?.n ?? '—'}`} />
                </li>
              ))}
            </ul>
          ) : <Empty title="Nenhuma criança ativa" />}
        </Card>
      </div>

      {program.contracts.map((contract) => (
        <Card key={contract.id} className="mt" title={`${contract.label} — passos ${contract.fromStep} a ${contract.toStep}`}>
          <ol className="step-list">
            {program.steps.filter((s) => s.n >= contract.fromStep && s.n <= contract.toStep).map((s) => (
              <li key={s.n}>
                <span className="step-n">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <small className="muted">{s.rangeLabel} · Encontro: {s.encounter}</small>
                  <p className="chips"><Badge tone={SOURCE_BADGE[s.source].tone}>{SOURCE_BADGE[s.source].label}</Badge>{s.map.length > 0 ? <span className="tag">Mapa do Passo: {s.map.length} itens</span> : <span className="tag">Mapa do Passo: perguntas a definir</span>}</p>
                  {s.challenges.length > 0 && <p className="small"><b>Principais desafios:</b> {s.challenges.join('; ')}.</p>}
                  {s.goal && <p className="small"><b>Meta do passo:</b> {s.goal}</p>}
                  {s.parentChallenge && <p className="small"><b>Desafio para os pais:</b> {s.parentChallenge}</p>}
                  {s.celebration && <p className="small"><b>Comemoração:</b> {s.celebration}</p>}
                </div>
                {canEdit && <span className="row-actions"><button className="icon-btn" aria-label="Editar passo" onClick={() => setEditingStep(s)}><Pencil size={15} /></button></span>}
              </li>
            ))}
          </ol>
        </Card>
      ))}

      {program.id === 'mpp' && <>
        <Card className="mt" title="Quando envolver outros profissionais (documento)">
          <p className="muted small">Sinalizadores de triagem a partir do Mapa do Passo — orientam o momento de considerar um encaminhamento e nunca substituem a avaliação clínica do médico responsável, que decide caso a caso.</p>
          <div className="table-wrap mt">
            <table className="table">
              <thead><tr><th>Fase</th><th>Profissional</th><th>Gatilho</th></tr></thead>
              <tbody>{TRIAGE_FLAGS.map((f) => <tr key={f.area + f.fromStep}><td className="nowrap">{f.phase}<small className="block muted">Passos {f.fromStep}–{f.toStep}</small></td><td>{f.area}</td><td>{f.trigger}<small className="block muted">Requer avaliação do Dr. André</small></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
        <Card className="mt" title="Precificação (referência do documento)">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Etapa</th><th>Público</th><th>Valor anual</th><th>Duração do valor</th></tr></thead>
              <tbody>{PRICING_REFERENCE.map((r) => <tr key={r.stage}><td>{r.stage}</td><td>{r.audience}</td><td className="num">{money(r.value)}</td><td>{r.duration}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="muted small mt">Os valores de venda continuam configuráveis nos contratos do programa.</p>
        </Card>
      </>}

      {editing && <ProgramForm program={program} onClose={() => setEditing(false)} />}
      {editingStep && <StepForm program={program} step={editingStep} onClose={() => setEditingStep(null)} />}
    </>
  )
}

function ProgramForm({ program, onClose }: { program?: Program; onClose: () => void }) {
  const { update, toast, go } = useStore()
  const [f, setF] = useState({
    name: program?.name ?? '', ageLabel: program?.ageLabel ?? '', description: program?.description ?? '', active: program?.active ?? true,
    stepDays: String(program?.stepDays ?? 45), stepCount: String(program?.steps.length ?? 8),
    benefits: program?.benefits.join('\n') ?? '',
  })
  const [contracts, setContracts] = useState<ProgramContract[]>(program?.contracts ?? [{ id: uid(), label: 'Contrato 1', fromStep: 1, toStep: 8, durationMonths: 12, price: 0 }])
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const setC = (i: number, patch: Partial<ProgramContract>) => setContracts(contracts.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || !f.ageLabel.trim()) return setError('Informe nome e faixa etária.')
    if (contracts.some((c) => !c.label.trim() || c.price < 0 || c.durationMonths <= 0)) return setError('Verifique os contratos (nome, valor e duração).')
    const base = { name: f.name.trim(), ageLabel: f.ageLabel.trim(), description: f.description, active: f.active, benefits: f.benefits.split('\n').map((x) => x.trim()).filter(Boolean), contracts }
    if (program) {
      update((s) => ({ ...s, programs: s.programs.map((p) => (p.id === program.id ? { ...p, ...base } : p)) }))
      toast('Programa atualizado')
      onClose()
    } else {
      const stepDays = Number(f.stepDays) || 45
      const count = Math.max(1, Number(f.stepCount) || 1)
      const steps: ProgramStep[] = Array.from({ length: count }, (_, i) => ({
        n: i + 1, startDay: i * stepDays, endDay: (i + 1) * stepDays, rangeLabel: `${i * stepDays} a ${(i + 1) * stepDays} dias`, title: `Passo ${i + 1}`,
        challenges: [], encounter: ENCOUNTER_DEFINITION, map: [], goal: '', parentChallenge: '', celebration: '', source: 'pendente',
      }))
      const id = `pr-${uid()}`
      update((s) => ({ ...s, programs: [...s.programs, { id, ...base, startAgeDays: 0, endAgeDays: count * stepDays, stepDays, steps }] }))
      toast('Programa cadastrado')
      onClose()
      go('program', id)
    }
  }

  return (
    <Modal wide title={program ? 'Editar produto/programa' : 'Novo programa'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="program-form">Salvar</button></>}>
      <form id="program-form" className="form-grid" onSubmit={submit}>
        <Field label="Nome"><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Faixa etária (rótulo)"><input value={f.ageLabel} onChange={set('ageLabel')} /></Field>
        {!program && <Field label="Duração de cada passo (dias)"><input type="number" value={f.stepDays} onChange={set('stepDays')} /></Field>}
        {!program && <Field label="Quantidade de passos"><input type="number" value={f.stepCount} onChange={set('stepCount')} /></Field>}
        <Field label="Descrição" full><textarea rows={2} value={f.description} onChange={set('description')} /></Field>
        <Field label="Benefícios do programa ativo (um por linha)" full><textarea rows={4} value={f.benefits} onChange={set('benefits')} /></Field>
        <div className="field field-full">
          <span>Contratos vendáveis</span>
          {contracts.map((c, i) => (
            <div key={c.id} className="contract-row">
              <input value={c.label} onChange={(e) => setC(i, { label: e.target.value })} aria-label="Nome do contrato" />
              <input type="number" value={c.fromStep} onChange={(e) => setC(i, { fromStep: Number(e.target.value) })} aria-label="Passo inicial" title="Passo inicial" />
              <input type="number" value={c.toStep} onChange={(e) => setC(i, { toStep: Number(e.target.value) })} aria-label="Passo final" title="Passo final" />
              <input type="number" value={c.durationMonths} onChange={(e) => setC(i, { durationMonths: Number(e.target.value) })} aria-label="Duração (meses)" title="Duração (meses)" />
              <input type="number" value={c.price} onChange={(e) => setC(i, { price: Number(e.target.value) })} aria-label="Valor (R$)" title="Valor (R$)" />
            </div>
          ))}
          <small>Colunas: nome · passo inicial · passo final · duração (meses) · valor (R$)</small>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setContracts([...contracts, { id: uid(), label: `Contrato ${contracts.length + 1}`, fromStep: 1, toStep: 1, durationMonths: 12, price: 0 }])}><Plus size={14} /> Contrato</button>
        </div>
        <label className="check field-full"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Disponível para venda</label>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const mapToText = (m: MapItem[]) => m.map((i) => `${i.pillar} | ${i.question}`).join('\n')
const textToMap = (s: string): MapItem[] => lines(s).map((l) => {
  const [a, b] = l.split('|').map((x) => x.trim())
  return b ? { pillar: a, question: b } : { pillar: 'Geral', question: a }
})

function StepForm({ program, step, onClose }: { program: Program; step: ProgramStep; onClose: () => void }) {
  const { update, toast } = useStore()
  const [f, setF] = useState({
    title: step.title, challenges: step.challenges.join('\n'), encounter: step.encounter, map: mapToText(step.map),
    goal: step.goal, parentChallenge: step.parentChallenge, celebration: step.celebration, source: step.source,
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const data: ProgramStep = { ...step, title: f.title.trim() || step.title, challenges: lines(f.challenges), encounter: f.encounter, map: textToMap(f.map), goal: f.goal, parentChallenge: f.parentChallenge, celebration: f.celebration, source: f.source as ProgramStep['source'] }
    update((s) => ({ ...s, programs: s.programs.map((p) => (p.id === program.id ? { ...p, steps: p.steps.map((x) => (x.n === step.n ? data : x)) } : p)) }))
    toast(`Passo ${step.n} atualizado`)
    onClose()
  }

  return (
    <Modal wide title={`Passo ${step.n} — ${step.rangeLabel}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="step-form">Salvar</button></>}>
      <form id="step-form" className="form-grid" onSubmit={submit}>
        <Field label="Tema central"><input value={f.title} onChange={set('title')} /></Field>
        <Field label="Origem do texto">
          <select value={f.source} onChange={set('source')}>
            <option value="documento">Texto do documento</option><option value="demonstrativo">Demonstrativo</option><option value="pendente">Não cadastrado</option>
          </select>
        </Field>
        <Field label="Principais desafios (um por linha)"><textarea rows={4} value={f.challenges} onChange={set('challenges')} /></Field>
        <Field label="Encontro do passo"><textarea rows={4} value={f.encounter} onChange={set('encounter')} /></Field>
        <Field label="Mapa do Passo — checklist SIM/NÃO (uma pergunta por linha: Pilar | Pergunta)" full><textarea rows={5} value={f.map} onChange={set('map')} /></Field>
        <Field label="Meta evolutiva" full><textarea rows={2} value={f.goal} onChange={set('goal')} /></Field>
        <Field label="Desafio para os pais"><textarea rows={2} value={f.parentChallenge} onChange={set('parentChallenge')} /></Field>
        <Field label="Comemoração"><textarea rows={2} value={f.celebration} onChange={set('celebration')} /></Field>
      </form>
    </Modal>
  )
}
