import { useMemo } from 'react'
import { ArrowRight, BellRing, CalendarCheck, CircleDollarSign, Clock3, Flag, Info, MessageCircle, ShoppingBag, Syringe, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { pendingVaccines } from '../domain'
import { useStore } from '../store'
import type { ProgramStatus } from '../types'
import { Badge, Card, Empty, PageHeader, PatientName, Stat, StatusBadge } from '../ui'
import {
  activeEnrollment, addMonths, ageLabel, contractOf, daysToEnd, DEMO_EXPIRY_WINDOW_DAYS, finalPrice, firstName, fmtDate, fmtLongDate,
  followUpSituation, monthShort, money, programStatus, TODAY,
} from '../utils'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
}

const PIE_COLORS = ['#2f6b5a', '#5fb49c', '#a8d5c4', '#e8c39e', '#d8e6df']

export function StaffHome() {
  const { state, user, go } = useStore()
  const isDoctor = user?.role === 'doctor'

  const data = useMemo(() => {
    const today = state.appointments.filter((a) => a.date === TODAY && a.status !== 'Cancelado').sort((a, b) => a.time.localeCompare(b.time))
    const enrolled = state.patients.map((p) => ({ p, enr: activeEnrollment(state, p.id) })).filter((x) => x.enr)
    const vaccinesSoon = state.patients.reduce((n, p) => n + pendingVaccines(state, p).length, 0)
    const statusOf = (pid: string): ProgramStatus | 'Sem programa' => {
      const s = state.sales.filter((x) => x.patientId === pid).sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
      return s ? programStatus(s) : 'Sem programa'
    }
    const groups = ['Programa ativo', 'Pagamento pendente', 'Programa encerrado', 'Cancelado', 'Sem programa'] as const
    const distribution = groups.map((g) => ({ name: g, value: state.patients.filter((p) => statusOf(p.id) === g).length })).filter((d) => d.value > 0)
    const monthPrefix = TODAY.slice(0, 7)
    const months = Array.from({ length: 6 }, (_, i) => addMonths(monthPrefix + '-01', i - 5))
    const revenue = months.map((m) => ({ month: monthShort(m), valor: state.sales.filter((s) => s.paymentStatus === 'Pago' && (s.paidAt ?? s.saleDate).slice(0, 7) === m.slice(0, 7)).reduce((n, s) => n + finalPrice(s), 0) }))
    const monthSales = state.sales.filter((s) => s.saleDate.slice(0, 7) === monthPrefix && s.paymentStatus !== 'Cancelado')
    const pendingSales = state.sales.filter((s) => s.paymentStatus === 'Pendente')
    // Alertas de EXEMPLO — quais eventos geram alerta e com qual antecedência ainda será definido com o Dr. André.
    const alerts = [
      ...enrolled.map(({ p, enr }) => ({ p, sit: followUpSituation(state, p, enr!) }))
        .filter(({ sit }) => sit.missing.length > 0)
        .map(({ p, sit }) => ({ id: `fu-${p.id}`, icon: <CalendarCheck size={15} />, p, text: `Passo ${sit.missing.map((m) => m.n).join(', ')} sem encontro registrado`, page: 'patient' as const, tab: 'followup' })),
      ...enrolled.filter(({ enr }) => daysToEnd(enr!.sale) <= DEMO_EXPIRY_WINDOW_DAYS)
        .map(({ p, enr }) => ({ id: `exp-${p.id}`, icon: <Clock3 size={15} />, p, text: `${enr!.contract.label.split(' —')[0]} vence em ${daysToEnd(enr!.sale)} dias — renovação a tratar`, page: 'patient' as const, tab: 'sales' })),
      ...state.conversations.filter((c) => !c.readByTeam || c.needsDoctor)
        .map((c) => ({ id: `msg-${c.id}`, icon: c.needsDoctor ? <Flag size={15} /> : <MessageCircle size={15} />, p: state.patients.find((x) => x.id === c.patientId)!, text: c.needsDoctor ? 'Mensagem sinalizada para o Dr. André' : 'Mensagem aguardando resposta', page: 'messages' as const, tab: undefined })),
      ...pendingSales.map((s) => ({ id: `pay-${s.id}`, icon: <CircleDollarSign size={15} />, p: state.patients.find((x) => x.id === s.patientId)!, text: 'Pagamento pendente — programa ainda não ativado', page: 'sales' as const, tab: undefined })),
    ]
    return { today, enrolled, vaccinesSoon, distribution, revenue, monthSales, pendingSales, alerts }
  }, [state])

  const patient = (id: string) => state.patients.find((p) => p.id === id)!
  const received = data.revenue.reduce((n, r) => n + r.valor, 0)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${isDoctor ? user!.name : firstName(user!.name)}!`}
        subtitle={isDoctor ? 'Visão completa: acompanhamento, operação e financeiro.' : 'Resumo da operação do dia.'}
        actions={<span className="date-chip"><CalendarCheck size={15} /> {fmtLongDate(TODAY)}</span>}
      />

      <div className="stats">
        <Stat icon={<CalendarCheck />} value={data.today.length} label="Atendimentos hoje" />
        <Stat icon={<Users />} value={data.enrolled.length} label="Programas ativos" tone="blue" />
        <Stat icon={<CircleDollarSign />} value={money(data.monthSales.reduce((s, x) => s + finalPrice(x), 0))} label="Vendas no mês" tone="lilac" />
        <Stat icon={<Clock3 />} value={data.pendingSales.length} label="Pagamentos pendentes" tone="amber" />
      </div>

      <div className="grid-2">
        <Card title="Próximos atendimentos" action={<button className="link-btn" onClick={() => go('agenda')}>Ver agenda <ArrowRight size={14} /></button>}>
          {data.today.length ? (
            <ul className="agenda-list">
              {data.today.map((a) => {
                const p = patient(a.patientId)
                const enr = activeEnrollment(state, p.id)
                return (
                  <li key={a.id}>
                    <time>{a.time}</time>
                    <PatientName patient={p} sub={`${ageLabel(p.birthDate, undefined, true)} · ${a.kind} · ${a.professional}`} />
                    {!enr && <span className="tag">Sem programa ativo</span>}
                    {a.status === 'Realizado' ? <StatusBadge status="Realizado" /> : (
                      <button className="btn btn-soft btn-sm" onClick={() => go('patient', p.id, enr ? 'followup' : 'overview')}>Abrir</button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : <Empty title="Nenhum atendimento hoje" />}
        </Card>

        <Card title={<>Alertas <Badge tone="gray">exemplos para validação</Badge></>}>
          {data.alerts.length ? (
            <ul className="simple-list">
              {data.alerts.slice(0, 7).map((a) => (
                <li key={a.id} className="clickable" onClick={() => go(a.page, a.page === 'sales' ? undefined : a.p.id, a.tab)}>
                  <span className="stat-icon tone-amber sm">{a.icon}</span>
                  <span className="grow"><strong>{a.p.name}</strong><small className="block muted">{a.text}</small></span>
                  <ArrowRight size={15} className="muted" />
                </li>
              ))}
            </ul>
          ) : <Empty icon={<BellRing />} title="Nenhum alerta" />}
          <p className="demo-note"><Info size={12} /> Quais eventos geram alertas e com qual antecedência ainda será definido com o Dr. André.</p>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Famílias por situação do programa">
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
              <span className="donut-center"><strong>{state.patients.length}</strong><small>famílias</small></span>
            </div>
            <ul className="legend">
              {data.distribution.map((d, i) => (
                <li key={d.name}><i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}<b>{d.value}</b></li>
              ))}
            </ul>
          </div>
          <p className="muted small">Toda família tem conta no Crescer; o programa ativo libera os benefícios.</p>
        </Card>

        <Card title="Recebimentos registrados" action={<span className="muted small">Últimos 6 meses · {money(received)}</span>}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${Number(v) / 1000}k`} />
              <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: 'var(--brand-soft)' }} />
              <Bar dataKey="valor" name="Recebido" fill="#5fb49c" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
          <button className="btn btn-ghost btn-block" onClick={() => go('sales')}><ShoppingBag size={15} /> Vendas e pagamentos</button>
        </Card>
      </div>

      <Card title="Vacinas a acompanhar" action={<button className="link-btn" onClick={() => go('vaccines')}>Vacinação <ArrowRight size={14} /></button>}>
        <p className="small"><Syringe size={14} /> {data.vaccinesSoon} doses atrasadas, pendentes ou próximas (30 dias) no total das crianças. Calendário SBP 2025/2026.</p>
        {data.pendingSales.length > 0 && <p className="small mt muted">Pagamentos pendentes: {data.pendingSales.map((s) => `${patient(s.patientId).name} (${contractOf(state.programs.find((p) => p.id === s.programId), s.contractId)?.label.split(' —')[0]}, venda ${fmtDate(s.saleDate)})`).join(' · ')}</p>}
      </Card>
    </>
  )
}
