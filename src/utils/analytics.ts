import type { Customer, CustomerStatus, DateRangeKey, Plan, Transaction } from '../types'
import { addMonths, monthKey, parseIsoDate, startOfMonth } from './format'

export type AnalyticsFilters = {
  range: DateRangeKey
  plan: Plan | 'all'
  status: CustomerStatus | 'all'
}

export function rangeStart(range: DateRangeKey, today = new Date()): Date | null {
  const start = startOfMonth(today)
  if (range === 'all') return null
  if (range === 'ytd') return new Date(today.getFullYear(), 0, 1)
  if (range === '6m') return addMonths(start, -5)
  return addMonths(start, -11)
}

export function customerMatchesFilters(customer: Customer, filters: AnalyticsFilters): boolean {
  if (filters.plan !== 'all' && customer.plan !== filters.plan) return false
  if (filters.status !== 'all' && customer.status !== filters.status) return false
  return true
}

export function filterCustomers(customers: Customer[], filters: AnalyticsFilters): Customer[] {
  return customers.filter((customer) => customerMatchesFilters(customer, filters))
}

export function filterTransactions(
  transactions: Transaction[],
  customers: Customer[],
  filters: AnalyticsFilters,
  today = new Date(),
): Transaction[] {
  const allowed = new Set(filterCustomers(customers, filters).map((c) => c.id))
  const from = rangeStart(filters.range, today)
  return transactions.filter((txn) => {
    if (!allowed.has(txn.customerId)) return false
    if (!from) return true
    const date = parseIsoDate(txn.date)
    return date ? date.getTime() >= from.getTime() : false
  })
}

export function sumAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, txn) => sum + txn.amount, 0)
}

export function monthlyRecurringRevenue(customers: Customer[]): number {
  return customers
    .filter((c) => c.status === 'Active' || c.status === 'Trial')
    .reduce((sum, c) => sum + (c.status === 'Trial' ? c.monthlyRevenue * 0.35 : c.monthlyRevenue), 0)
}

export function revenueByMonth(transactions: Transaction[]): { key: string; revenue: number }[] {
  const map = new Map<string, number>()
  for (const txn of transactions) {
    const date = parseIsoDate(txn.date)
    if (!date) continue
    const key = monthKey(date)
    map.set(key, (map.get(key) ?? 0) + txn.amount)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, revenue]) => ({ key, revenue }))
}

export function revenueByPlan(transactions: Transaction[]): { plan: Plan; revenue: number }[] {
  const map = new Map<Plan, number>()
  for (const txn of transactions) {
    map.set(txn.plan, (map.get(txn.plan) ?? 0) + txn.amount)
  }
  const order: Plan[] = ['Basic', 'Standard', 'Premium', 'Enterprise']
  return order.map((plan) => ({ plan, revenue: map.get(plan) ?? 0 }))
}

export function customersByPlan(customers: Customer[]): { plan: Plan; count: number }[] {
  const order: Plan[] = ['Basic', 'Standard', 'Premium', 'Enterprise']
  return order.map((plan) => ({
    plan,
    count: customers.filter((c) => c.plan === plan).length,
  }))
}

export function growthRate(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export function lastTwoMonthTotals(series: { key: string; revenue: number }[]): {
  current: number
  previous: number
} {
  if (series.length === 0) return { current: 0, previous: 0 }
  const current = series[series.length - 1]?.revenue ?? 0
  const previous = series[series.length - 2]?.revenue ?? 0
  return { current, previous }
}

export function totalCustomerRevenue(customerId: string, transactions: Transaction[]): number {
  return sumAmount(transactions.filter((txn) => txn.customerId === customerId))
}

export type Insight = {
  title: string
  detail: string
}

export function buildInsights(
  customers: Customer[],
  transactions: Transaction[],
  allCustomers: Customer[],
): Insight[] {
  const insights: Insight[] = []
  const planRevenue = revenueByPlan(transactions)
  const topPlan = [...planRevenue].sort((a, b) => b.revenue - a.revenue)[0]
  const total = sumAmount(transactions)

  if (topPlan && topPlan.revenue > 0 && total > 0) {
    const share = (topPlan.revenue / total) * 100
    insights.push({
      title: `${topPlan.plan} leads revenue`,
      detail: `${topPlan.plan} accounts for ${share.toFixed(0)}% of recognized revenue in the selected period.`,
    })
  }

  const series = revenueByMonth(transactions)
  const { current, previous } = lastTwoMonthTotals(series)
  if (series.length >= 2) {
    const rate = growthRate(current, previous)
    insights.push({
      title: rate >= 0 ? 'Revenue increased versus last month' : 'Revenue declined versus last month',
      detail: `Latest month is ${formatAbs(rate)} ${rate >= 0 ? 'above' : 'below'} the prior month (${formatMoney(previous)} → ${formatMoney(current)}).`,
    })
  }

  const cutoff = addMonths(startOfMonth(new Date()), -3)
  const recent = allCustomers.filter((c) => {
    const join = parseIsoDate(c.joinDate)
    return join ? join.getTime() >= cutoff.getTime() : false
  })
  if (recent.length > 0) {
    const byPlan = customersByPlan(recent)
    const leader = [...byPlan].sort((a, b) => b.count - a.count)[0]
    if (leader && leader.count > 0) {
      insights.push({
        title: `${leader.plan} has the strongest recent customer growth`,
        detail: `${leader.count} of ${recent.length} customers who joined in the last 90 days selected ${leader.plan}.`,
      })
    }
  }

  const contributing = customers
    .map((c) => ({
      customer: c,
      revenue: totalCustomerRevenue(c.id, transactions),
    }))
    .filter((row) => row.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)

  if (contributing.length >= 5 && total > 0) {
    const topCount = Math.max(1, Math.round(contributing.length * 0.2))
    const topShare = contributing.slice(0, topCount).reduce((s, r) => s + r.revenue, 0)
    const pct = (topShare / total) * 100
    insights.push({
      title: 'Revenue is concentrated in a small customer group',
      detail: `The top ${topCount} customers (${Math.round((topCount / contributing.length) * 100)}%) generate ${pct.toFixed(0)}% of period revenue.`,
    })
  }

  const trials = customers.filter((c) => c.status === 'Trial').length
  if (trials > 0) {
    insights.push({
      title: 'Trial accounts represent conversion opportunity',
      detail: `${trials} customer${trials === 1 ? ' is' : 's are'} on a trial plan. Converting them would increase recurring revenue.`,
    })
  }

  const atRisk = customers.filter((c) => c.status === 'Inactive' || c.status === 'Cancelled').length
  if (atRisk > 0) {
    insights.push({
      title: 'Inactive and cancelled accounts reduce recurring revenue',
      detail: `${atRisk} customers are inactive or cancelled in the current filter set.`,
    })
  }

  return insights.slice(0, 5)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAbs(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`
}
