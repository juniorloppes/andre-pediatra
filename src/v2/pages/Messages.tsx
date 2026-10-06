import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Lock, MessageCirclePlus, Search, Send } from 'lucide-react'
import { canSeeChannel, conversationsFor } from '../domain'
import { useStore } from '../store'
import type { Conversation, Patient } from '../types'
import { Avatar, Empty, Modal, Field, PageHeader } from '../ui'
import { activeEnrollment, currentSale, fmtDate, fmtTime, normalize, TODAY, uid } from '../utils'
import { useChild } from './FamilyHome'

const CHANNELS: Conversation['channel'][] = ['Equipe Crescer', 'Dr. André', 'Nutrição']
const nowIso = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`

export function Messages() {
  const { user } = useStore()
  return user?.role === 'parent' ? <FamilyMessages /> : <TeamMessages />
}

function FamilyMessages() {
  const { state } = useStore()
  const child = useChild()
  const [channel, setChannel] = useState<Conversation['channel'] | null>(null)
  if (!child) return null
  const enr = activeEnrollment(state, child.id)

  if (!enr) {
    const pending = currentSale(state, child.id)?.status === 'Pendente'
    return (
      <>
        <PageHeader title="Mensagens" />
        <div className="card locked-card">
          <span className="hero-lock"><Lock size={36} strokeWidth={1.4} /></span>
          <h2>Mensagens disponíveis para famílias com programa ativo</h2>
          <p className="muted">{pending
            ? 'O programa está aguardando a confirmação do pagamento. Assim que for confirmado, o canal com a equipe é liberado automaticamente.'
            : 'O canal direto com o Dr. André e a equipe faz parte dos programas de acompanhamento Crescer. Para dúvidas pontuais, fale com a secretaria pelo telefone da clínica.'}</p>
        </div>
      </>
    )
  }

  const convs = CHANNELS.map((ch) => state.conversations.find((c) => c.patientId === child.id && c.channel === ch) ?? { id: `new-${ch}`, patientId: child.id, channel: ch, messages: [], readByFamily: true, readByTeam: true })
  const selected = convs.find((c) => c.channel === channel) ?? convs[0]
  return (
    <>
      <PageHeader title="Mensagens" subtitle="Converse com a equipe do Dr. André." />
      <div className={`chat ${channel ? 'show-thread' : ''}`}>
        <aside className="chat-list">
          {convs.map((c) => {
            const last = c.messages[c.messages.length - 1]
            return (
              <button key={c.id} className={selected.id === c.id ? 'active' : ''} onClick={() => setChannel(c.channel)}>
                <Avatar name={c.channel} />
                <span><strong>{c.channel}</strong><small>{last ? `Última mensagem · ${fmtDate(last.at)}` : 'Inicie uma conversa'}</small></span>
                {!c.readByFamily && <i className="unread" />}
              </button>
            )
          })}
        </aside>
        <Thread conv={selected} patient={child} side="family" onBack={() => setChannel(null)} />
      </div>
    </>
  )
}

function TeamMessages() {
  const { state, user, route } = useStore()
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(() => (route.id ? state.conversations.find((c) => c.patientId === route.id)?.id ?? null : null))
  const [starting, setStarting] = useState(false)
  const convs = useMemo(() => conversationsFor(state, user!)
    .filter((c) => canSeeChannel(user!.role, c.channel))
    .map((c) => ({ c, p: state.patients.find((p) => p.id === c.patientId)! }))
    .filter(({ p }) => normalize(`${p.name} ${p.guardian}`).includes(normalize(q)))
    .sort((a, b) => (b.c.messages.at(-1)?.at ?? '').localeCompare(a.c.messages.at(-1)?.at ?? '')), [state, user, q])
  const selected = convs.find((x) => x.c.id === selectedId) ?? (window.innerWidth > 860 ? convs[0] : undefined)

  return (
    <>
      <PageHeader title="Mensagens" subtitle="Somente famílias com programa ativo têm acesso ao canal."
        actions={<button className="btn btn-primary" onClick={() => setStarting(true)}><MessageCirclePlus size={16} /> Nova conversa</button>} />
      <div className={`chat ${selectedId ? 'show-thread' : ''}`}>
        <aside className="chat-list">
          <label className="search"><Search size={16} /><input placeholder="Buscar família" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          {convs.length ? convs.map(({ c, p }) => {
            const last = c.messages.at(-1)
            return (
              <button key={c.id} className={selected?.c.id === c.id ? 'active' : ''} onClick={() => setSelectedId(c.id)}>
                <Avatar name={p.guardian} />
                <span>
                  <strong>{p.guardian}</strong>
                  <small>{p.name.split(' ')[0]} · {c.channel}</small>
                  {last && <small className="preview">{last.from === 'team' ? 'Você: ' : ''}{last.text}</small>}
                </span>
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

function Thread({ conv, patient, side, onBack }: { conv: Conversation; patient: Patient; side: 'team' | 'family'; onBack: () => void }) {
  const { update, user } = useStore()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const unread = side === 'team' ? !conv.readByTeam : !conv.readByFamily

  useEffect(() => {
    if (!unread || conv.id.startsWith('new-')) return
    update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === conv.id ? { ...c, [side === 'team' ? 'readByTeam' : 'readByFamily']: true } : c)) }))
  }, [conv.id, unread, side, update])

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [conv.id, conv.messages.length])

  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    const message = { id: uid(), from: side, author: user.name, text: text.trim(), at: nowIso() }
    update((s) => {
      const exists = s.conversations.some((c) => c.id === conv.id)
      const updated: Conversation = { ...conv, id: exists ? conv.id : `c-${uid()}`, messages: [...conv.messages, message], readByTeam: side === 'team', readByFamily: side === 'family' }
      return { ...s, conversations: exists ? s.conversations.map((c) => (c.id === conv.id ? updated : c)) : [...s.conversations, updated] }
    })
    setText('')
  }

  const title = side === 'team' ? `${patient.guardian} · ${patient.name.split(' ')[0]}` : conv.channel
  return (
    <section className="chat-thread">
      <header>
        <button className="icon-btn chat-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={18} /></button>
        <Avatar name={side === 'team' ? patient.guardian : conv.channel} />
        <span><strong>{title}</strong><small>{side === 'team' ? `Canal: ${conv.channel}` : 'Respondemos em horário comercial'}</small></span>
      </header>
      <div className="chat-body">
        {conv.messages.length === 0 && <Empty title="Nenhuma mensagem ainda" text="Envie a primeira mensagem." />}
        {conv.messages.map((m, i) => {
          const day = m.at.slice(0, 10)
          const showDay = i === 0 || conv.messages[i - 1].at.slice(0, 10) !== day
          const mine = m.from === side
          return (
            <div key={m.id}>
              {showDay && <p className="chat-day">{fmtDate(day)}</p>}
              <div className={`bubble ${mine ? 'mine' : ''}`}>
                {!mine && <small className="bubble-author">{m.author}</small>}
                <p>{m.text}</p>
                <time>{fmtTime(m.at)}</time>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input placeholder="Digite sua mensagem…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary btn-round" aria-label="Enviar" disabled={!text.trim()}><Send size={16} /></button>
      </form>
    </section>
  )
}

function StartConversation({ onClose, onStart }: { onClose: () => void; onStart: (id: string) => void }) {
  const { state, update, user } = useStore()
  const eligible = state.patients.filter((p) => activeEnrollment(state, p.id))
  const channels = CHANNELS.filter((c) => canSeeChannel(user!.role, c))
  const [patientId, setPatientId] = useState(eligible[0]?.id ?? '')
  const [channel, setChannel] = useState<Conversation['channel']>(channels[0])
  const blocked = state.patients.length - eligible.length

  const start = () => {
    const existing = state.conversations.find((c) => c.patientId === patientId && c.channel === channel)
    if (existing) return onStart(existing.id)
    const id = `c-${uid()}`
    update((s) => ({ ...s, conversations: [...s.conversations, { id, patientId, channel, messages: [], readByTeam: true, readByFamily: true }] }))
    onStart(id)
  }

  return (
    <Modal title="Nova conversa" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={start} disabled={!patientId}>Abrir conversa</button></>}>
      <div className="form-grid">
        <Field label="Família (programa ativo)" full>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {eligible.map((p) => <option key={p.id} value={p.id}>{p.guardian} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="Canal" full>
          <select value={channel} onChange={(e) => setChannel(e.target.value as Conversation['channel'])}>{channels.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        {blocked > 0 && <p className="muted small field-full">{blocked} paciente(s) sem programa ativo não aparecem aqui.</p>}
      </div>
    </Modal>
  )
}
