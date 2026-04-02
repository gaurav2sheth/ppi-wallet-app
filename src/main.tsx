import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './store/auth.store'
import { usePinStore } from './store/pin.store'
import { useBudgetStore } from './store/budget.store'
import { usePayeesStore } from './store/payees.store'

// Hydrate stores from storage on boot
useAuthStore.getState().hydrate();
usePinStore.getState().hydrate();
useBudgetStore.getState().hydrate();
usePayeesStore.getState().hydrate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
