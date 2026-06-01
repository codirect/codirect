import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App'
import CompanionPopup from './components/CompanionPopup/CompanionPopup'
import NewProject from './pages/NewProject'
import Projects from './pages/Projects'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Landing page</h1>} />
        <Route path="/app" element={<App />} />
        <Route path="/companion" element={<CompanionPopup />} />
        <Route path="/new-project" element={<NewProject />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
