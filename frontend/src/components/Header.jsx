/**
 * Навигационная шапка приложения.
 * Современный дизайн с glassmorphism-эффектом.
 */

import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, role, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.body.classList.add('theme-dark')
      document.documentElement.classList.add('dark')
      return true
    }
    return false
  })

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('theme-dark')
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('theme-dark')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }



  const isActive = (path) => location.pathname === path

  // Navigation items based on auth state
  const navItems = []
  if (!isAuthenticated) {
    navItems.push({ to: '/login', label: 'Войти', primary: false })
    navItems.push({ to: '/register', label: 'Регистрация', primary: true })
  } else {
    navItems.push({ to: '/', label: 'Главная' })
    if (role === 'student') navItems.push({ to: '/student', label: 'Мой кабинет' })
    if (role === 'teacher') navItems.push({ to: '/teacher', label: 'Мой кабинет' })
    if (role === 'admin') navItems.push({ to: '/admin', label: 'Админ' })
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-dark-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="text-2xl">🎓</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:inline">
              ASU Progress
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              item.primary ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                    isActive(item.to) && item.to !== '/'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-card'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}

              {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Выйти
              </button>
            )}

             {/* Role indicator */}
             {isAuthenticated && (
               <div className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-dark-input">
                 {role === 'admin' && '👑 Админ'}
                 {role === 'teacher' && '📚 Преподаватель'}
                 {role === 'student' && '🎓 Студент'}
               </div>
             )}
             
             {/* Theme Toggle */}
             <button
               onClick={() => setDarkMode(d => !d)}
               className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
               title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
             >
               {darkMode ? (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                 </svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                 </svg>
               )}
             </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-border">
            <nav className="flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors no-underline ${
                    item.primary
                      ? 'text-white bg-blue-600 hover:bg-blue-700 text-center'
                      : isActive(item.to)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
            {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="mt-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
                >
                  Выйти
                </button>
              )}

              {/* Theme toggle mobile */}
              <button
                onClick={() => setDarkMode(d => !d)}
                className="mt-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card text-left transition-colors"
              >
                {darkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
