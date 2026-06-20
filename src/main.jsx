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
