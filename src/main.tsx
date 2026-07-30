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

for (const href of ['/Britannia.poster.jpg', '/stack_bg.poster.jpg']) {
  const posterPreload = document.createElement('link')
  posterPreload.rel = 'preload'
  posterPreload.as = 'image'
  posterPreload.href = href
  document.head.appendChild(posterPreload)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
