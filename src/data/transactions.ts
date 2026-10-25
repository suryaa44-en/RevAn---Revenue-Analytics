import type { Customer, Transaction } from '../types'
import { addMonths, parseIsoDate, startOfMonth, toIsoDate } from '../utils/format'

function billingEnd(customer: Customer, today: Date): Date {
  const join = parseIsoDate(customer.joinDate) ?? today
  if (customer.status === 'Active' || customer.status === 'Trial') {
    return startOfMonth(today)
  }
  const monthsActive = customer.status === 'Cancelled' ? 8 : 10
  const candidate = addMonths(startOfMonth(join), monthsActive)
  const lastPossible = addMonths(startOfMonth(today), -1)
  return candidate.getTime() < lastPossible.getTime() ? candidate : lastPossible
}

export function generateTransactionsForCustomer(
  customer: Customer,
  today = new Date(),
): Transaction[] {
  const join = parseIsoDate(customer.joinDate)
  if (!join) return []

  const records: Transaction[] = []
  let cursor = startOfMonth(join)
  const end = billingEnd(customer, today)
  let index = 0

  while (cursor.getTime() <= end.getTime()) {
    const amount =
      customer.status === 'Trial' ? Math.round(customer.monthlyRevenue * 0.35) : customer.monthlyRevenue

    records.push({
      id: `txn_${customer.id}_${toIsoDate(cursor)}`,
      customerId: customer.id,
      date: toIsoDate(cursor),
      amount,
      plan: customer.plan,
    })

    cursor = addMonths(cursor, 1)
    index += 1
    if (index > 48) break
  }

  return records
}

export function generateAllTransactions(customers: Customer[]): Transaction[] {
  return customers.flatMap((customer) => generateTransactionsForCustomer(customer))
}

export function replaceCustomerTransactions(
  transactions: Transaction[],
  customer: Customer,
): Transaction[] {
  const remaining = transactions.filter((txn) => txn.customerId !== customer.id)
  return [...remaining, ...generateTransactionsForCustomer(customer)]
}
