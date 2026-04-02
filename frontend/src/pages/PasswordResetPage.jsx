/**
 * Страница восстановления пароля.
 * Простой двухшаговый процесс:
 * 1. Поиск аккаунта по email
 * 2. Сброс пароля (демо-режим)
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { apiPasswordReset, apiResetPassword } from '../api.js'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('request') // 'request' | 'reset' | 'success'
  const [foundUsername, setFoundUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Шаг 1: Поиск аккаунта по email
  const handleFindAccount = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.includes('@')) {
      setError('Введите корректный email')
      return
    }

    setLoading(true)
    try {
      const data = await apiPasswordReset(email.trim())
      
      if (data.email_exists) {
        setFoundUsername(data.username || '')
        setStep('reset')
      } else {
        // Email не найден — показываем общее сообщение
        setError(data.message || 'Аккаунт с таким email не найден')
      }
    } catch (err) {
      setError('Не удалось выполнить поиск. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  // Шаг 2: Сброс пароля
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)

    // Валидация
    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    try {
      await apiResetPassword(email.trim(), newPassword)
      setStep('success')
    } catch (err) {
      setError(err.message || 'Не удалось изменить пароль. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  // Сброс к началу
  const handleReset = () => {
    setStep('request')
    setEmail('')
    setNewPassword('')
    setConfirmPassword('')
    setFoundUsername('')
    setError(null)
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl mb-4 shadow-lg shadow-amber-500/30">
                {step === 'success' ? '✓' : '🔑'}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {step === 'request' && 'Восстановление пароля'}
                {step === 'reset' && 'Новый пароль'}
                {step === 'success' && 'Готово!'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                {step === 'request' && 'Введите email, чтобы найти ваш аккаунт'}
                {step === 'reset' && `Аккаунт: ${foundUsername}`}
                {step === 'success' && 'Пароль успешно изменён. Теперь войдите с новым паролем.'}
              </p>
            </div>

            {/* Step 1: Поиск по email */}
            {step === 'request' && (
              <form onSubmit={handleFindAccount} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@mail.ru"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? 'Поиск...' : 'Найти аккаунт'}
                </button>
              </form>
            )}

            {/* Step 2: Новый пароль */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Повторите пароль"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 px-4 rounded-xl font-medium border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-input hover:bg-gray-50 dark:hover:bg-dark-border transition-all"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? 'Сохранение...' : 'Изменить пароль'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Успех */}
            {step === 'success' && (
              <div className="space-y-5">
                <div className="flex items-center justify-center p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-700 dark:text-green-400 font-medium">Пароль успешно изменён!</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  Перейти ко входу
                </button>
              </div>
            )}
          </div>

          {/* Ссылка на вход */}
          {step !== 'success' && (
            <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
              Вспомнили пароль?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
