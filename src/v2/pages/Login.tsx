import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, HeartHandshake, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'
import { useStore } from '../store'
import type { Role } from '../types'
import { Logo } from '../ui'

const PROFILES: Array<{ role: Role; label: string; sub: string; userId: string; icon: typeof Stethoscope }> = [
  { role: 'doctor', label: 'Médico', sub: 'Dr. André', userId: 'u-andre', icon: Stethoscope },
  { role: 'secretary', label: 'Secretaria', sub: 'Marina Costa', userId: 'u-marina', icon: UserRound },
  { role: 'admin', label: 'Administrador', sub: 'Rafael Torres', userId: 'u-rafael', icon: ShieldCheck },
  { role: 'parent', label: 'Responsável', sub: 'Ana (mãe da Laura)', userId: 'u-ana', icon: HeartHandshake },
]

export function Login() {
  const { state, login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u) return setError('E-mail não encontrado. Use um dos perfis de demonstração abaixo.')
    if (!u.active) return setError('Este usuário está inativo. Fale com o administrador.')
    if (!password) return setError('Informe a senha (qualquer senha funciona na demonstração).')
    login(u.id)
  }

  return (
    <div className="login">
      <section className="login-hero">
        <Logo size="lg" />
        <p>Acompanhando cada fase,<br />para um futuro mais saudável.</p>
        <div className="login-art" aria-hidden="true">
          <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
        </div>
      </section>
      <section className="login-card">
        <h2>Bem-vindo ao Crescer</h2>
        <p className="muted">Acesse sua conta</p>
        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>E-mail</span>
            <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="username" />
          </label>
          <label className="field">
            <span>Senha</span>
            <span className="input-icon">
              <input type={show ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} autoComplete="current-password" />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <button type="button" className="link-btn right" onClick={() => setError('Na versão final, um link de redefinição será enviado por e-mail.')}>Esqueceu a senha?</button>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit">Entrar</button>
        </form>
        <div className="divider"><span>ou entre como (demonstração)</span></div>
        <div className="profile-grid">
          {PROFILES.map(({ role, label, sub, userId, icon: Icon }) => (
            <button key={role} className={`profile-card role-${role}`} onClick={() => login(userId)}>
              <Icon size={22} />
              <strong>{label}</strong>
              <small>{sub}</small>
            </button>
          ))}
        </div>
        <p className="login-alt">
          Outras famílias:{' '}
          <button className="link-btn" onClick={() => login('u-paulo')}>Paulo (sem programa)</button>{' · '}
          <button className="link-btn" onClick={() => login('u-juliana')}>Juliana (pagamento pendente)</button>{' · '}
          <button className="link-btn" onClick={() => login('u-carolina')}>Carolina (1–2 anos)</button>
        </p>
      </section>
    </div>
  )
}
