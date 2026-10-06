import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Plus, RefreshCw, Search, ShoppingBag, XCircle } from 'lucide-react'
import { useStore } from '../store'
import type { PaymentMethod, PaymentStatus, ProgramStatus, Sale } from '../types'
import { Badge, Card, Empty, Field, PageHeader, PatientName, StatusBadge, Tabs } from '../ui'
import {
  activeEnrollment, addMonths, ageDays, ageLabel, contractOf, daysToEnd, DEMO_EXPIRY_WINDOW_DAYS, finalPrice, fmtDate, money,
  normalize, programStatus, TODAY, uid,
} from '../utils'

type Filter = 'all' | ProgramStatus
const PAGE = 8

/** Fluxo comercial explicado visualmente. */
export function CommercialFlow() {
  const steps = ['Produto / programa', 'Venda', 'Pagamento', 'Programa ativo', 'Vigência', 'Renovação ou encerramento']
  return (
    <ol className="flow">
      {steps.map((s, i) => <li key={s}><span>{i + 1}</span>{s}{i < steps.length - 1 && <ArrowRight size={14} />}</li>)}
    </ol>
  )
}

export const ExpiryBadge = ({ sale }: { sale: Sale }) => {
  const d = daysToEnd(sale)
  return programStatus(sale) === 'Programa ativo' && d <= DEMO_EXPIRY_WINDOW_DAYS ? <Badge tone="amber">Vence em {d} dias</Badge> : null
}

