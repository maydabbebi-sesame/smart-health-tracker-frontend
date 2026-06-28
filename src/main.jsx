import { StrictMode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { queryClient } from './lib/queryClient'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const app = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>,
)
