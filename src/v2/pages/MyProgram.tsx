import { useState } from 'react'
import { BookOpen, CheckSquare, Flag, Lock, PartyPopper, PlayCircle, Sparkles, Target, Compass, ListChecks } from 'lucide-react'
import { useStore } from '../store'
import { Artwork, Card, Empty, PageHeader, Progress } from '../ui'
import { activeEnrollment, addDays, ageLabel, currentSale, currentStepOf, firstName, fmtDate } from '../utils'
import { useChild } from './FamilyHome'

type Section = 'overview' | 'orientations' | 'videos' | 'support' | 'checklist' | 'challenge'

const SECTIONS: Array<{ id: Section; label: string; icon: typeof Compass }> = [
  { id: 'overview', label: 'Visão geral', icon: Compass },
  { id: 'orientations', label: 'Orientações', icon: ListChecks },
  { id: 'videos', label: 'Vídeos', icon: PlayCircle },
  { id: 'support', label: 'Material de apoio', icon: BookOpen },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'challenge', label: 'Desafio da fase', icon: Flag },
]

export function MyProgram() {
  const { state, update, go } = useStore()
  const child = useChild()
  const enr = child && activeEnrollment(state, child.id)
  const current = enr && child ? currentStepOf(enr.program, child) : undefined
  const [selected, setSelected] = useState<number | null>(null)
  const [section, setSection] = useState<Section>('overview')

  if (!child) return null
  if (!enr || !current) {
    const pending = currentSale(state, child.id)?.status === 'Pendente'
    return (
      <>
        <PageHeader title="Meu programa" />
        <div className="card locked-card">
          <span className="hero-lock"><Lock size={36} strokeWidth={1.4} /></span>
          <h2>{pending ? 'Programa aguardando confirmação de pagamento' : `${firstName(child.name)} ainda não participa de um programa`}</h2>
          <p className="muted">{pending ? 'Os passos serão liberados assim que o pagamento for confirmado pela secretaria.' : 'Os programas Primeiros Passos acompanham cada fase com encontros periódicos, orientações e materiais. Fale com a secretaria para saber mais.'}</p>
        </div>
      </>
    )
  }

  const program = enr.program
  const step = program.steps.find((s) => s.n === (selected ?? current.n)) ?? current
  const locked = step.n > current.n
  const key = `${child.id}:${program.id}:${step.n}`
  const checked = state.stepProgress[key] ?? []
  const contents = state.contents.filter((c) => c.published && c.programId === program.id && c.step === step.n)
  const record = state.followUps.find((f) => f.patientId === child.id && f.programId === program.id && f.step === step.n)

  const toggle = (i: number) => update((s) => {
    const list = s.stepProgress[key] ?? []
    return { ...s, stepProgress: { ...s.stepProgress, [key]: list.includes(i) ? list.filter((x) => x !== i) : [...list, i] } }
  })

  return (
    <>
      <PageHeader title={program.name} subtitle={program.ageLabel}
        actions={<span className="date-chip">{firstName(child.name)} – {ageLabel(child.birthDate, undefined, true)}</span>} />
      <Card>
        <ol className="stepper">
          {program.steps.map((s) => (
            <li key={s.n}>
              <button className={`${s.n < current.n ? 'done' : ''} ${s.n === current.n ? 'current' : ''} ${s.n === step.n ? 'selected' : ''} ${s.n > current.n ? 'future' : ''}`} onClick={() => { setSelected(s.n); setSection('overview') }}>
                <span className="dot">{s.n > current.n ? <Lock size={12} /> : s.n}</span>
                <small>{s.startDay}–{s.endDay} dias</small>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <div className="journey">
        <div className="journey-head">
          <h2>Passo {step.n} — {step.startDay} a {step.endDay} dias</h2>
          <p>{step.title}</p>
        </div>
        {locked ? (
          <Card><Empty icon={<Lock />} title="Este passo ainda não começou" text={`Será liberado em ${fmtDate(addDays(child.birthDate, step.startDay))}, quando ${firstName(child.name)} completar ${step.startDay} dias.`} /></Card>
        ) : (
          <div className="journey-grid">
            <nav className="subnav">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}><Icon size={16} /> {label}</button>
              ))}
            </nav>
            <Card className="journey-body">
              {section === 'overview' && (
                <div className="overview">
                  <Artwork seed={child.name + step.n} className="overview-art" />
                  <div>
                    <h4>Principais temas desta fase</h4>
                    <ul className="theme-list">{step.themes.map((t) => <li key={t}><Sparkles size={15} /> {t}</li>)}</ul>
                  </div>
                  <div className="overview-foot">
                    <p><Target size={16} /> <span><b>Meta do passo</b><br />{step.goal}</span></p>
                    <p><Flag size={16} /> <span><b>Desafio para os pais</b><br />{step.challenge}</span></p>
                    <p><PartyPopper size={16} /> <span><b>Comemoração</b><br />{step.celebration}</span></p>
                  </div>
                  <div className="overview-progress">
                    <small>Checklist: {checked.length} de {step.checklist.length}</small>
                    <Progress value={step.checklist.length ? (checked.length / step.checklist.length) * 100 : 0} />
                  </div>
                </div>
              )}
              {section === 'orientations' && (
                <>
                  <h4>Orientações do passo</h4>
                  <ul className="bullets">{step.orientations.map((o) => <li key={o}>{o}</li>)}</ul>
                  {record && (
                    <div className="note">
                      <b>Do seu encontro em {fmtDate(record.date)} ({record.author}):</b>
                      <p className="pre">{record.orientations}</p>
                      {record.pendencies.filter((p) => p.familyVisible && !p.done).length > 0 && <>
                        <b>Pendências</b>
                        <ul className="bullets">{record.pendencies.filter((p) => p.familyVisible && !p.done).map((p) => <li key={p.id}>{p.text}</li>)}</ul>
                      </>}
                    </div>
                  )}
                </>
              )}
              {(section === 'videos' || section === 'support') && (() => {
                const list = contents.filter((c) => (section === 'videos' ? c.type === 'video' : c.type !== 'video'))
                return list.length ? (
                  <div className="media-grid">
                    {list.map((m) => (
                      <button key={m.id} className="media-card" onClick={() => go('materials', m.id)}>
                        <Artwork seed={m.id} kind={m.type === 'video' ? 'video' : m.type === 'imagem' ? 'image' : 'baby'} />
                        <strong>{m.title}</strong><small>{m.summary}</small>
                      </button>
                    ))}
                  </div>
                ) : <Empty title={section === 'videos' ? 'Nenhum vídeo neste passo' : 'Nenhum material neste passo'} />
              })()}
              {section === 'checklist' && (
                <>
                  <h4>Checklist do passo</h4>
                  <ul className="checks big">
                    {step.checklist.map((c, i) => (
                      <li key={c}><label><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} /> <span className={checked.includes(i) ? 'striked' : ''}>{c}</span></label></li>
                    ))}
                  </ul>
                  {step.checklist.length > 0 && checked.length === step.checklist.length && <p className="alert alert-green">Checklist completo! 🎉</p>}
                </>
              )}
              {section === 'challenge' && (
                <div className="challenge">
                  <Flag size={28} />
                  <h4>Desafio da fase</h4>
                  <p>{step.challenge}</p>
                  <p className="muted small">Marque no checklist e conte para a equipe em Mensagens.</p>
                  <button className="btn btn-soft" onClick={() => go('messages')}>Contar para a equipe</button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
