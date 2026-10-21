import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import queryClient from './queryClient'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <App />
          </GoogleOAuthProvider>
        ) : (
          <App />
        )}
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
