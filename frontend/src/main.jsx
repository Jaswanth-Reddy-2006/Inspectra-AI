import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { ScanProvider } from './context/ScanContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <ScanProvider>
                    <App />
                </ScanProvider>
            </ToastProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
