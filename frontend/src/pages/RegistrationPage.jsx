/**
 * Страница регистрации.
 * Современный дизайн с валидацией и улучшенным UX.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { apiRegister, apiLogin, parseJwt } from '../api.js'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    firstName: '',
    lastName: '',
    patronymic: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Очищаем ошибку при изменении
  }

  // Клиентская валидация
  const validate = () => {
    const { username, email, password, confirmPassword, firstName, lastName } = formData

    if (username.length < 3) {
      return 'Имя пользователя должно содержать минимум 3 символа'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Имя пользователя может содержать только буквы, цифры и _'
    }
    if (!email.includes('@') || !email.includes('.')) {
      return 'Некорректный формат email'
    }
    if (password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов'
    }
    if (password !== confirmPassword) {
      return 'Пароли не совпадают'
    }
    // Валидация ФИО (если заполнены)
    if (firstName && firstName.length < 2) {
      return 'Имя должно содержать минимум 2 символа'
    }
    if (lastName && lastName.length < 2) {
      return 'Фамилия должна содержать минимум 2 символа'
    }
    if (formData.patronymic && formData.patronymic.length < 2) {
      return 'Отчество должно содержать минимум 2 символа'
    }
    return null
  }

  const translateError = (msg) => {
    const translations = {
      'уже существует': 'уже существует',
      'Username already exists': 'Пользователь с таким именем уже существует',
      'email уже существует': 'Пользователь с таким email уже существует',
    }
    for (const [eng, ru] of Object.entries(translations)) {
      if (msg.includes(eng)) return ru
    }
    return msg
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Валидация
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Регистрация
      const registerResult = await apiRegister(
        formData.username.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        formData.firstName.trim() || null,
        formData.lastName.trim() || null,
        formData.patronymic.trim() || null
      )

      if (registerResult) {
        // Автоматический вход после успешной регистрации
        try {
          const token = await apiLogin(formData.username.trim(), formData.password)
          if (token) {
            const payload = parseJwt(token)
            const userRole = payload?.role || formData.role
            login(token, userRole)
            toast.success('Регистрация прошла успешно!')
            const routes = { student: '/student', teacher: '/teacher', admin: '/admin' }
            navigate(routes[userRole] || '/')
            return
          }
        } catch (_) {
          // Если авто-вход не удался — редирект на страницу входа
          navigate('/login')
        }
      }
    } catch (err) {
      setError(translateError(err?.message) || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
      <Header />
      
      <div className="flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-black/20 border border-white/50 dark:border-dark-border p-8 md:p-10">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl mb-4 shadow-lg shadow-emerald-500/30">
                👤
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Регистрация
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Создайте учётную запись в системе
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Иванов"
                    autoComplete="family-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Иван"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Отчество
                  </label>
                  <input
                    type="text"
                    value={formData.patronymic}
                    onChange={e => updateField('patronymic', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Иванович"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Имя пользователя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => updateField('username', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Придумайте username"
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@mail.ru"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Нужен для восстановления пароля
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Пароль <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => updateField('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Подтвердите пароль <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Повторите пароль"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Роль <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={e => updateField('role', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formData.role === 'student' && 'Доступ к оценкам, посещаемости, апелляциям'}
                  {formData.role === 'teacher' && 'Выставление оценок, учёт посещаемости'}
                  {formData.role === 'admin' && 'Управление пользователями и справочниками'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Регистрация...
                  </span>
                ) : 'Зарегистрироваться'}
              </button>
            </form>
          </div>

          {/* Login link */}
          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            Уже есть аккаунт?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
