import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/testSupabase' // Import test utility
import './utils/checkStorage' // Import storage check utility
import './utils/testObjectCreation' // Import object creation test utility

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
