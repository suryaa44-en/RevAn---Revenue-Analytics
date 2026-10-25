import type { CustomerStatus, Plan } from '../types'

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return <span className="badge badge-plan">{plan}</span>
}
