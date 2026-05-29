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
import { Dashboard } from './pages/supervisor/Dashboard'
import { Jobs } from './pages/supervisor/Jobs'
import { Workers } from './pages/supervisor/Workers'
import { History } from './pages/supervisor/History'
import { Evidence } from './pages/supervisor/Evidence'
import { SupervisorNotifications } from './pages/supervisor/SupervisorNotifications'
import { Issues } from './pages/supervisor/Issues'
import { CleanerProfile } from './pages/supervisor/CleanerProfile'
import { Rates } from './pages/supervisor/Rates'
import { Overview } from './pages/client/Overview'
import { EvidenceFeed } from './pages/client/EvidenceFeed'
import { Complaints } from './pages/client/Complaints'
import { ClientHistory } from './pages/client/ClientHistory'
import { ClientNotifications } from './pages/client/ClientNotifications'

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
          {/* Supervisor */}
          <Route path="/supervisor/dashboard" element={<Dashboard />} />
          <Route path="/supervisor/jobs" element={<Jobs />} />
          <Route path="/supervisor/workers" element={<Workers />} />
          <Route path="/supervisor/history" element={<History />} />
          <Route path="/supervisor/evidence" element={<Evidence />} />
          <Route path="/supervisor/evidence/:jobId" element={<Evidence />} />
          <Route path="/supervisor/notifications" element={<SupervisorNotifications />} />
          <Route path="/supervisor/issues" element={<Issues />} />
          <Route path="/supervisor/workers/:cleanerId" element={<CleanerProfile />} />
          <Route path="/supervisor/rates" element={<Rates />} />
          {/* Client */}
          <Route path="/client/overview"       element={<Overview />}             />
          <Route path="/client/evidence"       element={<EvidenceFeed />}         />
          <Route path="/client/complaints"     element={<Complaints />}           />
          <Route path="/client/history"        element={<ClientHistory />}        />
          <Route path="/client/notifications"  element={<ClientNotifications />}  />
          <Route path="/client/home"           element={<Overview />}             />
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
