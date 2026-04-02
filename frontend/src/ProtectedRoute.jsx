import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import { useAuth } from './context/AuthContext'

function Layout({ children }) {
  return (
    <div>
      <Header />
      <main className="page-content">{children}</main>
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation()
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated || (allowedRoles.length && !allowedRoles.includes(role))) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Layout>{children}</Layout>
}
