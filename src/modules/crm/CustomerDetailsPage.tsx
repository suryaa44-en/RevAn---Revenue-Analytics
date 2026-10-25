import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlanBadge, StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { KpiCard } from '../../components/KpiCard'
import { useData } from '../../store/DataContext'
import { useToast } from '../../store/ToastContext'
import type { CustomerInput } from '../../types'
import { formatCurrency, formatDate, monthsBetween, parseIsoDate } from '../../utils/format'
import { totalCustomerRevenue } from '../../utils/analytics'
import { CustomerFormModal } from './CustomerFormModal'

export function CustomerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomer, transactions, updateCustomer, deactivateCustomer, loading } = useData()
  const { notify } = useToast()
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const customer = id ? getCustomer(id) : undefined
  const lifetime = useMemo(
    () => (customer ? totalCustomerRevenue(customer.id, transactions) : 0),
    [customer, transactions],
  )
  const invoices = useMemo(
    () =>
      customer
        ? transactions
            .filter((txn) => txn.customerId === customer.id)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [customer, transactions],
  )

  if (loading) {
    return <div className="skeleton" style={{ height: 320 }} />
  }

  if (!customer) {
    return (
      <section className="card">
        <EmptyState
          title="Customer not found"
          copy="This record is unavailable. Return to the customer list."
          action={
            <Link to="/customers" className="btn btn-primary">
              Back to customers
            </Link>
          }
        />
      </section>
    )
  }

  const record = customer
  const join = parseIsoDate(record.joinDate)
  const tenure = join ? Math.max(1, monthsBetween(join, new Date()) + 1) : 1
  const lastInvoice = invoices[0]

  function save(input: CustomerInput) {
    updateCustomer(record.id, input)
    setEditing(false)
    notify('Customer updated.')
  }

  function deactivate() {
    deactivateCustomer(record.id)
    setConfirm(false)
    notify(`${record.name} was deactivated.`)
  }

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
          Back to customers
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={record.status === 'Inactive'}
          onClick={() => setConfirm(true)}
        >
          Deactivate
        </button>
      </div>

      <section className="kpi-grid">
        <KpiCard label="Monthly revenue" value={formatCurrency(record.monthlyRevenue)} />
        <KpiCard label="Total revenue" value={formatCurrency(lifetime)} hint="Recognized billed periods" />
        <KpiCard label="Tenure" value={`${tenure} mo`} hint={`Joined ${formatDate(record.joinDate)}`} />
        <KpiCard
          label="Last invoice"
          value={lastInvoice ? formatCurrency(lastInvoice.amount) : '—'}
          hint={lastInvoice ? formatDate(lastInvoice.date) : 'No billing history'}
        />
      </section>

      <section className="details-grid">
        <article className="card panel">
          <h3>Customer information</h3>
          <p className="sub">{record.company}</p>
          <dl className="dl">
            <dt>Customer</dt>
            <dd>{record.name}</dd>
            <dt>Company</dt>
            <dd>{record.company}</dd>
            <dt>Email</dt>
            <dd>{record.email}</dd>
            <dt>Phone</dt>
            <dd>{record.phone}</dd>
            <dt>Subscription plan</dt>
            <dd>
              <PlanBadge plan={record.plan} />
            </dd>
            <dt>Monthly revenue</dt>
            <dd>{formatCurrency(record.monthlyRevenue)}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={record.status} />
            </dd>
            <dt>Join date</dt>
            <dd>{formatDate(record.joinDate)}</dd>
            <dt>Total revenue</dt>
            <dd>{formatCurrency(lifetime)}</dd>
          </dl>
        </article>
        <article className="card panel">
          <h3>Customer activity summary</h3>
          <p className="sub">Derived from account status and billed periods.</p>
          <ul className="activity-list">
            <li>
              Account opened on {formatDate(record.joinDate)} on the {record.plan} plan.
            </li>
            <li>
              Current status is {record.status.toLowerCase()} with {formatCurrency(record.monthlyRevenue)} in
              contracted monthly revenue.
            </li>
            <li>
              {invoices.length} billed period{invoices.length === 1 ? '' : 's'} recorded, totaling{' '}
              {formatCurrency(lifetime)}.
            </li>
            <li>
              {lastInvoice
                ? `Most recent recognition was ${formatDate(lastInvoice.date)}.`
                : 'No invoices have been recognized yet.'}
            </li>
          </ul>
        </article>
      </section>

      {editing ? (
        <CustomerFormModal customer={record} onClose={() => setEditing(false)} onSubmit={save} />
      ) : null}
      {confirm ? (
        <ConfirmDialog
          title="Deactivate customer"
          message={`${record.name} will be marked inactive. Historical revenue is retained.`}
          confirmLabel="Deactivate"
          onCancel={() => setConfirm(false)}
          onConfirm={deactivate}
        />
      ) : null}
    </>
  )
}
