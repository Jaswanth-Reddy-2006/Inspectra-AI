import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
<<<<<<< HEAD
=======
import { UrlProvider } from './context/UrlContext'
>>>>>>> localcode
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
<<<<<<< HEAD
            <BrowserRouter>
                <App />
            </BrowserRouter>
=======
            <UrlProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </UrlProvider>
>>>>>>> localcode
        </ToastProvider>
    </React.StrictMode>,
)
