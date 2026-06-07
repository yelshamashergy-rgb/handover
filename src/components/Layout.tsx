import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { BottomNav } from './BottomNav'
import { Modal } from './Modal'
import { PropertyForm } from './PropertyForm'
import { UpgradeModal } from './UpgradeModal'

const AddCtx = createContext<() => void>(() => {})
// eslint-disable-next-line react-refresh/only-export-components
export const useAddProperty = () => useContext(AddCtx)

export function Layout({ children }: { children: ReactNode }) {
  const { canAddProperty, addProperty } = useStore()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const requestAdd = useCallback(() => {
    if (canAddProperty) setAddOpen(true)
    else setUpgradeOpen(true)
  }, [canAddProperty])

  return (
    <AddCtx.Provider value={requestAdd}>
      <div className="grain relative mx-auto min-h-dvh max-w-[480px] border-x border-line">
        <main className="relative z-10 px-4 pb-32 pt-5">{children}</main>
        <BottomNav onAdd={requestAdd} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New property" size="lg">
        <PropertyForm
          mode="new"
          onCancel={() => setAddOpen(false)}
          onSubmitNew={(data) => {
            const id = addProperty(data)
            setAddOpen(false)
            navigate(`/property/${id}`)
          }}
        />
      </Modal>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </AddCtx.Provider>
  )
}
