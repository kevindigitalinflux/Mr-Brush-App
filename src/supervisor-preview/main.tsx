import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import SupervisorPreviewApp from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupervisorPreviewApp />
  </StrictMode>,
)
