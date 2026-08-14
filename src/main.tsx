import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './styles.css'
import './workflows.css'
import './acceptance.css'
import './careplan.css'
import './communications.css'
import './doctor.css'
import './humanreview.css'
import './accessibility.css'
import './a11y-fixes.css'
import './dialog-a11y.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /><Toaster position="bottom-right" richColors /></BrowserRouter></React.StrictMode>,
)
