import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { SplashScreen } from './pages/cleaner/SplashScreen'
import { LanguageSelect } from './pages/cleaner/LanguageSelect'
import { Login } from './pages/cleaner/Login'
import { Home } from './pages/cleaner/Home'
import { ZoneList } from './pages/cleaner/ZoneList'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/language" element={<LanguageSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cleaner/home" element={<Home />} />
          <Route path="/cleaner/job/:jobId" element={<ZoneList />} />
          <Route path="/cleaner/job/:jobId/zone/:zoneId" element={<Placeholder label="Zone Submission" />} />
          <Route path="/cleaner/job/:jobId/zone/:zoneId/note" element={<Placeholder label="No Photo Note" />} />
          <Route path="/cleaner/job/:jobId/complete" element={<Placeholder label="Shift Completed" />} />
          <Route path="/cleaner/history" element={<Placeholder label="Shift History" />} />
          {/* Supervisor + Manager — not yet built */}
          <Route path="/supervisor/*" element={<Placeholder label="Supervisor — not built yet" />} />
          <Route path="/manager/*" element={<Placeholder label="Manager — not built yet" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-ivory">
      <p className="text-charcoal font-heading text-lg">{label} — coming soon</p>
    </div>
  )
}
