/**
 * Страница входа в систему.
 * Современный дизайн с glassmorphism-эффектами и плавными анимациями.
 */

import React, { useState } from 'react'
import Header from '../components/Header'
import { useNavigate } from 'react-router-dom'
import { apiLogin } from '../api.js'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!username.trim()) {
      setError('Введите имя пользователя')
      return
    }
    if (!password) {
      setError('Введите пароль')
      return
    }

    setLoading(true)
     try {
       const token = await apiLogin(username.trim(), password)
       if (token) {
         // Декодируем токен чтобы получить роль
         const payload = JSON.parse(atob(token.split('.')[1]))
         login(token, payload.role)
         toast.success('Добро пожаловать!')
         // Навигация определяется по роли из токена через AuthContext
         const routes = { student: '/student', teacher: '/teacher', admin: '/admin' }
         navigate(routes[payload.role] || '/')
       }
     } catch (err) {
       setError(err?.message || 'Неверные учётные данные')
       toast.error(err?.message || 'Ошибка входа')
     } finally {
       setLoading(false)
     }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
      <Header />
      
      <div className="flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-black/20 border border-white/50 dark:border-dark-border p-8 md:p-10">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl mb-4 shadow-lg shadow-blue-500/30">
                🎓
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Добро пожаловать
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Войдите в систему учёта успеваемости
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Имя пользователя
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Введите имя пользователя"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Вход...
                  </span>
                ) : 'Войти'}
              </button>
            </form>

           {/* Footer links */}
           <div className="mt-6 flex flex-col items-center gap-3">
             <button
               type="button"
               onClick={() => navigate('/password-reset')}
               className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
             >
               Забыли пароль?
             </button>
           </div>
          </div>

          {/* Test credentials */}
          <div className="mt-6 bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-dark-border p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center mb-3 uppercase tracking-wider">
              Тестовые учётные данные
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123') }}
                className="p-2 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-center"
              >
                <div className="font-semibold text-gray-900 dark:text-white">Админ</div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">admin</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('petrov'); setPassword('teacher123') }}
                className="p-2 rounded-lg border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors text-center"
              >
                <div className="font-semibold text-gray-900 dark:text-white">Преподаватель</div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">petrov</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('smirnov'); setPassword('student123') }}
                className="p-2 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-center"
              >
                <div className="font-semibold text-gray-900 dark:text-white">Студент</div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">smirnov</div>
              </button>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            Нет аккаунта?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
