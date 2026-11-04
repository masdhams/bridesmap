import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DEMO } from './lib/demo'
import { bootDemo } from './lib/demoBoot'
import { startPlanSync } from './lib/planSync'
import './index.css'

// Mode demo memuat salinan rencana contoh dan tidak menyinkronkan apa pun ke server.
if (DEMO) bootDemo()
else startPlanSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}
