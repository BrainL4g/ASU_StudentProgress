/**
 * Студенческий личный кабинет.
 * Современный дизайн с карточками статистики и tab-навигацией.
 */

import React, { useEffect, useState } from 'react'
import { apiStudentGet, apiStudentPost } from '../api.js'

// ──── Компоненты ────

function Spinner({ message = 'Загрузка...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    green: 'from-green-500 to-green-600 shadow-green-500/20',
    orange: 'from-amber-500 to-amber-600 shadow-amber-500/20',
  }
  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80 dark:border-dark-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
          <div className={`text-3xl font-bold ${textColors[color]}`}>{value}</div>
          {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-lg shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

function GradeBadge({ value }) {
  let styles = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  if (value >= 4.5) styles = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  else if (value >= 3.5) styles = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  else if (value >= 2.5) styles = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
  else styles = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'

  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full text-sm font-bold ${styles}`}>
      {value}
    </span>
  )
}

function StatusBadge({ status }) {
  const statusName = typeof status === 'object' ? status?.name : status
  const styles = {
    'На рассмотрении': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'Удовлетворена': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Отклонена': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statusName] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
      {statusName || 'Неизвестно'}
    </span>
  )
}

function AppealForm({ subjects, onSuccess }) {
  const [subjectId, setSubjectId] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subjectId || !description.trim()) {
      setStatus({ type: 'error', message: 'Заполните все поля' })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      await apiStudentPost('appeals', {
        subject_id: parseInt(subjectId),
        description: description.trim()
      })
      setStatus({ type: 'success', message: 'Апелляция отправлена!' })
      setDescription('')
      setSubjectId('')
      onSuccess()
    } catch (e) {
      setStatus({ type: 'error', message: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm">📝</span>
        Подать апелляцию
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Предмет</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Выберите предмет</option>
            {subjects.map(s => (
              <option key={`${s.id}-${s.group_id}`} value={s.id}>
                {s.name} {s.group_name ? `(${s.group_name})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Описание проблемы</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            placeholder="Опишите причину апелляции..."
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold shadow-sm transition-all"
        >
          {submitting ? 'Отправка...' : 'Отправить'}
        </button>
        {status && (
          <p className={`text-sm font-medium ${status.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {status.message}
          </p>
        )}
      </div>
    </form>
  )
}

// ──── Main Component ────

export default function StudentDashboard() {
  const [grades, setGrades] = useState([])
  const [stats, setStats] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [appeals, setAppeals] = useState([])
  const [studentGroups, setStudentGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [g, s, r, a, subj, app, groups] = await Promise.all([
        apiStudentGet('grades'),
        apiStudentGet('stats'),
        apiStudentGet('ranking'),
        apiStudentGet('attendance/stats'),
        apiStudentGet('subjects'),
        apiStudentGet('appeals'),
        apiStudentGet('groups'),
      ])
      setGrades(g)
      setStats(s)
      setRanking(r)
      setAttendanceStats(a)
      setSubjects(subj)
      setAppeals(app)
      setStudentGroups(groups)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-semibold text-red-700 dark:text-red-400">Ошибка загрузки данных</p>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
        </div>
        <button onClick={loadAll} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-sm transition-all">
          Повторить
        </button>
      </div>
    )
  }

  const TABS = [
    { key: 'overview', label: 'Обзор', icon: '📊' },
    { key: 'grades', label: 'Оценки', icon: '📝' },
    { key: 'appeals', label: 'Апелляции', icon: '📋' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Личный кабинет</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Ваша успеваемость и статистика</p>
            {studentGroups.length > 0 && (
              <div className="flex gap-1">
                {studentGroups.map(sg => (
                  <span key={sg.id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    sg.is_current 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {sg.group?.name}
                    {sg.is_current && ' (текущая)'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={loadAll}
          className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-input text-sm font-medium transition-colors"
        >
          ↻ Обновить
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
<StatCard
  label="Средний балл"
  value={stats?.gpa?.toFixed(2) ?? '—'}
  sub="из 5.0"
  color="blue"
  icon="📊"
/>
        <StatCard
          label="Место в рейтинге"
          value={ranking?.my_rank != null ? `#${ranking.my_rank}` : '—'}
          sub={`из ${ranking?.total_students ?? 0} студентов`}
          color="purple"
          icon="🏆"
        />
        <StatCard
          label="Посещаемость"
          value={attendanceStats?.percentage != null ? `${attendanceStats.percentage}%` : '—'}
          sub={`${attendanceStats?.present ?? 0} присут. / ${attendanceStats?.absent ?? 0} пропусков`}
          color="green"
          icon="📅"
        />
      </div>

      {/* Content Card */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80 dark:border-dark-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-border overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-input'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Последние оценки
              </h3>
              {grades.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">Нет оценок</p>
              ) : (
                <div className="space-y-3">
                  {grades.slice(0, 5).map(g => (
                    <div key={g.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-dark-input/80 rounded-xl border border-gray-100 dark:border-dark-border hover:shadow-sm transition-shadow">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {g.discipline_group?.discipline?.name || '—'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{g.control_type?.name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{g.date}</span>
                        <GradeBadge value={g.value} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {grades.length > 5 && (
                <button onClick={() => setActiveTab('grades')} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  Все оценки ({grades.length}) →
                </button>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            grades.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">Нет оценок</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-dark-border">
                      <th className="pb-3 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Предмет</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Тип</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Оценка</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => (
                      <tr key={g.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-input/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{g.discipline_group?.discipline?.name || '—'}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{g.control_type?.name ?? `#${g.control_type_id}`}</td>
                        <td className="py-3 pr-4"><GradeBadge value={g.value} /></td>
                        <td className="py-3 text-gray-400 dark:text-gray-500 text-xs">{g.date ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Appeals Tab */}
          {activeTab === 'appeals' && (
            <div className="space-y-6">
              <AppealForm subjects={subjects} onSuccess={loadAll} />
              
              <div>
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Мои апелляции</h3>
                {appeals.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">Нет апелляций</p>
                ) : (
                  <div className="space-y-3">
                    {appeals.map(a => (
                      <div key={a.id} className="p-4 bg-gray-50/80 dark:bg-dark-input/80 rounded-xl border border-gray-100 dark:border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {typeof a.subject === 'object' ? (a.subject?.name || a.subject) : a.subject}
                          </span>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {a.created_at ? new Date(a.created_at).toLocaleString('ru-RU') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
