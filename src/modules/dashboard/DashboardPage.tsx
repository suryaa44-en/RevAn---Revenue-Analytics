import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard, KpiSkeletonRow } from '../../components/KpiCard'
import { useData } from '../../store/DataContext'
import { monthlyRecurringRevenue, sumAmount } from '../../utils/analytics'
import { formatCurrency } from '../../utils/format'

export function DashboardPage() {
  const { customers, transactions, loading } = useData()

  const stats = useMemo(() => {
    const active = customers.filter((c) => c.status === 'Active').length
    return {
      customers: customers.length,
      active,
      mrr: monthlyRecurringRevenue(customers),
      revenue: sumAmount(transactions),
    }
  }, [customers, transactions])

  if (loading) return <KpiSkeletonRow />

  return (
    <>
      <section className="kpi-grid">
        <KpiCard label="Total customers" value={String(stats.customers)} />
        <KpiCard label="Active customers" value={String(stats.active)} />
        <KpiCard label="Monthly recurring revenue" value={formatCurrency(stats.mrr)} />
        <KpiCard label="Recognized revenue" value={formatCurrency(stats.revenue)} hint="All billed periods" />
      </section>
      <section className="overview-links">
        <Link to="/customers" className="card link-card">
          <h3>Customers</h3>
          <p>Search, filter, add, and update customer accounts.</p>
        </Link>
        <Link to="/analytics" className="card link-card">
          <h3>Revenue Analytics</h3>
          <p>Review trends, plan mix, top accounts, and business insights.</p>
        </Link>
      </section>
    </>
  )
}
