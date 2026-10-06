import { useState } from 'react'
import { BookOpen, Check, ClipboardCheck, Compass, Flag, Lock, PartyPopper, Sparkles, Target, CalendarCheck, Info } from 'lucide-react'
import { EncounterIcon, MapPending } from '../panels/FollowUpPanel'
import { useStore } from '../store'
import type { Program } from '../types'
import { Artwork, Card, Empty, PageHeader, StatusBadge } from '../ui'
import { activeEnrollment, addDays, ageDays, ageLabel, contractOf, currentSale, currentStepOf, firstName, fmtDate, money, programStatus } from '../utils'
import { useChild } from './FamilyHome'

type Section = 'overview' | 'encounter' | 'map' | 'contents' | 'challenge'

const SECTIONS: Array<{ id: Section; label: string; icon: typeof Compass }> = [
  { id: 'overview', label: 'Visão geral', icon: Compass },
  { id: 'encounter', label: 'Encontro do passo', icon: CalendarCheck },
  { id: 'map', label: 'Mapa do Passo', icon: ClipboardCheck },
  { id: 'contents', label: 'Conteúdos', icon: BookOpen },
  { id: 'challenge', label: 'Desafio dos pais', icon: Flag },
]

/** Programa apresentado como produto (para famílias sem programa ativo). */
export function ProgramOffer({ program }: { program: Program }) {
  return (
    <Card title={`${program.name} · ${program.ageLabel}`}>
      <p className="muted">{program.description}</p>
      <ul className="checks mt">{program.benefits.map((b) => <li key={b}><span className="check"><Check size={14} className="text-green" /> {b}</span></li>)}</ul>
      <ul className="contract-list mt">{program.contracts.map((c) => <li key={c.id}><span>{c.label}</span><small>{c.durationMonths} meses</small><b>{money(c.price)}</b></li>)}</ul>
    </Card>
  )
}

