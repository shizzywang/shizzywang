import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import shieldFilledUrl from './assets/heraldic/heraldic-shield-filled.svg'
import './styles/global.css'
import App from './App.tsx'

const crestPreload = document.createElement('link')
crestPreload.rel = 'preload'
crestPreload.as = 'image'
crestPreload.href = shieldFilledUrl
document.head.appendChild(crestPreload)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
