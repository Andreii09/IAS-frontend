import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'

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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="news/:id" element={<Article />} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<Forgot />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
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
