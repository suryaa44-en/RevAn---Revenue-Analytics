export const PLANS = ['Basic', 'Standard', 'Premium', 'Enterprise'] as const
export type Plan = (typeof PLANS)[number]

export const STATUSES = ['Active', 'Inactive', 'Trial', 'Cancelled'] as const
export type CustomerStatus = (typeof STATUSES)[number]

export type Customer = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  plan: Plan
  monthlyRevenue: number
  status: CustomerStatus
  joinDate: string
}

export type CustomerInput = Omit<Customer, 'id'>

export type Transaction = {
  id: string
  customerId: string
  date: string
  amount: number
  plan: Plan
}

export type SortKey = 'name' | 'monthlyRevenue' | 'joinDate'
export type SortDir = 'asc' | 'desc'

export type DateRangeKey = '6m' | '12m' | 'ytd' | 'all'
