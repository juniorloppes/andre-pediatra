import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Plus, Search, ShoppingBag } from 'lucide-react'
import { useStore } from '../store'
import type { PaymentMethod, Sale, SaleStatus } from '../types'
import { Card, Empty, Field, PageHeader, PatientName, StatusBadge, Tabs } from '../ui'
import { activeEnrollment, ageDays, ageLabel, finalPrice, fmtDate, money, normalize, TODAY, uid } from '../utils'

type Filter = 'all' | 'Ativo' | 'Pendente' | 'Cancelado'
const PAGE = 8

export function Sales() {
  const { state, update, go, toast } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => [...state.sales]
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
    .map((s) => ({ s, p: state.patients.find((x) => x.id === s.patientId)!, pr: state.programs.find((x) => x.id === s.programId)! }))
    .filter(({ s, p }) => {
      const label = s.status === 'Pago' ? 'Ativo' : s.status
      return (filter === 'all' || label === filter) && normalize(`${p.name} ${p.guardian}`).includes(normalize(q))
    }), [state, filter, q])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = rows.slice(page * PAGE, page * PAGE + PAGE)
  const total = rows.filter((r) => r.s.status === 'Pago').reduce((n, r) => n + finalPrice(r.s), 0)

  const setStatus = (id: string, status: SaleStatus) => {
    if (status === 'Cancelado' && !confirm('Cancelar esta venda? O acesso da família ao programa e às mensagens será bloqueado.')) return
    update((s) => ({ ...s, sales: s.sales.map((x) => (x.id === id ? { ...x, status } : x)) }))
    toast(status === 'Pago' ? 'Pagamento confirmado — programa ativado' : status === 'Cancelado' ? 'Venda cancelada' : 'Status atualizado')
  }

  return (
    <>
      <PageHeader title="Vendas e Programas" subtitle="Gerencie a venda dos programas e acompanhe o acesso das famílias."
        actions={<button className="btn btn-primary" onClick={() => go('new-sale')}><Plus size={16} /> Nova venda</button>} />
      <Card>
        <div className="toolbar">
          <Tabs value={filter} onChange={(f) => { setFilter(f); setPage(0) }} items={[
            { id: 'all', label: 'Todas' }, { id: 'Ativo', label: 'Ativas' }, { id: 'Pendente', label: 'Pendentes' }, { id: 'Cancelado', label: 'Canceladas' },
          ]} />
          <label className="search"><Search size={16} /><input placeholder="Buscar paciente" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} /></label>
        </div>
        {current.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Paciente</th><th>Programa</th><th>Valor</th><th>Pagamento</th><th>Status</th><th>Início</th><th>Ações</th></tr></thead>
              <tbody>
                {current.map(({ s, p, pr }) => (
                  <tr key={s.id}>
                    <td><button className="plain" onClick={() => go('patient', p.id, 'sales')}><PatientName patient={p} /></button></td>
                    <td>{pr.ageLabel}<small className="block muted">{pr.name}</small></td>
                    <td className="num">{money(finalPrice(s))}{s.discount > 0 && <small className="block muted">desc. {money(s.discount)}</small>}</td>
                    <td>{s.payment}{s.installments > 1 && <small className="block muted">{s.installments}x</small>}</td>
                    <td><StatusBadge status={s.status === 'Pago' ? 'Ativo' : s.status} /></td>
                    <td>{fmtDate(s.startDate)}</td>
                    <td>
                      <select className="compact" value={s.status} onChange={(e) => setStatus(s.id, e.target.value as SaleStatus)} aria-label="Alterar status">
                        <option value="Pago">Pago</option><option value="Pendente">Pendente</option><option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={<ShoppingBag />} title="Nenhuma venda encontrada" />}
        <footer className="table-foot">
          <span className="muted small">{rows.length} venda(s) · recebido: <b>{money(total)}</b></span>
          {pages > 1 && (
            <span className="pager">
              {Array.from({ length: pages }, (_, i) => <button key={i} className={i === page ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>)}
            </span>
          )}
        </footer>
      </Card>
    </>
  )
}

export function NewSale() {
  const { state, update, go, toast, route, user } = useStore()
  const programs = state.programs.filter((p) => p.active)
  const [patientId, setPatientId] = useState(route.id ?? '')
  const patient = state.patients.find((p) => p.id === patientId)
  const suggested = patient ? programs.find((p) => ageDays(patient.birthDate) < p.endAgeDays && ageDays(patient.birthDate) >= p.startAgeDays - 30) : undefined
  const [programId, setProgramId] = useState(suggested?.id ?? programs[0]?.id ?? '')
  const program = state.programs.find((p) => p.id === programId)
  const [discount, setDiscount] = useState('0')
  const [payment, setPayment] = useState<PaymentMethod>('PIX')
  const [installments, setInstallments] = useState(1)
  const [saleDate, setSaleDate] = useState(TODAY)
  const [startDate, setStartDate] = useState(TODAY)
  const [status, setStatus] = useState<SaleStatus>('Pago')
  const [error, setError] = useState('')

  const listPrice = program?.price ?? 0
  const disc = Math.max(0, Number(discount.replace(',', '.')) || 0)
  const existing = patient && activeEnrollment(state, patient.id)

  const pickPatient = (id: string) => {
    setPatientId(id)
    const p = state.patients.find((x) => x.id === id)
    const sug = p && programs.find((pr) => ageDays(p.birthDate) < pr.endAgeDays && ageDays(p.birthDate) >= pr.startAgeDays - 30)
    if (sug) setProgramId(sug.id)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!patient || !program) return setError('Selecione o paciente e o programa.')
    if (disc > listPrice) return setError('O desconto não pode ser maior que o valor da tabela.')
    if (existing && existing.program.id === program.id && status === 'Pago') return setError('Este paciente já tem este programa ativo.')
    const sale: Sale = { id: `s-${uid()}`, patientId: patient.id, programId: program.id, listPrice, discount: disc, payment, installments: payment === 'Cartão de crédito' ? installments : 1, saleDate, startDate, status, createdBy: user?.name ?? '' }
    update((s) => ({ ...s, sales: [...s.sales, sale] }))
    toast(status === 'Pago' ? 'Venda registrada e programa ativado' : 'Venda registrada — aguardando pagamento')
    go('sales')
  }

  return (
    <>
      <button className="back" onClick={() => go('sales')}><ArrowLeft size={16} /> Vendas</button>
      <PageHeader title="Nova venda de programa" subtitle="Registre a venda e ative o acesso da família." />
      <Card className="narrow">
        <form className="form-grid" onSubmit={submit}>
          <Field label="Paciente">
            <select value={patientId} onChange={(e) => pickPatient(e.target.value)}>
              <option value="">Selecione…</option>
              {[...state.patients].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.id}>{p.name} ({ageLabel(p.birthDate, undefined, true)})</option>)}
            </select>
          </Field>
          <Field label="Responsável"><input value={patient?.guardian ?? ''} disabled placeholder="—" /></Field>
          <Field label="Programa" full hint={program && <>{program.description} <b>{program.steps.length} passos · encontro a cada {program.cadenceDays} dias.</b></>}>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.ageLabel}{suggested?.id === p.id ? ' (indicado pela idade)' : ''}</option>)}
            </select>
          </Field>
          {existing && <p className="alert alert-amber field-full">{patient!.name.split(' ')[0]} já tem o programa {existing.program.name} {existing.program.ageLabel} ativo.</p>}
          <div className="form-row-3 field-full">
            <Field label="Valor da tabela"><input value={money(listPrice)} disabled /></Field>
            <Field label="Desconto (R$)"><input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
            <Field label="Valor final"><input className="strong" value={money(Math.max(0, listPrice - disc))} disabled /></Field>
          </div>
          <div className="form-row-3 field-full">
            <Field label="Forma de pagamento">
              <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
                {(['PIX', 'Cartão de crédito', 'Boleto', 'Transferência', 'Dinheiro'] as PaymentMethod[]).map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Data da venda"><input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></Field>
            <Field label="Início do programa"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          </div>
          <div className="form-row-3 field-full">
            {payment === 'Cartão de crédito' ? (
              <Field label="Parcelas">
                <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x de {money(Math.max(0, listPrice - disc) / n)}</option>)}
                </select>
              </Field>
            ) : <span />}
            <Field label="Status" hint={status === 'Pago' ? 'Libera programa, materiais e mensagens.' : status === 'Pendente' ? 'A família só terá acesso após a confirmação.' : undefined}>
              <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)}>
                <option>Pago</option><option>Pendente</option><option>Cancelado</option>
              </select>
            </Field>
          </div>
          {error && <p className="form-error field-full">{error}</p>}
          <button className="btn btn-primary btn-block field-full" type="submit">Registrar venda {status === 'Pago' ? 'e ativar programa' : ''}</button>
        </form>
      </Card>
    </>
  )
}
