import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MockAppProvider } from './MockAppProvider'
import { PreviewShell } from './PreviewShell'
import { Dashboard } from '../pages/supervisor/Dashboard'
import { Jobs } from '../pages/supervisor/Jobs'
import { Workers } from '../pages/supervisor/Workers'
import { History } from '../pages/supervisor/History'
import { Evidence } from '../pages/supervisor/Evidence'
import { SupervisorNotifications } from '../pages/supervisor/SupervisorNotifications'
import { Issues } from '../pages/supervisor/Issues'

/** Standalone supervisor preview — mock data, no Supabase connection. */
export default function SupervisorPreviewApp() {
  return (
    <MockAppProvider>
      <HashRouter>
        <PreviewShell>
          <Routes>
            <Route path="/" element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="/supervisor/dashboard"       element={<Dashboard />} />
            <Route path="/supervisor/jobs"            element={<Jobs />} />
            <Route path="/supervisor/workers"         element={<Workers />} />
            <Route path="/supervisor/history"         element={<History />} />
            <Route path="/supervisor/evidence"              element={<Evidence />} />
            <Route path="/supervisor/evidence/:jobId"      element={<Evidence />} />
            <Route path="/supervisor/notifications"        element={<SupervisorNotifications />} />
            <Route path="/supervisor/issues"               element={<Issues />} />
            <Route path="*" element={<Navigate to="/supervisor/dashboard" replace />} />
          </Routes>
        </PreviewShell>
      </HashRouter>
    </MockAppProvider>
  )
}
