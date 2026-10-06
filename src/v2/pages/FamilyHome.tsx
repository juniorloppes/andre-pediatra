import { CalendarDays, ChartLine, Lock, Sprout, Syringe } from 'lucide-react'
import { contentsForChild, pendingVaccines } from '../domain'
import { useStore } from '../store'
import { Artwork, Card, Empty, Progress, StatusBadge } from '../ui'
import { activeEnrollment, ageLabel, currentSale, currentStepOf, diffDays, firstName, fmtDate, TODAY } from '../utils'

export function useChild() {
  const { state, childId } = useStore()
  return state.patients.find((p) => p.id === childId)
}

export function FamilyHome() {
  const { state, user, go } = useStore()
  const child = useChild()
  if (!child || !user) return <Empty title="Nenhuma criança vinculada" text="Fale com a secretaria para vincular seu filho à sua conta." />

  const enr = activeEnrollment(state, child.id)
  const pendingSale = !enr ? currentSale(state, child.id) : undefined
  const step = enr && currentStepOf(enr.program, child)
  const nextAppt = state.appointments.filter((a) => a.patientId === child.id && a.date >= TODAY && a.status === 'Agendado').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const vaccines = pendingVaccines(state, child)
  const dueNow = vaccines.filter((v) => v.status !== 'Próxima')
  const nextVaccine = vaccines.find((v) => v.status === 'Próxima')
  const lastGrowth = state.growth.filter((g) => g.patientId === child.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const materials = contentsForChild(state, child).filter((c) => c.current || c.programId === 'all').slice(0, 3)
  const gender = child.sex === 'F' ? 'a' : 'o'

  return (
    <>
      <header className="page-head family-head">
        <div>
          <h1>Olá, {firstName(user.name)}!</h1>
          <p>Bem-vind{user.title.startsWith('Pai') ? 'o' : 'a'} ao Crescer. Vamos juntos acompanhar cada fase.</p>
        </div>
        <div className="child-chip">
          <Artwork seed={child.name} className="mini" />
          <span><strong>{firstName(child.name)}</strong><small>{ageLabel(child.birthDate, undefined, true)}</small></span>
        </div>
      </header>

      {enr && step ? (
        <section className="program-hero">
          <div>
            <span className="eyebrow">Meu programa</span>
            <h2>{enr.program.name}</h2>
            <h3>{enr.program.ageLabel}</h3>
            <Progress value={(step.n / enr.program.steps.length) * 100} />
            <p className="hero-meta"><span>Passo {step.n} de {enr.program.steps.length}</span><b>{step.startDay} a {step.endDay} dias</b></p>
            <button className="btn btn-primary" onClick={() => go('my-program')}>Continuar</button>
          </div>
          <Artwork seed={child.name + step.n} className="hero-art" />
        </section>
      ) : (
        <section className="program-hero locked">
          <div>
            <span className="eyebrow">{pendingSale ? 'Programa aguardando pagamento' : 'Programas Crescer'}</span>
            <h2>{pendingSale ? 'Quase lá!' : `Acompanhe ${gender === 'a' ? 'a' : 'o'} ${firstName(child.name)} de perto`}</h2>
            <p>
              {pendingSale
                ? `Assim que o pagamento do programa for confirmado, os passos, materiais e o canal de mensagens com a equipe serão liberados.`
                : 'Com o Primeiros Passos você tem encontros a cada 45 dias, orientações por fase, materiais exclusivos e mensagens diretas com a equipe do Dr. André.'}
            </p>
            {pendingSale ? <StatusBadge status="Pendente" /> : <p className="muted small">Fale com a secretaria na próxima consulta para conhecer os programas.</p>}
          </div>
          <span className="hero-lock"><Lock size={40} strokeWidth={1.4} /></span>
        </section>
      )}

      <div className="tiles">
        <button className="tile" onClick={() => go('agenda')}>
          <span className="stat-icon tone-green"><CalendarDays /></span>
          <span><small>Próximo encontro</small><strong>{nextAppt ? fmtDate(nextAppt.date) : 'Sem agendamento'}</strong><em>{nextAppt ? `${nextAppt.time} · ${nextAppt.kind}` : 'Fale com a secretaria'}</em></span>
        </button>
        <button className="tile" onClick={() => go('vaccines')}>
          <span className="stat-icon tone-amber"><Syringe /></span>
          <span><small>Vacinas</small><strong>{dueNow.length ? `${dueNow.length} pendente${dueNow.length > 1 ? 's' : ''}` : 'Em dia'}</strong><em>{dueNow[0] ? `${dueNow[0].dose.vaccine} — desde ${fmtDate(dueNow[0].due)}` : nextVaccine ? `Próxima em ${diffDays(nextVaccine.due, TODAY)} dias` : 'Nenhuma dose agora'}</em></span>
        </button>
        <button className="tile" onClick={() => go('growth')}>
          <span className="stat-icon tone-blue"><ChartLine /></span>
          <span><small>Crescimento</small><strong>{lastGrowth ? `${lastGrowth.weight.toLocaleString('pt-BR')} kg · ${lastGrowth.height.toLocaleString('pt-BR')} cm` : 'Sem medições'}</strong><em>{lastGrowth ? `Última medição ${fmtDate(lastGrowth.date)}` : '—'}</em></span>
        </button>
      </div>

      <Card title={enr ? 'Materiais desta fase' : 'Materiais gerais'} action={<button className="link-btn" onClick={() => go('materials')}>Ver todos</button>}>
        {materials.length ? (
          <div className="media-grid">
            {materials.map((m) => (
              <button key={m.id} className="media-card" onClick={() => go('materials', m.id)}>
                <Artwork seed={m.id} kind={m.type === 'video' ? 'video' : m.type === 'imagem' ? 'image' : 'baby'} />
                <strong>{m.title}</strong>
                <small>{m.summary}</small>
              </button>
            ))}
          </div>
        ) : <Empty icon={<Sprout />} title="Os materiais aparecem quando o programa estiver ativo" />}
      </Card>
    </>
  )
}
