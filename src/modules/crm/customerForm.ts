import type { Customer, CustomerInput, CustomerStatus, Plan } from '../../types'
import { PLANS, STATUSES } from '../../types'

export type FormErrors = Partial<Record<keyof CustomerInput, string>>

export const EMPTY_FORM: CustomerInput = {
  name: '',
  company: '',
  email: '',
  phone: '',
  plan: 'Standard',
  monthlyRevenue: 0,
  status: 'Active',
  joinDate: new Date().toISOString().slice(0, 10),
}

export function fromCustomer(customer: Customer): CustomerInput {
  return {
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone,
    plan: customer.plan,
    monthlyRevenue: customer.monthlyRevenue,
    status: customer.status,
    joinDate: customer.joinDate,
  }
}

export function validateCustomer(form: CustomerInput): FormErrors {
  const errors: FormErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Enter the customer name.'
  if (form.company.trim().length < 2) errors.company = 'Enter the company name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (form.phone.trim().length < 7) errors.phone = 'Enter a phone number.'
  if (!PLANS.includes(form.plan as Plan)) errors.plan = 'Select a subscription plan.'
  if (!Number.isFinite(form.monthlyRevenue) || form.monthlyRevenue < 0) {
    errors.monthlyRevenue = 'Enter a monthly revenue of 0 or more.'
  }
  if (!STATUSES.includes(form.status as CustomerStatus)) errors.status = 'Select a status.'
  if (!form.joinDate) errors.joinDate = 'Select a join date.'
  else if (form.joinDate > new Date().toISOString().slice(0, 10)) {
    errors.joinDate = 'Join date cannot be in the future.'
  }
  return errors
}

export function normalize(form: CustomerInput): CustomerInput {
  return {
    ...form,
    name: form.name.trim(),
    company: form.company.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    monthlyRevenue: Number(form.monthlyRevenue),
  }
}
