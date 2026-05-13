import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import { OfflineBanner } from './components/OfflineBanner'
import { SplashScreen } from './pages/cleaner/SplashScreen'
import { LanguageSelect } from './pages/cleaner/LanguageSelect'
import { Login } from './pages/cleaner/Login'
import { Home } from './pages/cleaner/Home'
import { ZoneList } from './pages/cleaner/ZoneList'
import { ZoneSubmission } from './pages/cleaner/ZoneSubmission'
import { ZoneSubmissionSuccess } from './pages/cleaner/ZoneSubmissionSuccess'
import { NoPhotoNote } from './pages/cleaner/NoPhotoNote'
import { ShiftCompleted } from './pages/cleaner/ShiftCompleted'
import { ShiftHistory } from './pages/cleaner/ShiftHistory'
import { ShiftDetail } from './pages/cleaner/ShiftDetail'
import { Notifications } from './pages/cleaner/Notifications'
import { NotificationDetail } from './pages/cleaner/NotificationDetail'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <GlobalOfflineBanner />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/language" element={<LanguageSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cleaner/home" element={<Home />} />
          <Route path="/cleaner/job/:jobId" element={<ZoneList />} />
          <Route path="/cleaner/job/:jobId/zone/:zoneId" element={<ZoneSubmission />} />
          <Route path="/cleaner/job/:jobId/zone/:zoneId/success" element={<ZoneSubmissionSuccess />} />
          <Route path="/cleaner/job/:jobId/zone/:zoneId/note" element={<NoPhotoNote />} />
          <Route path="/cleaner/job/:jobId/complete" element={<ShiftCompleted />} />
          <Route path="/cleaner/history" element={<ShiftHistory />} />
          <Route path="/cleaner/history/:shiftId" element={<ShiftDetail />} />
          <Route path="/cleaner/notifications" element={<Notifications />} />
          <Route path="/cleaner/notifications/:id" element={<NotificationDetail />} />
          {/* Supervisor + Client — not yet built */}
          <Route path="/supervisor/*" element={<Placeholder label="Supervisor Portal" />} />
          <Route path="/client/*" element={<Placeholder label="Client Portal" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

function GlobalOfflineBanner() {
  const { isOnline } = useApp()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[200]">
      <OfflineBanner />
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-ivory">
      <p className="text-charcoal font-heading text-lg">{label} — coming soon</p>
    </div>
  )
}
