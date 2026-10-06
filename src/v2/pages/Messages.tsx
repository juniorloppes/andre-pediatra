import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Flag, Info, MessageCirclePlus, Search, Send, Sparkles } from 'lucide-react'
import { conversationsFor, familyCanSend } from '../domain'
import { ROLE_REPLY_LABEL, useStore } from '../store'
import type { Conversation, Patient } from '../types'
import { Avatar, Empty, Field, Modal, PageHeader } from '../ui'
import { activeEnrollment, currentSale, fmtDate, fmtTime, normalize, programStatus, TODAY, uid } from '../utils'
import { useChild } from './FamilyHome'

const nowIso = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`

export function Messages() {
  const { user } = useStore()
  return user?.role === 'parent' ? <FamilyMessages /> : <TeamMessages />
}

/** Texto amigável quando a família não pode enviar mensagens (sem linguagem de cobrança). */
function MessagingBenefitNotice({ patientId }: { patientId: string }) {
  const { state } = useStore()
  const sale = currentSale(state, patientId)
  const status = sale && programStatus(sale)
  const detail = status === 'Pagamento pendente'
    ? 'Assim que o programa for ativado, o canal fica disponível automaticamente.'
    : status === 'Programa encerrado'
      ? 'O programa desta criança está encerrado. Para voltar a usar o canal, fale com a secretaria sobre a renovação.'
      : 'Ele faz parte dos benefícios dos programas de acompanhamento Crescer. A secretaria pode explicar como funciona.'
  return (
    <div className="benefit-notice">
      <Sparkles size={18} />
      <span><b>O canal de mensagens está disponível para famílias com programa ativo.</b> {detail}</span>
    </div>
  )
}

function FamilyMessages() {
  const { state } = useStore()
  const child = useChild()
  if (!child) return null
  const conv = state.conversations.find((c) => c.patientId === child.id)
    ?? { id: `new-${child.id}`, patientId: child.id, messages: [], readByFamily: true, readByTeam: true }
  return (
    <>
      <PageHeader title="Mensagens" subtitle="Converse com o Dr. André e a equipe do Crescer." />
      <div className="chat single">
        <Thread conv={conv} patient={child} side="family" />
      </div>
    </>
  )
}

function TeamMessages() {
  const { state, user, route } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'doctor'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(() => (route.id ? state.conversations.find((c) => c.patientId === route.id)?.id ?? null : null))
  const [starting, setStarting] = useState(false)
  const convs = useMemo(() => conversationsFor(state, user!)
    .map((c) => ({ c, p: state.patients.find((p) => p.id === c.patientId)! }))
    .filter(({ c }) => filter === 'all' || (filter === 'unread' ? !c.readByTeam : c.needsDoctor))
    .filter(({ p }) => normalize(`${p.name} ${p.guardian}`).includes(normalize(q)))
    .sort((a, b) => (b.c.messages.at(-1)?.at ?? '').localeCompare(a.c.messages.at(-1)?.at ?? '')), [state, user, q, filter])
  const selected = convs.find((x) => x.c.id === selectedId) ?? (window.innerWidth > 860 ? convs[0] : undefined)

  return (
    <>
      <PageHeader title="Mensagens" subtitle="Caixa de mensagens Crescer — o Dr. André e a secretaria acompanham e respondem."
        actions={<button className="btn btn-primary" onClick={() => setStarting(true)}><MessageCirclePlus size={16} /> Nova conversa</button>} />
      <div className={`chat ${selectedId ? 'show-thread' : ''}`}>
        <aside className="chat-list">
          <label className="search"><Search size={16} /><input placeholder="Buscar família" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div className="chip-filter">
            {([['all', 'Todas'], ['unread', 'Não lidas'], ['doctor', 'Para o Dr. André']] as const).map(([id, label]) => (
              <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          {convs.length ? convs.map(({ c, p }) => {
            const last = c.messages.at(-1)
            const active = familyCanSend(state, p.id)
            return (
              <button key={c.id} className={selected?.c.id === c.id ? 'active' : ''} onClick={() => setSelectedId(c.id)}>
                <Avatar name={p.guardian} />
                <span>
                  <strong>{p.guardian}</strong>
                  <small>{p.name.split(' ')[0]} · {active ? 'programa ativo' : 'sem programa ativo'}</small>
                  {last && <small className="preview">{last.from === 'team' ? `${last.author}: ` : ''}{last.text}</small>}
                </span>
                {c.needsDoctor && <Flag size={14} className="flag-icon" aria-label="Para o Dr. André" />}
                {!c.readByTeam && <i className="unread" />}
              </button>
            )
          }) : <Empty title="Nenhuma conversa" />}
        </aside>
        {selected ? <Thread conv={selected.c} patient={selected.p} side="team" onBack={() => setSelectedId(null)} /> : <div className="chat-thread"><Empty title="Selecione uma conversa" /></div>}
      </div>
      {starting && <StartConversation onClose={() => setStarting(false)} onStart={(id) => { setSelectedId(id); setStarting(false) }} />}
    </>
  )
}

function Thread({ conv, patient, side, onBack }: { conv: Conversation; patient: Patient; side: 'team' | 'family'; onBack?: () => void }) {
  const { state, update, user, toast } = useStore()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const unread = side === 'team' ? !conv.readByTeam : !conv.readByFamily
  const canSend = side === 'team' || familyCanSend(state, patient.id)
  const isSecretary = user?.role === 'secretary'

  useEffect(() => {
    if (!unread || conv.id.startsWith('new-')) return
    update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === conv.id ? { ...c, [side === 'team' ? 'readByTeam' : 'readByFamily']: true } : c)) }))
  }, [conv.id, unread, side, update])

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [conv.id, conv.messages.length])

  const upsert = (fn: (c: Conversation) => Conversation) => update((s) => {
    const exists = s.conversations.some((c) => c.id === conv.id)
    const updated = fn({ ...conv, id: exists ? conv.id : `c-${uid()}` })
    return { ...s, conversations: exists ? s.conversations.map((c) => (c.id === conv.id ? updated : c)) : [...s.conversations, updated] }
  })

  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user || !canSend) return
    const message = { id: uid(), from: side, author: user.name, authorRole: side === 'team' ? ROLE_REPLY_LABEL[user.role] : undefined, text: text.trim(), at: nowIso() }
    upsert((c) => ({ ...c, messages: [...c.messages, message], readByTeam: side === 'team', readByFamily: side === 'family' }))
    setText('')
  }

  const toggleDoctor = () => {
    upsert((c) => ({ ...c, needsDoctor: !c.needsDoctor }))
    toast(conv.needsDoctor ? 'Sinalização removida' : 'Conversa sinalizada para o Dr. André')
  }

  const title = side === 'team' ? `${patient.guardian} · ${patient.name.split(' ')[0]}` : 'Dr. André e equipe Crescer'
  const enr = activeEnrollment(state, patient.id)
  return (
    <section className="chat-thread">
      <header>
        {onBack && <button className="icon-btn chat-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={18} /></button>}
        <Avatar name={side === 'team' ? patient.guardian : 'Crescer'} />
        <span className="grow">
          <strong>{title}</strong>
          <small>{side === 'team' ? (enr ? `${enr.program.name} · ${enr.contract.label}` : 'Família sem programa ativo — não pode enviar mensagens') : 'Respondemos em horário comercial'}</small>
        </span>
        {side === 'team' && (
          <button className={`btn btn-sm ${conv.needsDoctor ? 'btn-soft' : 'btn-ghost'}`} onClick={toggleDoctor} title="Assuntos clínicos são decididos pelo Dr. André">
            <Flag size={14} /> {conv.needsDoctor ? 'Sinalizada para o Dr. André' : 'Sinalizar para o Dr. André'}
          </button>
        )}
      </header>
      {side === 'team' && isSecretary && (
        <p className="thread-hint"><Info size={14} /> Dúvidas administrativas e orientações já definidas podem ser respondidas pela equipe. Diagnóstico, conduta, prescrição, interpretação clínica ou encaminhamento: sinalize para o Dr. André.</p>
      )}
      <div className="chat-body">
        {conv.messages.length === 0 && <Empty title="Nenhuma mensagem ainda" text={canSend ? 'Envie a primeira mensagem.' : undefined} />}
        {conv.messages.map((m, i) => {
          const day = m.at.slice(0, 10)
          const showDay = i === 0 || conv.messages[i - 1].at.slice(0, 10) !== day
          const mine = m.from === side
          return (
            <div key={m.id}>
              {showDay && <p className="chat-day">{fmtDate(day)}</p>}
              <div className={`bubble ${mine ? 'mine' : ''} ${m.from === 'team' ? 'team' : ''}`}>
                {m.from === 'team'
                  ? <small className="bubble-author">Respondido por: {m.author}{m.authorRole && m.author !== 'Dr. André' ? ` — ${m.authorRole}` : ''}</small>
                  : !mine && <small className="bubble-author">{m.author}</small>}
                <p>{m.text}</p>
                <time>{fmtTime(m.at)}</time>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {canSend ? (
        <form className="chat-input" onSubmit={send}>
          <input placeholder={side === 'team' ? `Responder como ${user?.name}…` : 'Digite sua mensagem…'} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary btn-round" aria-label="Enviar" disabled={!text.trim()}><Send size={16} /></button>
        </form>
      ) : (
        <div className="chat-input locked"><MessagingBenefitNotice patientId={patient.id} /></div>
      )}
    </section>
  )
}

function StartConversation({ onClose, onStart }: { onClose: () => void; onStart: (id: string) => void }) {
  const { state, update } = useStore()
  const families = [...state.patients].sort((a, b) => a.guardian.localeCompare(b.guardian))
  const [patientId, setPatientId] = useState(families[0]?.id ?? '')

  const start = () => {
    const existing = state.conversations.find((c) => c.patientId === patientId)
    if (existing) return onStart(existing.id)
    const id = `c-${uid()}`
    update((s) => ({ ...s, conversations: [...s.conversations, { id, patientId, messages: [], readByTeam: true, readByFamily: true }] }))
    onStart(id)
  }

  return (
    <Modal title="Nova conversa" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={start} disabled={!patientId}>Abrir conversa</button></>}>
      <div className="form-grid">
        <Field label="Família" full hint="Lembrete: famílias sem programa ativo não podem enviar mensagens.">
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {families.map((p) => <option key={p.id} value={p.id}>{p.guardian} — {p.name}{familyCanSend(state, p.id) ? '' : ' (sem programa ativo)'}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}
