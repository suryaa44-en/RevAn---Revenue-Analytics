import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SAMPLE_CUSTOMERS } from '../data/sampleCustomers'
import {
  generateAllTransactions,
  replaceCustomerTransactions,
} from '../data/transactions'
import type { Customer, CustomerInput, Transaction } from '../types'

const STORAGE_KEY = 'revan-crm-v1'

type PersistedState = {
  customers: Customer[]
  transactions: Transaction[]
}

type DataContextValue = {
  customers: Customer[]
  transactions: Transaction[]
  loading: boolean
  addCustomer: (input: CustomerInput) => Customer
  updateCustomer: (id: string, input: CustomerInput) => void
  deactivateCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
}

const DataContext = createContext<DataContextValue | null>(null)

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        customers: SAMPLE_CUSTOMERS,
        transactions: generateAllTransactions(SAMPLE_CUSTOMERS),
      }
    }
    const parsed = JSON.parse(raw) as PersistedState
    if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions)) {
      throw new Error('Invalid store')
    }
    return parsed
  } catch {
    return {
      customers: SAMPLE_CUSTOMERS,
      transactions: generateAllTransactions(SAMPLE_CUSTOMERS),
    }
  }
}

function persist(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const state = loadState()
      setCustomers(state.customers)
      setTransactions(state.transactions)
      setLoading(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    persist({ customers, transactions })
  }, [customers, transactions, loading])

  const addCustomer = useCallback((input: CustomerInput) => {
    const customer: Customer = { ...input, id: crypto.randomUUID() }
    setCustomers((prev) => [customer, ...prev])
    setTransactions((prev) => replaceCustomerTransactions(prev, customer))
    return customer
  }, [])

  const updateCustomer = useCallback((id: string, input: CustomerInput) => {
    setCustomers((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...input, id } : c))
      const updated = next.find((c) => c.id === id)
      if (updated) {
        setTransactions((txns) => replaceCustomerTransactions(txns, updated))
      }
      return next
    })
  }, [])

  const deactivateCustomer = useCallback((id: string) => {
    setCustomers((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, status: 'Inactive' as const } : c,
      )
      const updated = next.find((c) => c.id === id)
      if (updated) {
        setTransactions((txns) => replaceCustomerTransactions(txns, updated))
      }
      return next
    })
  }, [])

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  )

  const value = useMemo(
    () => ({
      customers,
      transactions,
      loading,
      addCustomer,
      updateCustomer,
      deactivateCustomer,
      getCustomer,
    }),
    [customers, transactions, loading, addCustomer, updateCustomer, deactivateCustomer, getCustomer],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
