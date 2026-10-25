import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlanBadge, StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { KpiCard, KpiSkeletonRow } from '../../components/KpiCard'
import { useData } from '../../store/DataContext'
import { useToast } from '../../store/ToastContext'
import type { Customer, CustomerInput, CustomerStatus, Plan, SortDir, SortKey } from '../../types'
import { PLANS, STATUSES } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { CustomerFormModal } from './CustomerFormModal'

function newThisMonth(customers: Customer[]) {
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return customers.filter((c) => c.joinDate.startsWith(prefix)).length
}

export function CustomersPage() {
  const { customers, transactions, loading, addCustomer, updateCustomer, deactivateCustomer } = useData()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all')
  const [plan, setPlan] = useState<Plan | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<Customer | null>(null)

  const kpis = useMemo(() => {
    const active = customers.filter((c) => c.status === 'Active').length
    const revenue = customers
      .filter((c) => c.status === 'Active' || c.status === 'Trial')
      .reduce((sum, c) => sum + c.monthlyRevenue, 0)
    return {
      total: customers.length,
      active,
      newest: newThisMonth(customers),
      revenue,
    }
  }, [customers])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchesStatus = status === 'all' || c.status === status
      const matchesPlan = plan === 'all' || c.plan === plan
      return matchesQuery && matchesStatus && matchesPlan
    })
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      if (sortKey === 'monthlyRevenue') cmp = a.monthlyRevenue - b.monthlyRevenue
      if (sortKey === 'joinDate') cmp = a.joinDate.localeCompare(b.joinDate)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [customers, query, status, plan, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'name' ? 'asc' : 'desc')
  }

  function handleCreate(input: CustomerInput) {
    addCustomer(input)
    setFormOpen(false)
    notify('Customer added.')
  }

  function handleUpdate(input: CustomerInput) {
    if (!editing) return
    updateCustomer(editing.id, input)
    setEditing(null)
    notify('Customer updated.')
  }

  function handleDeactivate() {
    if (!pendingDeactivate) return
    deactivateCustomer(pendingDeactivate.id)
    notify(`${pendingDeactivate.name} was deactivated.`)
    setPendingDeactivate(null)
  }

  if (loading) {
    return (
      <>
        <KpiSkeletonRow />
        <div className="skeleton" style={{ height: 360 }} />
      </>
    )
  }

  return (
    <>
      <section className="kpi-grid" aria-label="Customer metrics">
        <KpiCard label="Total customers" value={String(kpis.total)} />
        <KpiCard label="Active customers" value={String(kpis.active)} />
        <KpiCard label="New customers" value={String(kpis.newest)} hint="Joined this month" />
        <KpiCard
          label="Total customer revenue"
          value={formatCurrency(kpis.revenue)}
          hint="Monthly recurring from active and trial accounts"
        />
      </section>

      <section className="card">
        <div className="panel">
          <div className="toolbar">
            <div className="field search">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                className="input"
                placeholder="Name, company, or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus | 'all')}
              >
                <option value="all">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="planFilter">Subscription plan</label>
              <select
                id="planFilter"
                className="select"
                value={plan}
                onChange={(e) => setPlan(e.target.value as Plan | 'all')}
              >
                <option value="all">All plans</option>
                {PLANS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginLeft: 'auto', justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
                Add customer
              </button>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            copy="Add your first customer to start tracking accounts and revenue."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
                Add customer
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No customers found"
            copy="No records match the current search or filters."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                  setPlan('all')
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('name')}>
                      Customer name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subscription plan</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('monthlyRevenue')}>
                      Monthly revenue {sortKey === 'monthlyRevenue' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th>Status</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('joinDate')}>
                      Join date {sortKey === 'joinDate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((customer) => (
                  <tr
                    key={customer.id}
                    className="row-link"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="cell-name">{customer.name}</td>
                    <td>{customer.company}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <PlanBadge plan={customer.plan} />
                    </td>
                    <td>{formatCurrency(customer.monthlyRevenue)}</td>
                    <td>
                      <StatusBadge status={customer.status} />
                    </td>
                    <td>{formatDate(customer.joinDate)}</td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary icon-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditing(customer)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost icon-btn"
                          disabled={customer.status === 'Inactive'}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingDeactivate(customer)
                          }}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen ? (
        <CustomerFormModal onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      ) : null}
      {editing ? (
        <CustomerFormModal customer={editing} onClose={() => setEditing(null)} onSubmit={handleUpdate} />
      ) : null}
      {pendingDeactivate ? (
        <ConfirmDialog
          title="Deactivate customer"
          message={`${pendingDeactivate.name} will be marked inactive. Historical revenue is retained.`}
          confirmLabel="Deactivate"
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={handleDeactivate}
        />
      ) : null}
      <p className="kpi-hint">{transactions.length} billed periods stored for analytics.</p>
    </>
  )
}
