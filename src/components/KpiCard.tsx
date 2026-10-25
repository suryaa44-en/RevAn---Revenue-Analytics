export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <article className="card kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {hint ? <p className="kpi-hint">{hint}</p> : null}
    </article>
  )
}

export function KpiSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  )
}
