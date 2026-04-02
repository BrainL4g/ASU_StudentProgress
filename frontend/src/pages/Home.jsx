/**
 * Главная страница приложения.
 * Современный hero-секция с feature cards.
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
      <Header />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              АСУ учёта успеваемости студентов
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6">
              Управляйте успеваемостью{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                легко и эффективно
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Современная система учёта оценок, посещаемости и апелляций.
              Полная аналитика успеваемости — всегда под рукой.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Войти в систему
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border shadow-sm hover:shadow-md transition-all duration-200"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Возможности системы
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Всё необходимое для управления учебным процессом
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Students */}
          <FeatureCard
            icon="🎓"
            title="Студенты"
            color="blue"
            items={[
              'Просмотр оценок и среднего балла',
              'Личный рейтинг в группе',
              'Отслеживание посещаемости',
              'Подача апелляций онлайн',
            ]}
          />

          {/* Teachers */}
          <FeatureCard
            icon="🧑‍🏫"
            title="Преподаватели"
            color="indigo"
            items={[
              'Выставление и редактирование оценок',
              'Отметка посещаемости',
              'Журнал успеваемости группы',
              'Работа с апелляциями',
            ]}
          />

          {/* Admin */}
          <FeatureCard
            icon="⚙️"
            title="Администратор"
            color="purple"
            items={[
              'Управление пользователями',
              'CRUD групп, дисциплин, семестров',
              'Назначение преподавателей',
              'Обработка апелляций',
            ]}
          />
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBlock label="Студентов" value="6+" />
          <StatBlock label="Преподавателей" value="2" />
          <StatBlock label="Дисциплин" value="7" />
          <StatBlock label="Групп" value="4" />
        </div>
      </div>
    </div>
  )
}

// ──── Sub-components ────

function FeatureCard({ icon, title, color, items }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  }

  return (
    <div className="group bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/80 dark:border-dark-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white text-xl mb-4 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatBlock({ label, value }) {
  return (
    <div className="bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/80 dark:border-dark-border text-center">
      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  )
}
