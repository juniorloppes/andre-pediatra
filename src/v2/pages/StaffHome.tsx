import { useMemo } from 'react'
import { AlertCircle, ArrowRight, Baby, BellRing, CalendarCheck, CircleDollarSign, Clock3, ShoppingBag, Syringe, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { pendingVaccines } from '../domain'
import { useStore } from '../store'
import { Card, PageHeader, PatientName, Stat, StatusBadge, Empty } from '../ui'
import { activeEnrollment, addMonths, ageLabel, finalPrice, firstName, fmtDate, fmtLongDate, followUpSituation, monthShort, money, TODAY } from '../utils'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
}

const PIE_COLORS = ['#2f6b5a', '#5fb49c', '#a8d5c4', '#d8e6df']

export function StaffHome() {
  const { state, user, go } = useStore()
  const isDoctor = user?.role === 'doctor'

  const data = useMemo(() => {
    const today = state.appointments.filter((a) => a.date === TODAY && a.status !== 'Cancelado').sort((a, b) => a.time.localeCompare(b.time))
    const monthPrefix = TODAY.slice(0, 7)
    const newPatients = state.patients.filter((p) => p.createdAt >= addMonths(TODAY, -1)).length
    const enrolled = state.patients.map((p) => ({ p, enr: activeEnrollment(state, p.id) })).filter((x) => x.enr)
    const vaccinesSoon = state.patients.reduce((n, p) => n + pendingVaccines(state, p).length, 0)
    const byProgram = state.programs.map((pr) => ({ name: `${pr.name} ${pr.ageLabel}`, value: enrolled.filter((x) => x.enr!.program.id === pr.id).length }))
    const avulsos = state.patients.filter((p) => !activeEnrollment(state, p.id)).length
    const distribution = [...byProgram, { name: 'Consulta avulsa', value: avulsos }].filter((d) => d.value > 0)
    const months = Array.from({ length: 6 }, (_, i) => addMonths(TODAY.slice(0, 7) + '-01', i - 5))
    const evolution = months.map((m) => {
      const end = addMonths(m, 1)
      return {
        month: monthShort(m),
        pacientes: state.sales.filter((s) => s.status === 'Pago' && s.startDate < end).filter((s) => {
          const program = state.programs.find((p) => p.id === s.programId)
          const patient = state.patients.find((p) => p.id === s.patientId)
          return program && patient && addMonths(patient.birthDate, program.endAgeDays / 30.4375) >= m
        }).length,
      }
    })
    const followAlerts = enrolled
      .map(({ p, enr }) => ({ p, enr: enr!, sit: followUpSituation(state, p, enr!.program) }))
      .filter((x) => x.sit.status === 'Atrasado' || x.sit.status === 'Encontro próximo' || x.sit.openPendencies > 0)
    const monthSales = state.sales.filter((s) => s.saleDate.slice(0, 7) === monthPrefix && s.status !== 'Cancelado')
    const pendingSales = state.sales.filter((s) => s.status === 'Pendente')
    return { today, newPatients, enrolled, vaccinesSoon, distribution, evolution, followAlerts, monthSales, pendingSales }
  }, [state])

  const patient = (id: string) => state.patients.find((p) => p.id === id)!

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${isDoctor ? user!.name : firstName(user!.name)}!`}
        subtitle="Aqui está o resumo do seu dia."
        actions={<span className="date-chip"><CalendarCheck size={15} /> {fmtLongDate(TODAY)}</span>}
      />

      {isDoctor ? (
        <div className="stats">
          <Stat icon={<CalendarCheck />} value={data.today.length} label="Atendimentos hoje" />
          <Stat icon={<Baby />} value={data.newPatients} label="Novos pacientes" tone="amber" hint="últimos 30 dias" />
          <Stat icon={<Users />} value={data.enrolled.length} label="Em acompanhamento" tone="blue" />
          <Stat icon={<Syringe />} value={data.vaccinesSoon} label="Vacinas pendentes/próximas" tone="red" />
        </div>
      ) : (
        <div className="stats">
          <Stat icon={<CircleDollarSign />} value={money(data.monthSales.reduce((s, x) => s + finalPrice(x), 0))} label="Vendas no mês" />
          <Stat icon={<Clock3 />} value={data.pendingSales.length} label="Pagamentos pendentes" tone="amber" />
          <Stat icon={<CalendarCheck />} value={data.today.length} label="Agendamentos hoje" tone="blue" />
          <Stat icon={<Users />} value={data.enrolled.length} label="Programas ativos" tone="lilac" />
        </div>
      )}

      <div className="grid-2">
        <Card title="Próximos atendimentos" action={<button className="link-btn" onClick={() => go('agenda')}>Ver agenda completa <ArrowRight size={14} /></button>}>
          {data.today.length ? (
            <ul className="agenda-list">
              {data.today.map((a) => {
                const p = patient(a.patientId)
                const enr = activeEnrollment(state, p.id)
                return (
                  <li key={a.id}>
                    <time>{a.time}</time>
                    <PatientName patient={p} sub={`${ageLabel(p.birthDate, undefined, true)} · ${a.kind}`} />
                    {!enr && <span className="tag">Avulso</span>}
                    {a.status === 'Realizado' ? <StatusBadge status="Realizado" /> : (
                      <button className="btn btn-soft btn-sm" onClick={() => go('patient', p.id, isDoctor && enr ? 'followup' : 'overview')}>
                        {isDoctor ? 'Atender' : 'Abrir'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : <Empty title="Nenhum atendimento hoje" />}
        </Card>

        {isDoctor ? (
          <Card title="Distribuição de pacientes">
            <div className="donut-wrap">
              <div className="donut">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.distribution} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none" isAnimationActive={false}>
                      {data.distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <span className="donut-center"><strong>{state.patients.length}</strong><small>pacientes</small></span>
              </div>
              <ul className="legend">
                {data.distribution.map((d, i) => (
                  <li key={d.name}><i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}<b>{d.value}</b></li>
                ))}
              </ul>
            </div>
          </Card>
        ) : (
          <Card title="Vendas recentes" action={<button className="link-btn" onClick={() => go('sales')}>Ver vendas <ArrowRight size={14} /></button>}>
            <ul className="simple-list">
              {[...state.sales].sort((a, b) => b.saleDate.localeCompare(a.saleDate)).slice(0, 5).map((s) => {
                const p = patient(s.patientId)
                const pr = state.programs.find((x) => x.id === s.programId)
                return (
                  <li key={s.id}>
                    <PatientName patient={p} sub={`${pr?.ageLabel} · ${fmtDate(s.saleDate)}`} />
                    <span className="num">{money(finalPrice(s))}</span>
                    <StatusBadge status={s.status} />
                  </li>
                )
              })}
            </ul>
            <button className="btn btn-primary btn-block mt" onClick={() => go('new-sale')}><ShoppingBag size={16} /> Nova venda</button>
          </Card>
        )}
      </div>

      <div className="grid-2">
        <Card title={isDoctor ? 'Acompanhamentos que pedem atenção' : 'Acompanhamentos e pendências'}>
          {data.followAlerts.length ? (
            <ul className="simple-list">
              {data.followAlerts.map(({ p, enr, sit }) => (
                <li key={p.id}>
                  <PatientName patient={p} sub={`${enr.program.ageLabel} · Passo ${sit.step?.n ?? '—'}${sit.openPendencies ? ` · ${sit.openPendencies} pendência(s)` : ''}`} />
                  <StatusBadge status={sit.status} />
                  <button className="icon-btn" aria-label="Abrir acompanhamento" onClick={() => go('patient', p.id, 'followup')}><ArrowRight size={16} /></button>
                </li>
              ))}
            </ul>
          ) : <Empty icon={<BellRing />} title="Tudo em dia" />}
        </Card>

        {isDoctor ? (
          <Card title="Evolução de pacientes em programa" action={<span className="muted small">Últimos 6 meses</span>}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.evolution} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'var(--brand-soft)' }} />
                <Bar dataKey="pacientes" name="Pacientes" fill="#5fb49c" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="Pagamentos pendentes">
            {data.pendingSales.length ? (
              <ul className="simple-list">
                {data.pendingSales.map((s) => (
                  <li key={s.id}>
                    <PatientName patient={patient(s.patientId)} sub={`${s.payment} · venda em ${fmtDate(s.saleDate)}`} />
                    <span className="num">{money(finalPrice(s))}</span>
                    <button className="btn btn-soft btn-sm" onClick={() => go('sales')}><AlertCircle size={14} /> Resolver</button>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Nenhum pagamento pendente" />}
          </Card>
        )}
      </div>
    </>
  )
}
