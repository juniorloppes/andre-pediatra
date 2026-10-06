import { useState } from 'react'
import { ArrowLeft, CalendarDays, MessageCircle, Pencil, ShoppingBag } from 'lucide-react'
import { pendingVaccines } from '../domain'
import { FollowUpPanel } from '../panels/FollowUpPanel'
import { GrowthPanel } from '../panels/GrowthPanel'
import { VaccinePanel } from '../panels/VaccinePanel'
import { isClinical, useStore } from '../store'
import { Artwork, Card, Empty, StatusBadge, Tabs } from '../ui'
import { activeEnrollment, ageLabel, contractOf, finalPrice, fmtDate, money, programStatus, TODAY } from '../utils'
import { ExpiryBadge } from './Sales'
import { PatientForm, patientSituation } from './Patients'

type Tab = 'overview' | 'followup' | 'growth' | 'vaccines' | 'sales'

export function PatientDetail() {
  const { state, route, go, user } = useStore()
  const patient = state.patients.find((p) => p.id === route.id)
  const [editing, setEditing] = useState(false)
  if (!patient || !user) return <Empty title="Paciente não encontrado" action={<button className="btn btn-ghost" onClick={() => go('patients')}>Voltar</button>} />

  const enr = activeEnrollment(state, patient.id)
  const sit = patientSituation(state, patient)
  const clinical = isClinical(user.role)
  const sells = true // Dr. André (proprietário), secretaria e admin
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Visão geral' },
    ...(enr ? [{ id: 'followup' as Tab, label: 'Acompanhamento' }] : []),
    { id: 'growth', label: 'Crescimento' },
    { id: 'vaccines', label: 'Vacinação' },
    ...(sells ? [{ id: 'sales' as Tab, label: 'Vendas' }] : []),
  ]
  const tab = (tabs.find((t) => t.id === route.tab)?.id ?? 'overview') as Tab
  const appts = state.appointments.filter((a) => a.patientId === patient.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const next = appts.filter((a) => a.date >= TODAY && a.status === 'Agendado').reverse()[0]
  const sales = state.sales.filter((s) => s.patientId === patient.id).sort((a, b) => b.saleDate.localeCompare(a.saleDate))
  const lastGrowth = state.growth.filter((g) => g.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const vaccines = pendingVaccines(state, patient)

  return (
    <>
      <button className="back" onClick={() => go('patients')}><ArrowLeft size={16} /> Pacientes</button>
      <header className="patient-head">
        <Artwork seed={patient.name} className="patient-art" />
        <div>
          <h1>{patient.name}</h1>
          <p className="muted">{ageLabel(patient.birthDate)} · nascid{patient.sex === 'F' ? 'a' : 'o'} em {fmtDate(patient.birthDate)} · {patient.guardian} ({patient.guardianRelation.toLowerCase()})</p>
          <p className="chips"><span className="tag">{sit.program}{'contract' in sit && sit.contract ? ` · ${sit.contract}` : ''}</span><StatusBadge status={sit.status} />{'sale' in sit && sit.sale && <ExpiryBadge sale={sit.sale} />}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Editar</button>
          <button className="btn btn-ghost" onClick={() => go('messages', patient.id)}><MessageCircle size={15} /> Mensagens</button>
          {sells && !enr && <button className="btn btn-primary" onClick={() => go('new-sale', patient.id)}><ShoppingBag size={15} /> Vender programa</button>}
        </div>
      </header>

      <Tabs value={tab} onChange={(t) => go('patient', patient.id, t)} items={tabs} />

      <div className="tab-body">
        {tab === 'overview' && (
          <div className="grid-3">
            <Card title="Responsável">
              <dl className="dl">
                <dt>Nome</dt><dd>{patient.guardian}</dd>
                <dt>Parentesco</dt><dd>{patient.guardianRelation}</dd>
                <dt>Telefone</dt><dd>{patient.phone || '—'}</dd>
                <dt>E-mail</dt><dd>{patient.email || '—'}</dd>
              </dl>
              {patient.notes && <p className="note">{patient.notes}</p>}
              <p className="muted small mt">Prontuário clínico: Clínica Experts.</p>
            </Card>
            <Card title="Programa contratado">
              {enr ? (
                <dl className="dl">
                  <dt>Produto</dt><dd>{enr.program.name}</dd>
                  <dt>Contrato</dt><dd>{enr.contract.label}</dd>
                  <dt>Vigência</dt><dd>{fmtDate(enr.sale.startDate)} a {fmtDate(enr.sale.endDate)}</dd>
                  <dt>Passo atual</dt><dd>{sit.kind === 'active' ? `${sit.step} de ${enr.program.steps.length}` : '—'}</dd>
                  <dt>Situação</dt><dd><StatusBadge status="Programa ativo" /></dd>
                </dl>
              ) : <Empty title={sit.kind === 'pending' ? 'Pagamento pendente' : sit.kind === 'ended' ? sit.status : 'Sem programa contratado'}
                  text={sit.kind === 'pending' ? 'O programa será ativado quando o pagamento for registrado.' : 'A família mantém a conta no Crescer, mas não pode enviar mensagens.'} />}
            </Card>
            <Card title="Resumo">
              <dl className="dl">
                <dt>Próximo encontro</dt><dd>{next ? `${fmtDate(next.date)} às ${next.time}` : '—'}</dd>
                <dt>Última medição</dt><dd>{lastGrowth ? `${lastGrowth.weight.toLocaleString('pt-BR')} kg · ${lastGrowth.height.toLocaleString('pt-BR')} cm (${fmtDate(lastGrowth.date)})` : '—'}</dd>
                <dt>Vacinas</dt><dd>{vaccines.length ? `${vaccines.length} pendente(s)/próxima(s)` : 'Em dia'}</dd>
              </dl>
            </Card>
            <Card title="Agenda" className="span-3">
              {appts.length ? (
                <ul className="simple-list">
                  {appts.slice(0, 6).map((a) => (
                    <li key={a.id}>
                      <span className="person"><span className="stat-icon tone-green sm"><CalendarDays /></span><span><strong>{fmtDate(a.date)} · {a.time}</strong><small>{a.kind} · {a.professional}</small></span></span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              ) : <Empty title="Sem agendamentos" />}
            </Card>
          </div>
        )}
        {tab === 'followup' && enr && <FollowUpPanel patient={patient} enrollment={enr} canEdit={clinical} />}
        {tab === 'growth' && <GrowthPanel patient={patient} canEdit={clinical} />}
        {tab === 'vaccines' && <VaccinePanel patient={patient} canEdit />}
        {tab === 'sales' && (
          <Card title="Histórico de vendas" action={<button className="btn btn-primary btn-sm" onClick={() => go('new-sale', patient.id)}>Nova venda</button>}>
            {sales.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Produto</th><th>Valor</th><th>Pagamento</th><th>Venda</th><th>Vigência</th><th>Situação do programa</th></tr></thead>
                  <tbody>
                    {sales.map((s) => {
                      const pr = state.programs.find((p) => p.id === s.programId)
                      return (
                        <tr key={s.id}>
                          <td>{pr?.name}<small className="block muted">{contractOf(pr, s.contractId)?.label}</small></td>
                          <td className="num">{money(finalPrice(s))}</td>
                          <td><StatusBadge status={s.paymentStatus} /><small className="block muted">{s.payment}</small></td>
                          <td>{fmtDate(s.saleDate)}</td>
                          <td>{fmtDate(s.startDate)} a {fmtDate(s.endDate)}</td>
                          <td><StatusBadge status={programStatus(s)} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <Empty title="Nenhuma venda para este paciente" />}
          </Card>
        )}
      </div>
      {editing && <PatientForm patient={patient} onClose={() => setEditing(false)} />}
    </>
  )
}
