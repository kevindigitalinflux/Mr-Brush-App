import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MockAppProvider } from './MockAppProvider'
import { Dashboard } from '../pages/supervisor/Dashboard'
import { Jobs } from '../pages/supervisor/Jobs'
import { Workers } from '../pages/supervisor/Workers'
import { History } from '../pages/supervisor/History'
import { Evidence } from '../pages/supervisor/Evidence'

/** Standalone supervisor preview — mock data, no Supabase connection. */
export default function SupervisorPreviewApp() {
  return (
    <MockAppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/supervisor/dashboard" replace />} />
          <Route path="/supervisor/dashboard"       element={<Dashboard />} />
          <Route path="/supervisor/jobs"            element={<Jobs />} />
          <Route path="/supervisor/workers"         element={<Workers />} />
          <Route path="/supervisor/history"         element={<History />} />
          <Route path="/supervisor/evidence"        element={<Evidence />} />
          <Route path="/supervisor/evidence/:jobId" element={<Evidence />} />
          <Route path="*" element={<Navigate to="/supervisor/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </MockAppProvider>
  )
}
