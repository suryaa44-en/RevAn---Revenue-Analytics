import type { ReactNode } from 'react'

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string
  copy?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {copy ? <p>{copy}</p> : null}
      {action}
    </div>
  )
}
