/**
 * AuthContext — глобальное состояние аутентификации.
 * Поддерживает одновременный вход под разными ролями в разных вкладках.
 * Роль определяется из URL-пути (/admin, /teacher, /student) и хранится в sessionStorage (уникально для вкладки).
 * Токены хранятся в localStorage с префиксом роли (token_admin, token_teacher, token_student).
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { parseJwt } from '../api.js'

const AuthContext = createContext(null)

const getStorageKey = (role) => `token_${role}`

// Определяем роль из текущего URL-пути
function getRoleFromPath() {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/teacher')) return 'teacher'
  if (path.startsWith('/student')) return 'student'
  return null
}

export function AuthProvider({ children }) {
  // sessionStorage — уникален для каждой вкладки
  const [role, setRole] = useState(() => {
    return sessionStorage.getItem('tab_role') || getRoleFromPath()
  })

  const [token, setToken] = useState(() => {
    const r = sessionStorage.getItem('tab_role') || getRoleFromPath()
    return r ? localStorage.getItem(getStorageKey(r)) : null
  })

  // Декодированные данные из токена
  const payload = useMemo(() => token ? parseJwt(token) : null, [token])
  const username = payload?.sub || null
  const userId = payload?.user_id || null
  const isAuthenticated = Boolean(token && payload)

  // Синхронизация при смене URL (SPA-роутинг)
  useEffect(() => {
    const handleLocationChange = () => {
      const pathRole = getRoleFromPath()
      const storedRole = sessionStorage.getItem('tab_role')
      // Если роль из URL отличается от текущей и для неё есть токен
      if (pathRole && pathRole !== storedRole) {
        const pathToken = localStorage.getItem(getStorageKey(pathRole))
        if (pathToken) {
          sessionStorage.setItem('tab_role', pathRole)
          setRole(pathRole)
          setToken(pathToken)
        }
      }
    }

    // Слушаем изменения URL
    window.addEventListener('popstate', handleLocationChange)
    // Также проверяем при монтировании
    handleLocationChange()

    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // Функция входа
  const login = useCallback((newToken, userRole) => {
    localStorage.setItem(getStorageKey(userRole), newToken)
    sessionStorage.setItem('tab_role', userRole)
    setRole(userRole)
    setToken(newToken)
  }, [])

  // Выход из текущей роли
  const logout = useCallback(() => {
    const currentRole = sessionStorage.getItem('tab_role')
    if (currentRole) {
      localStorage.removeItem(getStorageKey(currentRole))
    }
    localStorage.removeItem('token') // legacy
    sessionStorage.removeItem('tab_role')
    setRole(null)
    setToken(null)
  }, [])

  // Выход из всех ролей
  const logoutAll = useCallback(() => {
    localStorage.removeItem(getStorageKey('admin'))
    localStorage.removeItem(getStorageKey('teacher'))
    localStorage.removeItem(getStorageKey('student'))
    localStorage.removeItem('token') // legacy
    sessionStorage.removeItem('tab_role')
    setRole(null)
    setToken(null)
  }, [])

  // Переключение на другую роль (если для неё есть токен)
  const switchRole = useCallback((targetRole) => {
    const targetToken = localStorage.getItem(getStorageKey(targetRole))
    if (!targetToken) return false
    const targetPayload = parseJwt(targetToken)
    if (!targetPayload) return false
    sessionStorage.setItem('tab_role', targetRole)
    setRole(targetRole)
    setToken(targetToken)
    return true
  }, [])

  // Проверка, есть ли токен для роли
  const hasRole = useCallback((checkRole) => {
    return Boolean(localStorage.getItem(getStorageKey(checkRole)))
  }, [])

  // Получить список всех активных сессий
  const getActiveSessions = useCallback(() => {
    const sessions = []
    for (const r of ['admin', 'teacher', 'student']) {
      const t = localStorage.getItem(getStorageKey(r))
      if (t) {
        const p = parseJwt(t)
        if (p) sessions.push({ role: r, username: p.sub })
      }
    }
    return sessions
  }, [])

  const value = useMemo(() => ({
    token,
    role,
    username,
    userId,
    isAuthenticated,
    login,
    logout,
    logoutAll,
    switchRole,
    hasRole,
    getActiveSessions,
  }), [token, role, username, userId, isAuthenticated, login, logout, logoutAll, switchRole, hasRole, getActiveSessions])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export default AuthContext
