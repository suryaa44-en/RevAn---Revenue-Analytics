import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { PLANS, STATUSES, type Customer, type CustomerInput } from '../../types'
import { EMPTY_FORM, fromCustomer, normalize, validateCustomer, type FormErrors } from './customerForm'

export function CustomerFormModal({
  customer,
  onClose,
  onSubmit,
}: {
  customer?: Customer | null
  onClose: () => void
  onSubmit: (input: CustomerInput) => void
}) {
  const [form, setForm] = useState<CustomerInput>(customer ? fromCustomer(customer) : EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = normalize(form)
    const nextErrors = validateCustomer(next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(next)
  }

  return (
    <Modal title={customer ? 'Edit customer' : 'Add customer'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Customer name</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoComplete="name"
            />
            {errors.name ? <span className="error">{errors.name}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              className="input"
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
            />
            {errors.company ? <span className="error">{errors.company}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
            />
            {errors.email ? <span className="error">{errors.email}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              autoComplete="tel"
            />
            {errors.phone ? <span className="error">{errors.phone}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="plan">Subscription plan</label>
            <select
              id="plan"
              className="select"
              value={form.plan}
              onChange={(e) => update('plan', e.target.value as CustomerInput['plan'])}
            >
              {PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
            {errors.plan ? <span className="error">{errors.plan}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="monthlyRevenue">Monthly revenue</label>
            <input
              id="monthlyRevenue"
              className="input"
              type="number"
              min={0}
              step="1"
              value={form.monthlyRevenue}
              onChange={(e) => update('monthlyRevenue', Number(e.target.value))}
            />
            {errors.monthlyRevenue ? <span className="error">{errors.monthlyRevenue}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="select"
              value={form.status}
              onChange={(e) => update('status', e.target.value as CustomerInput['status'])}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? <span className="error">{errors.status}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="joinDate">Join date</label>
            <input
              id="joinDate"
              className="input"
              type="date"
              value={form.joinDate}
              onChange={(e) => update('joinDate', e.target.value)}
            />
            {errors.joinDate ? <span className="error">{errors.joinDate}</span> : null}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {customer ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
