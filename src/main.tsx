import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'

const Root = lazy(() => import('./v2/App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
