import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App'
import CompanionPopup from './components/CompanionPopup/CompanionPopup'
import NewProject from './pages/NewProject'
import Projects from './pages/Projects'
import Landing from './pages/Landing/Landing'
import TermsOfUsePage from './pages/TOSPages/TermsOfUsePage'
import PrivacyPolicyPage from './pages/TOSPages/PrivacyPolicyPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<App />} />
        <Route path="/companion" element={<CompanionPopup />} />
        <Route path="/new-project" element={<NewProject />} />
        <Route path="/projects" element={<Projects />} />

        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-use" element={<TermsOfUsePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