export function Sales() {
  const { state, update, go, toast } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => [...state.sales]
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
    .map((s) => {
      const program = state.programs.find((x) => x.id === s.programId)
      return { s, p: state.patients.find((x) => x.id === s.patientId)!, program, contract: contractOf(program, s.contractId), status: programStatus(s) }
    })
    .filter(({ p, status }) => (filter === 'all' || status === filter) && normalize(`${p.name} ${p.guardian}`).includes(normalize(q))), [state, filter, q])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = rows.slice(page * PAGE, page * PAGE + PAGE)
  const received = state.sales.filter((s) => s.paymentStatus === 'Pago').reduce((n, s) => n + finalPrice(s), 0)
  const pending = state.sales.filter((s) => s.paymentStatus === 'Pendente').reduce((n, s) => n + finalPrice(s), 0)

  const setPayment = (id: string, paymentStatus: PaymentStatus) => {
    if (paymentStatus === 'Cancelado' && !confirm('Cancelar esta venda? O programa deixa de estar ativo. (Regras de cancelamento ainda serão definidas com o Dr. André.)')) return
    update((s) => ({ ...s, sales: s.sales.map((x) => (x.id === id ? { ...x, paymentStatus, paidAt: paymentStatus === 'Pago' ? TODAY : x.paidAt } : x)) }))
    toast(paymentStatus === 'Pago' ? 'Pagamento registrado — programa ativado' : 'Venda cancelada')
  }

  const counts = (st: ProgramStatus) => state.sales.filter((s) => programStatus(s) === st).length

  return (
    <>
      <PageHeader title="Vendas e Programas" subtitle="Produto vendido para a criança/família, pagamento, ativação e vigência."
        actions={<button className="btn btn-primary" onClick={() => go('new-sale')}><Plus size={16} /> Nova venda</button>} />
      <CommercialFlow />
      <div className="stats">
        <div className="stat plain"><span><strong>{money(received)}</strong><small>Recebido (pagamentos registrados)</small></span></div>
        <div className="stat plain"><span><strong>{money(pending)}</strong><small>Pagamentos pendentes</small></span></div>
        <div className="stat plain"><span><strong>{counts('Programa ativo')}</strong><small>Programas ativos</small></span></div>
        <div className="stat plain"><span><strong>{counts('Programa encerrado')}</strong><small>Programas encerrados</small></span></div>
      </div>
      <Card>
        <div className="toolbar">
          <Tabs value={filter} onChange={(f) => { setFilter(f); setPage(0) }} items={[
            { id: 'all', label: 'Todas' }, { id: 'Programa ativo', label: 'Ativos' }, { id: 'Pagamento pendente', label: 'Pagamento pendente' },
            { id: 'Programa encerrado', label: 'Encerrados' }, { id: 'Cancelado', label: 'Cancelados' },
          ]} />
          <label className="search"><Search size={16} /><input placeholder="Buscar criança ou responsável" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} /></label>
        </div>
        {current.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Criança / responsável</th><th>Produto</th><th>Valor</th><th>Pagamento</th><th>Venda</th><th>Vigência</th><th>Situação do programa</th><th /></tr></thead>
              <tbody>
                {current.map(({ s, p, program, contract, status }) => {
                  const renewable = contract?.id === 'ano1' && ((status === 'Programa ativo' && daysToEnd(s) <= DEMO_EXPIRY_WINDOW_DAYS) || status === 'Programa encerrado')
                    && !state.sales.some((x) => x.patientId === p.id && x.contractId === 'ano2' && x.paymentStatus !== 'Cancelado')
                  return (
                    <tr key={s.id}>
                      <td><button className="plain" onClick={() => go('patient', p.id, 'sales')}><PatientName patient={p} /></button></td>
                      <td className="nowrap"><strong>{contract?.label.split(' —')[0]}</strong><small className="block muted">{program?.name}</small><small className="block muted">{contract?.label.split('— ')[1]}</small></td>
                      <td className="num">{money(finalPrice(s))}{s.discount > 0 && <small className="block muted">tabela {money(s.listPrice)} · desc. {money(s.discount)}</small>}</td>
                      <td><StatusBadge status={s.paymentStatus} /><small className="block muted">{s.payment}{s.installments > 1 ? ` · ${s.installments}x` : ''}</small></td>
                      <td>{fmtDate(s.saleDate)}</td>
                      <td className="nowrap">{fmtDate(s.startDate)}<small className="block muted">até {fmtDate(s.endDate)}</small></td>
                      <td><StatusBadge status={status} /> <ExpiryBadge sale={s} /></td>
                      <td className="row-actions">
                        {s.paymentStatus === 'Pendente' && <button className="btn btn-soft btn-sm" onClick={() => setPayment(s.id, 'Pago')}><CheckCircle2 size={14} /> Registrar pagamento</button>}
                        {renewable && <button className="btn btn-ghost btn-sm" onClick={() => go('new-sale', p.id, 'ano2')} title="Abre uma nova venda do Ano 2 — sem renovação automática"><RefreshCw size={14} /> Renovar (Ano 2)</button>}
                        {s.paymentStatus !== 'Cancelado' && status !== 'Programa encerrado' && <button className="icon-btn" title="Cancelar venda" aria-label="Cancelar venda" onClick={() => setPayment(s.id, 'Cancelado')}><XCircle size={16} /></button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={<ShoppingBag />} title="Nenhuma venda encontrada" />}
        <footer className="table-foot">
          <span className="muted small"><Info size={13} /> Formas de pagamento são dados demonstrativos — o Crescer apenas registra; meios de pagamento e processamento ainda serão definidos com o Dr. André.</span>
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
  const products = state.programs.filter((p) => p.active).flatMap((p) => p.contracts.map((c) => ({ program: p, contract: c, key: `${p.id}:${c.id}` })))
  const suggest = (patientId: string) => {
    const pt = state.patients.find((x) => x.id === patientId)
    if (!pt) return products[0]?.key ?? ''
    const age = ageDays(pt.birthDate)
    return products.find((x) => age < x.program.steps[x.contract.toStep - 1]?.endDay)?.key ?? products[0]?.key ?? ''
  }
  const [patientId, setPatientId] = useState(route.id ?? '')
  const [productKey, setProductKey] = useState(() => (route.tab ? products.find((x) => x.contract.id === route.tab)?.key : undefined) ?? suggest(route.id ?? ''))
  const product = products.find((x) => x.key === productKey)
  const patient = state.patients.find((p) => p.id === patientId)
  const [discount, setDiscount] = useState('0')
  const [payment, setPayment] = useState<PaymentMethod>('A definir')
  const [installments, setInstallments] = useState(1)
  const [saleDate, setSaleDate] = useState(TODAY)
  const [startDate, setStartDate] = useState(TODAY)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pendente')
  const [error, setError] = useState('')

  const listPrice = product?.contract.price ?? 0
  const disc = Math.max(0, Number(discount.replace(',', '.')) || 0)
  const endDate = product ? addMonths(startDate, product.contract.durationMonths) : startDate
  const existing = patient && activeEnrollment(state, patient.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!patient || !product) return setError('Selecione a criança e o produto.')
    if (disc > listPrice) return setError('O desconto não pode ser maior que o valor da tabela.')
    if (existing && existing.contract.id === product.contract.id) return setError('Esta criança já tem este contrato ativo.')
    const sale: Sale = {
      id: `s-${uid()}`, patientId: patient.id, programId: product.program.id, contractId: product.contract.id, listPrice, discount: disc,
      payment, installments: payment === 'Cartão de crédito' ? installments : 1, saleDate, startDate, endDate, paymentStatus,
      paidAt: paymentStatus === 'Pago' ? saleDate : undefined, createdBy: user?.name ?? '',
    }
    update((s) => ({ ...s, sales: [...s.sales, sale] }))
    toast(paymentStatus === 'Pago' ? 'Venda registrada — programa ativado' : 'Venda registrada — aguardando pagamento')
    go('sales')
  }

  return (
    <>
      <button className="back" onClick={() => go('sales')}><ArrowLeft size={16} /> Vendas</button>
      <PageHeader title="Nova venda" subtitle="Vincule um produto/programa a uma criança. O programa fica ativo quando o pagamento é registrado." />
      <CommercialFlow />
      <Card className="narrow">
        <form className="form-grid" onSubmit={submit}>
          <p className="form-section field-full">1. Família e criança</p>
          <Field label="Criança">
            <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setProductKey(suggest(e.target.value)) }}>
              <option value="">Selecione…</option>
              {[...state.patients].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.id}>{p.name} ({ageLabel(p.birthDate, undefined, true)})</option>)}
            </select>
          </Field>
          <Field label="Responsável"><input value={patient?.guardian ?? ''} disabled placeholder="—" /></Field>

          <p className="form-section field-full">2. Produto / programa</p>
          <Field label="Produto" full hint={product && <>{product.program.description} Contrato cobre os passos {product.contract.fromStep} a {product.contract.toStep}.</>}>
            <select value={productKey} onChange={(e) => setProductKey(e.target.value)}>
              {products.map((x) => <option key={x.key} value={x.key}>{x.program.name} — {x.contract.label}</option>)}
            </select>
          </Field>
          {existing && <p className="alert alert-amber field-full">{patient!.name.split(' ')[0]} já tem {existing.program.name} ({existing.contract.label}) ativo até {fmtDate(existing.sale.endDate)}.</p>}
          <div className="form-row-3 field-full">
            <Field label="Valor da tabela"><input value={money(listPrice)} disabled /></Field>
            <Field label="Desconto (R$)"><input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
            <Field label="Valor final"><input className="strong" value={money(Math.max(0, listPrice - disc))} disabled /></Field>
          </div>

          <p className="form-section field-full">3. Pagamento (registro)</p>
          <div className="form-row-3 field-full">
            <Field label="Forma de pagamento" hint="Demonstrativo — a definir com o Dr. André">
              <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
                {(['A definir', 'PIX', 'Cartão de crédito', 'Boleto', 'Transferência', 'Dinheiro'] as PaymentMethod[]).map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            {payment === 'Cartão de crédito' ? (
              <Field label="Parcelas">
                <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x de {money(Math.max(0, listPrice - disc) / n)}</option>)}
                </select>
              </Field>
            ) : <span />}
            <Field label="Situação do pagamento" hint={paymentStatus === 'Pago' ? 'Ativa o programa e seus benefícios.' : 'O programa será ativado quando o pagamento for registrado.'}>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
                <option>Pendente</option><option>Pago</option>
              </select>
            </Field>
          </div>

          <p className="form-section field-full">4. Vigência</p>
          <div className="form-row-3 field-full">
            <Field label="Data da venda"><input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></Field>
            <Field label="Início da vigência"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Término da vigência" hint={product && `${product.contract.durationMonths} meses (configurável no programa)`}><input value={fmtDate(endDate)} disabled /></Field>
          </div>
          {error && <p className="form-error field-full">{error}</p>}
          <button className="btn btn-primary btn-block field-full" type="submit">Registrar venda{paymentStatus === 'Pago' ? ' e ativar programa' : ''}</button>
        </form>
      </Card>
    </>
  )
}
