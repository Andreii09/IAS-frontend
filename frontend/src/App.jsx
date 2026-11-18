import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import Spinner from './components/Spinner.jsx'
import { landingPathFor } from './lib/format.js'

import Feed from './pages/Feed.jsx'
import Article from './pages/Article.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Forgot from './pages/Forgot.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import Manage from './pages/Manage.jsx'
import StoryForm from './pages/StoryForm.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Users from './pages/admin/Users.jsx'
import Tokens from './pages/admin/Tokens.jsx'
import AuditLog from './pages/admin/AuditLog.jsx'
import AiUsage from './pages/admin/AiUsage.jsx'
import Security from './pages/admin/Security.jsx'
import Content from './pages/admin/Content.jsx'
import NotFound from './pages/NotFound.jsx'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner label="Checking your session…" />
    </div>
  )
}

/** Sign-in screens stay guest-only; authenticated visitors go to their role home. */
function GuestOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={landingPathFor(user)} replace />
  return children
}

/** Every internal route lives behind ProtectedRoute, so "/" is never a public dashboard. */
function AppShell() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  )
}

/** Root resolves to the right dashboard for the signed-in role. */
function RoleHome() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />

  const target = landingPathFor(user)
  // The reader dashboard is the feed at "/", so render it directly to avoid a loop.
  return target === '/' ? <Feed /> : <Navigate to={target} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Authentication screens: first stop for every new visit. */}
      <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="forgot-password" element={<GuestOnly><Forgot /></GuestOnly>} />
      <Route path="reset-password/:token" element={<GuestOnly><ResetPassword /></GuestOnly>} />

      {/* Protected application: no dashboard or internal page renders before login. */}
      <Route element={<AppShell />}>
        <Route index element={<RoleHome />} />
        <Route path="news/:id" element={<Article />} />

        <Route
          path="change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage"
          element={
            <ProtectedRoute roles={['editor', 'admin']}>
              <Manage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/new"
          element={
            <ProtectedRoute roles={['editor', 'admin']}>
              <StoryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/:id/edit"
          element={
            <ProtectedRoute roles={['editor', 'admin']}>
              <StoryForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/tokens"
          element={
            <ProtectedRoute roles={['admin']}>
              <Tokens />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/ai"
          element={
            <ProtectedRoute roles={['admin']}>
              <AiUsage />
            </ProtectedRoute>
          }
        />
        {/* Additional admin screens required by the product spec. */}
        <Route
          path="admin/security"
          element={
            <ProtectedRoute roles={['admin']}>
              <Security />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/content"
          element={
            <ProtectedRoute roles={['admin']}>
              <Content />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
