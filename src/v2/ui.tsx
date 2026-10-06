import { useEffect, type ReactNode } from 'react'
import { Baby, Image as ImageIcon, PlayCircle, X } from 'lucide-react'
import type { Patient } from './types'
import { initials } from './utils'

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'lilac' | 'gray'

export const Badge = ({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
)

export const STATUS_TONE: Record<string, Tone> = {
  Pago: 'green', Ativo: 'green', Realizada: 'green', Realizado: 'green', 'Em dia': 'green', Concluído: 'green', Publicado: 'green',
  Pendente: 'amber', 'Encontro próximo': 'amber', Agendado: 'blue', Próxima: 'blue', Futura: 'gray', Rascunho: 'gray',
  Cancelado: 'red', Atrasado: 'red', Atrasada: 'red', Inativo: 'gray', 'Sem programa': 'gray',
}

export const StatusBadge = ({ status }: { status: string }) => <Badge tone={STATUS_TONE[status] ?? 'gray'}>{status}</Badge>

const AVATAR_COLORS = ['#e9b8a0', '#a9c9b8', '#c7b8e0', '#f0cf94', '#9fc3d6', '#e6a9b8', '#b6d19b']
const colorFor = (s: string) => AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

export const Avatar = ({ name, size = 34 }: { name: string; size?: number }) => (
  <span className="avatar" style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.36 }} aria-hidden="true">
    {initials(name)}
  </span>
)

export const PatientName = ({ patient, sub }: { patient: Patient; sub?: ReactNode }) => (
  <span className="person">
    <Avatar name={patient.name} />
    <span>
      <strong>{patient.name}</strong>
      <small>{sub ?? patient.guardian}</small>
    </span>
  </span>
)

export const Card = ({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card ${className}`}>
    {(title || action) && (
      <header className="card-head">
        {title && <h3>{title}</h3>}
        {action}
      </header>
    )}
    {children}
  </section>
)

export const Stat = ({ icon, value, label, tone = 'green', hint }: { icon: ReactNode; value: ReactNode; label: string; tone?: Tone; hint?: string }) => (
  <div className="stat">
    <span className={`stat-icon tone-${tone}`}>{icon}</span>
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
      {hint && <em>{hint}</em>}
    </span>
  </div>
)

export const PageHeader = ({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) => (
  <header className="page-head">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>
)

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: Array<{ id: T; label: ReactNode }> }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} className={value === it.id ? 'active' : ''} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

export const Modal = ({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export const Field = ({ label, children, hint, full }: { label: string; children: ReactNode; hint?: ReactNode; full?: boolean }) => (
  <label className={`field ${full ? 'field-full' : ''}`}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
)

export const Empty = ({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) => (
  <div className="empty">
    {icon && <span className="empty-icon">{icon}</span>}
    <strong>{title}</strong>
    {text && <p>{text}</p>}
    {action}
  </div>
)

export const Progress = ({ value }: { value: number }) => (
  <span className="progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </span>
)

const ART = ['art-peach', 'art-mint', 'art-lilac', 'art-sky', 'art-sun']

/** Ilustração neutra no lugar de fotos (o protótipo não usa imagens reais de crianças). */
export const Artwork = ({ seed, kind = 'baby', className = '' }: { seed: string; kind?: 'baby' | 'video' | 'image'; className?: string }) => {
  const cls = ART[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % ART.length]
  return (
    <div className={`artwork ${cls} ${className}`} aria-hidden="true">
      <span className="artwork-blob b1" />
      <span className="artwork-blob b2" />
      {kind === 'video' ? <PlayCircle size={42} strokeWidth={1.4} /> : kind === 'image' ? <ImageIcon size={38} strokeWidth={1.4} /> : <Baby size={46} strokeWidth={1.3} />}
    </div>
  )
}

export const Logo = ({ size = 'md' }: { size?: 'md' | 'lg' }) => (
  <span className={`logo logo-${size}`}>
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 29V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M16 17c0-6 -4-10 -11-10 0 6 4 10 11 10z" fill="var(--brand-leaf)" />
      <path d="M16 14c0-6 4-10 11-10 0 6-4 10-11 10z" fill="var(--brand)" />
      <circle cx="16" cy="9" r="2.6" fill="var(--coral)" />
    </svg>
    <span>Crescer</span>
  </span>
)
