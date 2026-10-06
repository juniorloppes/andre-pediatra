import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'

// V2 é a versão padrão; a V0 continua acessível em ?v0 para comparação.
// Carregamento sob demanda para que o CSS de uma versão não vaze na outra.
const Root = new URLSearchParams(location.search).has('v0')
  ? lazy(() => import('./Crescer.tsx'))
  : lazy(() => import('./v2/App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
