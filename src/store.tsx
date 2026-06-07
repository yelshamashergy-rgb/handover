import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Payment, Property, PropertyDocument, Reconciliation } from './lib/types'
import { repo } from './lib/storage'
import { uid } from './lib/payments'
import { sampleProperty } from './lib/sample'

export const FREE_LIMIT = 1

interface Store {
  properties: Property[]
  pro: boolean
  theme: 'light' | 'dark'
  canAddProperty: boolean
  getProperty: (id: string) => Property | undefined
  addProperty: (p: Omit<Property, 'id' | 'createdAt'>) => string
  updateProperty: (id: string, patch: Partial<Property>) => void
  deleteProperty: (id: string) => void
  togglePaid: (propertyId: string, paymentId: string) => void
  addPayment: (propertyId: string, payment: Omit<Payment, 'id'>) => void
  updatePayment: (propertyId: string, paymentId: string, patch: Partial<Payment>) => void
  deletePayment: (propertyId: string, paymentId: string) => void
  addDocument: (propertyId: string, doc: Omit<PropertyDocument, 'id' | 'addedAt'>) => void
  updateDocument: (propertyId: string, docId: string, patch: Partial<PropertyDocument>) => void
  deleteDocument: (propertyId: string, docId: string) => void
  setReconciliation: (propertyId: string, patch: Partial<Reconciliation>) => void
  unlockPro: () => void
  toggleTheme: () => void
  loadSample: () => string
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => repo.load().properties)
  const [pro, setPro] = useState<boolean>(() => repo.isPro())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => repo.getTheme())

  // Persist data whenever it changes.
  useEffect(() => {
    repo.save({ version: 1, properties })
  }, [properties])

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    repo.setTheme(theme)
  }, [theme])

  const getProperty = useCallback(
    (id: string) => properties.find((p) => p.id === id),
    [properties],
  )

  const addProperty = useCallback((p: Omit<Property, 'id' | 'createdAt'>) => {
    const id = uid()
    const full: Property = { ...p, id, createdAt: new Date().toISOString() }
    setProperties((prev) => [...prev, full])
    return id
  }, [])

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const deleteProperty = useCallback((id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const togglePaid = useCallback((propertyId: string, paymentId: string) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propertyId) return p
        return {
          ...p,
          payments: p.payments.map((pay) =>
            pay.id === paymentId
              ? {
                  ...pay,
                  paid: !pay.paid,
                  paidDate: !pay.paid ? new Date().toISOString().slice(0, 10) : undefined,
                }
              : pay,
          ),
        }
      }),
    )
  }, [])

  const addPayment = useCallback((propertyId: string, payment: Omit<Payment, 'id'>) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, payments: [...p.payments, { ...payment, id: uid() }] }
          : p,
      ),
    )
  }, [])

  const updatePayment = useCallback(
    (propertyId: string, paymentId: string, patch: Partial<Payment>) => {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? {
                ...p,
                payments: p.payments.map((pay) =>
                  pay.id === paymentId ? { ...pay, ...patch } : pay,
                ),
              }
            : p,
        ),
      )
    },
    [],
  )

  const deletePayment = useCallback((propertyId: string, paymentId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, payments: p.payments.filter((pay) => pay.id !== paymentId) }
          : p,
      ),
    )
  }, [])

  const addDocument = useCallback(
    (propertyId: string, doc: Omit<PropertyDocument, 'id' | 'addedAt'>) => {
      const full: PropertyDocument = { ...doc, id: uid(), addedAt: new Date().toISOString() }
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, documents: [...(p.documents || []), full] } : p,
        ),
      )
    },
    [],
  )

  const updateDocument = useCallback(
    (propertyId: string, docId: string, patch: Partial<PropertyDocument>) => {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, documents: (p.documents || []).map((d) => (d.id === docId ? { ...d, ...patch } : d)) }
            : p,
        ),
      )
    },
    [],
  )

  const deleteDocument = useCallback((propertyId: string, docId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, documents: (p.documents || []).filter((d) => d.id !== docId) }
          : p,
      ),
    )
  }, [])

  const setReconciliation = useCallback((propertyId: string, patch: Partial<Reconciliation>) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, reconciliation: { ...p.reconciliation, ...patch } } : p,
      ),
    )
  }, [])

  const unlockPro = useCallback(() => {
    repo.setPro(true)
    setPro(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const loadSample = useCallback(() => {
    const p = sampleProperty()
    setProperties((prev) => [...prev, p])
    return p.id
  }, [])

  const value = useMemo<Store>(
    () => ({
      properties,
      pro,
      theme,
      canAddProperty: pro || properties.length < FREE_LIMIT,
      getProperty,
      addProperty,
      updateProperty,
      deleteProperty,
      togglePaid,
      addPayment,
      updatePayment,
      deletePayment,
      addDocument,
      updateDocument,
      deleteDocument,
      setReconciliation,
      unlockPro,
      toggleTheme,
      loadSample,
    }),
    [
      properties,
      pro,
      theme,
      getProperty,
      addProperty,
      updateProperty,
      deleteProperty,
      togglePaid,
      addPayment,
      updatePayment,
      deletePayment,
      addDocument,
      updateDocument,
      deleteDocument,
      setReconciliation,
      unlockPro,
      toggleTheme,
      loadSample,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
