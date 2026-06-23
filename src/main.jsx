import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { NotificationProvider } from './context/NotificationContext'
import { QuickAddProvider } from './context/QuickAddContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <NotificationProvider>
                <QuickAddProvider>
                  <App />
                </QuickAddProvider>
              </NotificationProvider>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)

// Register the custom service worker (built to /sw.js by vite-plugin-pwa).
// Manual registration because the plugin uses injectRegister: false.
// Guarded + non-fatal so a failure never breaks the app.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[SW] registered:', reg.scope))
      .catch((err) => console.error('[SW] registration failed:', err))
  })
}
