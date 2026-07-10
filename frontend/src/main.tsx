import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary'
import { ToastProvider } from '@/components/ui/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // dados considerados frescos por 5 min
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
