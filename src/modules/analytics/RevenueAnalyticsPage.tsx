import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PlanBadge, StatusBadge } from '../../components/Badge'
import { EmptyState } from '../../components/EmptyState'
import { KpiCard, KpiSkeletonRow } from '../../components/KpiCard'
import { useData } from '../../store/DataContext'
import type { AnalyticsFilters } from '../../utils/analytics'
import {
  buildInsights,
  customersByPlan,
  filterCustomers,
  filterTransactions,
  growthRate,
  lastTwoMonthTotals,
  monthlyRecurringRevenue,
  revenueByMonth,
  revenueByPlan,
  sumAmount,
  totalCustomerRevenue,
} from '../../utils/analytics'
import type { CustomerStatus, DateRangeKey, Plan } from '../../types'
import { PLANS, STATUSES } from '../../types'
import { formatCurrency, formatPercent, monthLabel } from '../../utils/format'

const COLORS = ['#94a3b8', '#64748b', '#0d9488', '#0f2744']

const RANGES: { value: DateRangeKey; label: string }[] = [
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
]

export function RevenueAnalyticsPage() {
  const { customers, transactions, loading } = useData()
  const [filters, setFilters] = useState<AnalyticsFilters>({
    range: '12m',
    plan: 'all',
    status: 'all',
  })

  const scopedCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters])
  const scopedTxns = useMemo(
    () => filterTransactions(transactions, customers, filters),
    [transactions, customers, filters],
  )

  const trend = useMemo(
    () => revenueByMonth(scopedTxns).map((row) => ({ ...row, label: monthLabel(row.key) })),
    [scopedTxns],
  )
  const planRevenue = useMemo(() => revenueByPlan(scopedTxns), [scopedTxns])
  const planMix = useMemo(() => customersByPlan(scopedCustomers), [scopedCustomers])
  const totalRevenue = sumAmount(scopedTxns)
  const mrr = monthlyRecurringRevenue(scopedCustomers)
  const activeCount = scopedCustomers.filter((c) => c.status === 'Active').length
  const { current, previous } = lastTwoMonthTotals(trend)
  const growth = growthRate(current, previous)
  const insights = useMemo(
    () => buildInsights(scopedCustomers, scopedTxns, customers),
    [scopedCustomers, scopedTxns, customers],
  )

  const topCustomers = useMemo(() => {
    return [...scopedCustomers]
      .map((customer) => ({
        customer,
        revenue: totalCustomerRevenue(customer.id, scopedTxns),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [scopedCustomers, scopedTxns])

  if (loading) {
    return (
      <>
        <KpiSkeletonRow />
        <div className="skeleton" style={{ height: 300 }} />
      </>
    )
  }

  return (
    <>
      <section className="card panel">
        <div className="toolbar">
          <div className="field">
            <label htmlFor="range">Date range</label>
            <select
              id="range"
              className="select"
              value={filters.range}
              onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as DateRangeKey }))}
            >
              {RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="analyticsPlan">Subscription plan</label>
            <select
              id="analyticsPlan"
              className="select"
              value={filters.plan}
              onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value as Plan | 'all' }))}
            >
              <option value="all">All plans</option>
              {PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="analyticsStatus">Customer status</label>
            <select
              id="analyticsStatus"
              className="select"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as CustomerStatus | 'all' }))}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard label="Total revenue" value={formatCurrency(totalRevenue)} hint="Recognized in the selected range" />
        <KpiCard label="Monthly recurring revenue" value={formatCurrency(mrr)} hint="Active and trial contracts" />
        <KpiCard label="Active customers" value={String(activeCount)} />
        <KpiCard
          label="Revenue growth"
          value={formatPercent(growth)}
          hint="Latest month versus prior month"
        />
      </section>

      <section className="grid-2">
        <article className="card panel">
          <h3>Revenue trend</h3>
          <p className="sub">Monthly recognized revenue from billed customer periods.</p>
          <div className="chart-box">
            {trend.length === 0 ? (
              <EmptyState title="No revenue in this range" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
        <article className="card panel">
          <h3>Revenue by subscription</h3>
          <p className="sub">Share of recognized revenue by plan.</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planRevenue}
                  dataKey="revenue"
                  nameKey="plan"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {planRevenue.map((entry, index) => (
                    <Cell key={entry.plan} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid-2">
        <article className="card panel">
          <h3>Customer distribution</h3>
          <p className="sub">Customers in the current filter set by plan.</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planMix}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="plan" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16375f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card panel">
          <h3>Top customers</h3>
          <p className="sub">Highest recognized revenue in the selected period.</p>
          {topCustomers.length === 0 ? (
            <EmptyState title="No customers found" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Company</th>
                    <th>Plan</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map(({ customer, revenue }) => (
                    <tr key={customer.id}>
                      <td className="cell-name">{customer.name}</td>
                      <td>{customer.company}</td>
                      <td>
                        <PlanBadge plan={customer.plan} />
                      </td>
                      <td>{formatCurrency(revenue)}</td>
                      <td>
                        <StatusBadge status={customer.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="card panel">
        <h3>Business insights</h3>
        <p className="sub">Rule-based observations from the current customer and revenue data. These are not AI-generated.</p>
        {insights.length === 0 ? (
          <EmptyState title="Not enough data for insights" />
        ) : (
          <div className="insights">
            {insights.map((insight) => (
              <article key={insight.title} className="insight">
                <h4>{insight.title}</h4>
                <p>{insight.detail}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