export function MyProgram() {
  const { state, update, go } = useStore()
  const child = useChild()
  const enr = child && activeEnrollment(state, child.id)
  const current = enr && child ? currentStepOf(enr.program, child) : undefined
  const [selected, setSelected] = useState<number | null>(null)
  const [section, setSection] = useState<Section>('overview')

  if (!child) return null
  if (!enr || !current) {
    const sale = currentSale(state, child.id)
    const status = sale && programStatus(sale)
    const program = (sale && state.programs.find((p) => p.id === sale.programId)) ?? state.programs.find((p) => p.active)
    const contract = sale && contractOf(program, sale.contractId)
    return (
      <>
        <PageHeader title="Meu programa" />
        <div className="card locked-card">
          <span className="hero-lock"><Sparkles size={34} strokeWidth={1.4} /></span>
          <h2>
            {status === 'Pagamento pendente' ? 'Programa aguardando ativação'
              : status === 'Programa encerrado' ? `Programa encerrado em ${fmtDate(sale!.endDate)}`
                : `${firstName(child.name)} ainda não participa de um programa`}
          </h2>
          {status && contract && <p><StatusBadge status={status} /> <span className="muted">{program?.name} · {contract.label}</span></p>}
          <p className="muted">
            {status === 'Pagamento pendente' ? 'Assim que o pagamento for registrado pela secretaria, os passos, conteúdos e benefícios do programa ficam disponíveis.'
              : status === 'Programa encerrado' ? 'Para continuar o acompanhamento, fale com a secretaria sobre a renovação.'
                : 'Você continua com acesso ao Crescer. Os programas de acompanhamento oferecem benefícios adicionais — a secretaria pode explicar como funcionam.'}
          </p>
          <p className="demo-note"><Info size={12} /> Protótipo: o que fica disponível sem programa ativo (ou após o término) ainda será definido com o Dr. André.</p>
        </div>
        {program && <div className="mt narrow-center"><ProgramOffer program={program} /></div>}
      </>
    )
  }

  const { program, contract, sale } = enr
  const step = program.steps.find((s) => s.n === (selected ?? current.n)) ?? current
  const outside = step.n < contract.fromStep || step.n > contract.toStep
  const future = step.n > current.n
  const record = state.followUps.find((f) => f.patientId === child.id && f.programId === program.id && f.step === step.n)
  const contents = state.contents.filter((c) => c.published && c.programId === program.id && c.step === step.n)
  const key = `${child.id}:${program.id}:${step.n}`
  const challengeDone = (state.stepProgress[key] ?? []).includes(0)
  const days = ageDays(child.birthDate)
  const pending = <span className="muted">Em preparação pela equipe do Dr. André.</span>

  const toggleChallenge = () => update((s) => ({ ...s, stepProgress: { ...s.stepProgress, [key]: challengeDone ? [] : [0] } }))

  return (
    <>
      <PageHeader title={program.name} subtitle={`${contract.label} · vigência até ${fmtDate(sale.endDate)}`}
        actions={<span className="date-chip">{firstName(child.name)} — {ageLabel(child.birthDate, undefined, true)}</span>} />
      <Card>
        {['Ano 1', 'Ano 2'].map((label, yi) => (
          <div key={label} className="stepper-row">
            <span className="stepper-label">{label}</span>
            <ol className="stepper">
              {program.steps.slice(yi * 8, yi * 8 + 8).map((s) => {
                const isOutside = s.n < contract.fromStep || s.n > contract.toStep
                return (
                  <li key={s.n}>
                    <button className={`${s.n < current.n ? 'done' : ''} ${s.n === current.n ? 'current' : ''} ${s.n === step.n ? 'selected' : ''} ${s.n > current.n ? 'future' : ''} ${isOutside ? 'outside' : ''}`}
                      onClick={() => { setSelected(s.n); setSection('overview') }} title={s.title}>
                      <span className="dot">{s.n > current.n ? <Lock size={12} /> : s.n}</span>
                      <small>{s.rangeLabel}</small>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </Card>

      <div className="journey">
        <div className="journey-head">
          <h2>Passo {step.n} — {step.rangeLabel}</h2>
          <p>{step.title}</p>
        </div>
        {future ? (
          <Card><Empty icon={<Lock />} title="Este passo ainda não começou" text={`Começa em ${fmtDate(addDays(child.birthDate, step.startDay))}, quando ${firstName(child.name)} completar ${step.startDay} dias.`} /></Card>
        ) : outside && step.n < contract.fromStep && days >= step.endDay ? (
          <Card><Empty title="Passo de um contrato anterior" text={`Este passo pertence ao ${step.n <= 8 ? 'Ano 1' : 'Ano 2'}. O que fica acessível de contratos anteriores ainda será definido.`} /></Card>
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
                    <h4>Tema central</h4>
                    <p className="lead">{step.title}</p>
                    <h4 className="mt">Principais desafios desta fase</h4>
                    {step.challenges.length ? <ul className="theme-list">{step.challenges.map((t) => <li key={t}><Sparkles size={15} /> {t}</li>)}</ul> : <p>{pending}</p>}
                  </div>
                  <div className="overview-foot">
                    <p><Target size={16} /> <span><b>Meta evolutiva</b><br />{step.goal || pending}</span></p>
                    <p><Flag size={16} /> <span><b>Desafio para os pais</b><br />{step.parentChallenge || pending}</span></p>
                    <p><PartyPopper size={16} /> <span><b>Comemoração</b><br />{step.celebration || pending}</span></p>
                  </div>
                </div>
              )}
              {section === 'encounter' && (
                <>
                  <h4>Encontro do passo</h4>
                  <p>{step.encounter}.</p>
                  {record ? (
                    <div className="note">
                      <p className="record-meta"><span className="type-chip"><EncounterIcon kind={record.kind} /> {record.kind}</span> · {fmtDate(record.date)}</p>
                      {record.orientations && <><b>Orientações</b><p className="pre">{record.orientations}</p></>}
                      {record.pendencies.filter((p) => p.familyVisible).length > 0 && <>
                        <b>Pendências deste passo</b>
                        <ul className="bullets">{record.pendencies.filter((p) => p.familyVisible).map((p) => <li key={p.id} className={p.done ? 'striked' : ''}>{p.text}</li>)}</ul>
                      </>}
                    </div>
                  ) : (
                    <p className="muted mt">Nenhum encontro registrado neste passo ainda. <button className="link-btn" onClick={() => go('agenda')}>Ver agenda</button></p>
                  )}
                  <p className="demo-note"><Info size={12} /> Se pendências de passos anteriores continuam aparecendo nos passos seguintes ainda será validado com o Dr. André.</p>
                </>
              )}
              {section === 'map' && (
                <>
                  <h4>Mapa do Passo</h4>
                  <p className="muted small">Checklist objetivo sim/não por pilar, aplicado no encontro do passo.</p>
                  {step.map.length ? (
                    <ul className="map-answers">
                      {step.map.map((m, i) => (
                        <li key={i}><span>{m.question}<small className="block muted">{m.pillar}</small></span><b className={record?.mapAnswers[i] === 'SIM' ? 'yes' : record?.mapAnswers[i] === 'NÃO' ? 'no' : 'na'}>{record?.mapAnswers[i] ?? 'a aplicar'}</b></li>
                      ))}
                    </ul>
                  ) : <div className="mt"><MapPending /></div>}
                </>
              )}
              {section === 'contents' && (contents.length ? (
                <div className="media-grid">
                  {contents.map((m) => (
                    <button key={m.id} className="media-card" onClick={() => go('materials', m.id)}>
                      <Artwork seed={m.id} kind={m.type === 'video' ? 'video' : m.type === 'imagem' ? 'image' : 'baby'} />
                      <strong>{m.title}</strong><small>{m.summary}</small>
                    </button>
                  ))}
                </div>
              ) : <Empty title="Nenhum conteúdo neste passo ainda" />)}
              {section === 'challenge' && (
                <div className="challenge">
                  <Flag size={28} />
                  <h4>Desafio para os pais</h4>
                  <p>{step.parentChallenge || pending}</p>
                  {step.parentChallenge && (
                    <button className={`btn ${challengeDone ? 'btn-soft' : 'btn-primary'}`} onClick={toggleChallenge}>{challengeDone ? <><Check size={15} /> Desafio realizado</> : 'Marcar como realizado'}</button>
                  )}
                  <button className="link-btn" onClick={() => go('messages')}>Contar para a equipe</button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
