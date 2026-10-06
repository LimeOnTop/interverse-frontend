import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position={window.matchMedia('(max-width: 639px)').matches ? 'top-center' : 'top-right'}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--iv-surface)',
                        color: 'var(--iv-text)',
                        border: '1px solid var(--iv-border)',
                        borderRadius: '0',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>,
)
