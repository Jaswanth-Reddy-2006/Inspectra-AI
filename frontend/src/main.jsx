import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { UrlProvider } from './context/UrlContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
            <UrlProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </UrlProvider>
        </ToastProvider>
    </React.StrictMode>,
)
