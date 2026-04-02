import React, { useEffect, useState, useMemo } from 'react'
import {
  apiTeacherGet, apiTeacherPost, apiTeacherPut, apiTeacherDelete,
  apiTeacherExportGrades, apiTeacherExportAllGrades,
  apiTeacherExportAttendance, apiTeacherExportGroupSummary, downloadBlob
} from '../api.js'

function Spinner({ message = 'Загрузка...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
    </div>
  )
}

function StatCard({ label, value, color = 'blue', icon }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
  }
  const iconBg = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    green: 'from-green-500 to-green-600 shadow-green-500/20',
  }
  return (
    <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80 dark:border-dark-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
          <div className={`text-3xl font-bold ${colors[color] ?? colors.blue}`}>{value}</div>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center text-white text-lg shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

function inputCls() {
  return 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm text-gray-800 dark:text-white ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-dark-input transition-all'
}

function labelCls() {
  return 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
}

function getStudentFullName(student) {
  const ua = student.user_account
  if (ua) {
    const parts = [ua.last_name, ua.first_name, ua.patronymic].filter(Boolean)
    if (parts.length > 0) return parts.join(' ')
  }
  return `Студент #${student.id}`
}

// Modal component for grade history
function GradeHistoryModal({ grade, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiTeacherGet(`grades/${grade.id}`)
        setHistory(data.history || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [grade.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            История изменений оценки
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-input rounded-xl">
          <div className="text-sm text-gray-500 dark:text-gray-400">Текущая оценка</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{grade.value}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {grade.subject?.name} — {grade.control_type?.name}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Загрузка...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Нет истории изменений</div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className="p-3 bg-gray-50 dark:bg-dark-input rounded-lg border border-gray-100 dark:border-dark-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-dark-text">
                    {h.old_value ?? '—'} → {h.new_value}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {h.changed_at ? new Date(h.changed_at).toLocaleString('ru-RU') : ''}
                  </span>
                </div>
                {h.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Причина: {h.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-input text-sm font-medium transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

// Reports section component
function ReportsSection({ groups, myGroupSubjects, onError }) {
  const [reportGroupId, setReportGroupId] = useState('')
  const [reportSubjectId, setReportSubjectId] = useState('')
  const [exporting, setExporting] = useState(null)

  const availableSubjects = useMemo(() => {
    if (!reportGroupId) return []
    return myGroupSubjects
      .filter(gs => gs.group_id === parseInt(reportGroupId))
      .map(gs => ({ ...gs.subject, group_subject_id: gs.id }))
  }, [myGroupSubjects, reportGroupId])

  const doExport = async (type) => {
    setExporting(type)
    try {
      let blob, filename
      switch (type) {
        case 'grades-all':
          blob = await apiTeacherExportAllGrades()
          filename = 'all_grades.csv'
          break
        case 'grades-group':
          if (!reportGroupId || !reportSubjectId) { onError('Выберите группу и дисциплину'); return }
          blob = await apiTeacherExportGrades(parseInt(reportGroupId), parseInt(reportSubjectId))
          filename = `grades_${reportGroupId}_${reportSubjectId}.csv`
          break
        case 'attendance':
          if (!reportGroupId || !reportSubjectId) { onError('Выберите группу и дисциплину'); return }
          blob = await apiTeacherExportAttendance(parseInt(reportGroupId), parseInt(reportSubjectId))
          filename = `attendance_${reportGroupId}_${reportSubjectId}.csv`
          break
        case 'summary':
          if (!reportGroupId) { onError('Выберите группу'); return }
          blob = await apiTeacherExportGroupSummary(parseInt(reportGroupId))
          filename = `summary_${reportGroupId}.csv`
          break
        default: return
      }
      downloadBlob(blob, filename)
    } catch (e) {
      onError('Ошибка экспорта: ' + e.message)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls()}>Группа</label>
        <select value={reportGroupId}
          onChange={e => { setReportGroupId(e.target.value); setReportSubjectId('') }}
          className={inputCls()}>
          <option value="">— Выберите группу —</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {availableSubjects.length > 0 && (
        <div>
          <label className={labelCls()}>Дисциплина</label>
          <select value={reportSubjectId}
            onChange={e => setReportSubjectId(e.target.value)}
            className={inputCls()}>
            <option value="">— Выберите дисциплину —</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => doExport('grades-all')}
          disabled={exporting === 'grades-all'}
          className="p-4 bg-white dark:bg-dark-input rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md transition-all text-left disabled:opacity-50">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Все мои оценки</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Экспорт всех выставленных оценок в CSV</div>
        </button>
        <button onClick={() => doExport('grades-group')}
          disabled={exporting === 'grades-group' || !reportGroupId || !reportSubjectId}
          className="p-4 bg-white dark:bg-dark-input rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md transition-all text-left disabled:opacity-50">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Оценки по группе и дисциплине</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Экспорт оценок выбранной группы по дисциплине</div>
        </button>
        <button onClick={() => doExport('attendance')}
          disabled={exporting === 'attendance' || !reportGroupId || !reportSubjectId}
          className="p-4 bg-white dark:bg-dark-input rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md transition-all text-left disabled:opacity-50">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Посещаемость</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Экспорт посещаемости по группе и дисциплине</div>
        </button>
        <button onClick={() => doExport('summary')}
          disabled={exporting === 'summary' || !reportGroupId}
          className="p-4 bg-white dark:bg-dark-input rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-md transition-all text-left disabled:opacity-50">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Сводный отчёт по группе</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Оценки + посещаемость по всем дисциплинам группы</div>
        </button>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const [myGroupSubjects, setMyGroupSubjects] = useState([])
  const [controlTypes, setControlTypes] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [students, setStudents] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('grades')
  const [gradeValue, setGradeValue] = useState('')
  const [gradeControlTypeId, setGradeControlTypeId] = useState('')
  const [gradeStatus, setGradeStatus] = useState(null)
  const [attendanceStatus, setAttendanceStatus] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [historyModalGrade, setHistoryModalGrade] = useState(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGradeMin, setFilterGradeMin] = useState('')
  const [filterGradeMax, setFilterGradeMax] = useState('')
  const [filterControlTypeId, setFilterControlTypeId] = useState('')
  
  // Debounced search for better performance
  const debouncedSearchTerm = useMemo(() => searchTerm, [searchTerm])

  // Derived data - unique groups from my-group-subjects
  const groups = useMemo(() => {
    const groupsMap = {}
    myGroupSubjects.forEach(gs => {
      if (gs.group && !groupsMap[gs.group.id]) {
        groupsMap[gs.group.id] = gs.group
      }
    })
    return Object.values(groupsMap)
  }, [myGroupSubjects])

  // Derived data - subjects for selected group
  const availableSubjects = useMemo(() => {
    if (!selectedGroupId) return []
    return myGroupSubjects
      .filter(gs => gs.group_id === parseInt(selectedGroupId))
      .map(gs => ({
        ...gs.subject,
        group_subject_id: gs.id
      }))
  }, [myGroupSubjects, selectedGroupId])

  useEffect(() => { loadInitial() }, [])

  const loadInitial = async () => {
    setLoading(true)
    try {
      const [gs, ct] = await Promise.all([
        apiTeacherGet('my-group-subjects'),
        apiTeacherGet('control-types')
      ])
      
      setMyGroupSubjects(gs)
      setControlTypes(ct)
    } catch (e) { 
      setError(e.message)
    } finally { 
      setLoading(false) 
    }
  }

  const loadStudents = async (groupId) => {
    if (!groupId) { setStudents([]); return }
    try { 
      setStudents(await apiTeacherGet(`students-by-group/${groupId}`))
    }
    catch (e) { 
      setError(e.message) 
      setStudents([])
    }
  }

  const loadGrades = async () => {
    try { setGrades(await apiTeacherGet('grades')) }
    catch (e) { setError(e.message) }
  }

  const loadAttendance = async () => {
    try { setAttendance(await apiTeacherGet('attendance')) }
    catch (e) { setError(e.message) }
  }

  useEffect(() => {
    if (activeTab === 'grades') loadGrades()
    if (activeTab === 'attendance') loadAttendance()
  }, [activeTab])

  const handleAssignGrade = async (e) => {
    e.preventDefault()
    if (!selectedStudentId || !selectedSubjectId || !gradeControlTypeId || !gradeValue) {
      setGradeStatus({ type: 'error', message: 'Заполните все поля' }); return
    }
    setGradeStatus(null)
    try {
      await apiTeacherPost('grades', {
        student_id: parseInt(selectedStudentId),
        subject_id: parseInt(selectedSubjectId),
        control_type_id: parseInt(gradeControlTypeId),
        value: parseFloat(gradeValue)
      })
      setGradeStatus({ type: 'success', message: 'Оценка выставлена!' })
      setGradeValue('')
      loadGrades()
    } catch (e) { setGradeStatus({ type: 'error', message: e.message }) }
  }

  const handleUpdateGrade = async (gradeId, newValue, reason = null) => {
    try { 
      await apiTeacherPut(`grades`, gradeId, { value: parseFloat(newValue), reason }); 
      loadGrades() 
    }
    catch (e) { setError(e.message) }
  }

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm('Удалить оценку?')) return
    try { await apiTeacherDelete(`grades`, gradeId); loadGrades() }
    catch (e) { setError(e.message) }
  }

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedSubjectId || !selectedGroupId) {
      setAttendanceStatus({ type: 'error', message: 'Сначала выберите группу и дисциплину' }); return
    }
    
    // Find the group_subject_id for the selected group and subject
    const gs = myGroupSubjects.find(
      g => g.group_id === parseInt(selectedGroupId) && g.subject_id === parseInt(selectedSubjectId)
    )
    
    if (!gs) {
      setAttendanceStatus({ type: 'error', message: 'Дисциплина не найдена для этой группы' }); return
    }
    
    try {
      await apiTeacherPost('attendance', {
        student_id: studentId,
        group_subject_id: gs.id,
        date: attendanceDate,
        status
      })
      setAttendanceStatus({ type: 'success', message: 'Посещаемость отмечена' })
      loadAttendance()
    } catch (e) { setAttendanceStatus({ type: 'error', message: e.message }) }
  }

  const handleExportGrades = async () => {
    if (!selectedGroupId || !selectedSubjectId) {
      setError('Выберите группу и дисциплину для экспорта')
      return
    }
    
    try {
      const blob = await apiTeacherExportGrades(parseInt(selectedGroupId), parseInt(selectedSubjectId))
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `grades_${selectedGroupId}_${selectedSubjectId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) { 
      setError('Ошибка экспорта: ' + e.message) 
    }
  }

  const getGradeColor = (val) => {
    if (val >= 4.5) return 'text-green-600'
    if (val >= 3.5) return 'text-blue-600'
    if (val >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Filter grades based on selected group and subject
  const filteredGrades = useMemo(() => {
    if (!selectedGroupId && !selectedSubjectId) return grades
    
    return grades.filter(g => {
      if (selectedSubjectId && g.subject_id !== parseInt(selectedSubjectId)) return false
      // Check if grade's student is in selected group
      if (selectedGroupId) {
        const studentInGrades = students.find(s => s.id === g.student_id)
        if (studentInGrades && studentInGrades.group_id !== parseInt(selectedGroupId)) return false
      }
      return true
    })
  }, [grades, selectedGroupId, selectedSubjectId, students])

  if (loading) return <Spinner />

  if (error && !myGroupSubjects.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 text-center max-w-md">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-semibold text-red-700 dark:text-red-400">Ошибка загрузки</p>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
        </div>
        <button onClick={loadInitial} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-sm transition-all">
          Повторить
        </button>
      </div>
    )
  }

  const TABS = [
    { key: 'grades',     label: 'Оценки' },
    { key: 'attendance', label: 'Посещаемость' },
    { key: 'reports',    label: 'Отчёты' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Кабинет преподавателя</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Управление оценками и посещаемостью</p>
        </div>
        <button
          onClick={() => { loadInitial(); if (activeTab === 'grades') loadGrades(); if (activeTab === 'attendance') loadAttendance() }}
          className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-input text-sm font-medium transition-colors"
        >
          ↻ Обновить
        </button>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline font-medium ml-4">Закрыть</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Мои дисциплины" value={myGroupSubjects.length} color="blue" icon="📚" />
        <StatCard label="Оценок выставлено" value={grades.length} color="purple" icon="📝" />
        <StatCard label="Моих групп" value={groups.length} color="green" icon="👥" />
      </div>

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80 dark:border-dark-border overflow-hidden mb-6">
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
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'grades' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls()}>Группа</label>
                  <select value={selectedGroupId}
                    onChange={e => { 
                      setSelectedGroupId(e.target.value)
                      setSelectedSubjectId('')
                      loadStudents(e.target.value) 
                    }}
                    className={inputCls()}>
                    <option value="">— Выберите группу —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls()}>Дисциплина</label>
                  <select value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className={inputCls()}>
                    <option value="">— Выберите дисциплину —</option>
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedGroupId && selectedSubjectId && (
                <div className="flex justify-end">
                  <button 
                    onClick={handleExportGrades}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Экспорт оценок (CSV)
                  </button>
                </div>
              )}

              <form onSubmit={handleAssignGrade} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-dark-text">Выставить оценку</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls()}>Студент</label>
                    <select value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className={inputCls()}>
                      <option value="">— Студент —</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {getStudentFullName(s)} ({s.group?.name ?? 'Без группы'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls()}>Тип контроля</label>
                    <select value={gradeControlTypeId}
                      onChange={e => setGradeControlTypeId(e.target.value)}
                      className={inputCls()}>
                      <option value="">— Тип —</option>
                      {controlTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls()}>Оценка (0–5)</label>
                    <input type="number" min="0" max="5" step="0.1"
                      value={gradeValue}
                      onChange={e => setGradeValue(e.target.value)}
                      className={inputCls()} />
                  </div>
                  <div className="flex items-end">
                    <button type="submit"
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                        text-sm font-semibold shadow-sm transition-colors">
                      Выставить
                    </button>
                  </div>
                </div>
                {gradeStatus && (
                  <p className={`text-sm font-medium ${gradeStatus.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {gradeStatus.message}
                  </p>
                )}
              </form>

              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
                  Журнал оценок ({filteredGrades.length})
                </h3>
                {filteredGrades.length === 0 ? (
                  <p className="text-gray-400 dark:text-dark-muted text-sm py-4">Нет оценок</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-200 dark:border-dark-border">
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Студент</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Дисциплина</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Тип</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Оценка</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Дата</th>
                          <th className="pb-3 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map(g => (
                          <tr key={g.id} className="border-b border-gray-50 dark:border-dark-input last:border-0 hover:bg-gray-50 dark:hover:bg-dark-input transition-colors">
                            <td className="py-3 pr-4 font-semibold text-gray-800 dark:text-dark-text">#{g.student_id}</td>
                            <td className="py-3 pr-4 text-gray-600 dark:text-dark-muted">{g.subject?.name ?? `Предмет #${g.subject_id}`}</td>
                            <td className="py-3 pr-4 text-gray-500 dark:text-dark-muted">{g.control_type?.name ?? `Тип #${g.control_type_id}`}</td>
                            <td className={`py-3 pr-4 font-bold ${getGradeColor(g.value)}`}>{g.value}</td>
                            <td className="py-3 pr-4 text-gray-400 dark:text-dark-muted">{g.date ?? '—'}</td>
                            <td className="py-3">
                              <div className="flex gap-1.5">
                                <button onClick={() => setHistoryModalGrade(g)}
                                  className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                  История
                                </button>
                                <button onClick={() => {
                                  const val = prompt('Новое значение:', g.value)
                                  if (val !== null) handleUpdateGrade(g.id, val)
                                }}
                                  className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                                  Изменить
                                </button>
                                <button onClick={() => handleDeleteGrade(g.id)}
                                  className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                  Удалить
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls()}>Группа</label>
                  <select value={selectedGroupId}
                    onChange={e => { 
                      setSelectedGroupId(e.target.value)
                      setSelectedSubjectId('')
                      loadStudents(e.target.value) 
                    }}
                    className={inputCls()}>
                    <option value="">— Выберите группу —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls()}>Дисциплина</label>
                  <select value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className={inputCls()}>
                    <option value="">— Выберите дисциплину —</option>
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls()}>Дата</label>
                  <input type="date" value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className={inputCls()} />
                </div>
              </div>

              {students.length > 0 && selectedSubjectId ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
                    Список студентов ({students.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {students.map(s => (
                      <div key={s.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-dark-input rounded-lg border border-gray-100 dark:border-dark-border">
                        <span className="font-semibold text-gray-800 dark:text-dark-text text-sm">
                          {getStudentFullName(s)}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => handleMarkAttendance(s.id, 'present')}
                            className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                            ✓
                          </button>
                          <button onClick={() => handleMarkAttendance(s.id, 'absent')}
                            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                            ✗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {attendanceStatus && (
                    <p className={`mt-3 text-sm font-medium ${attendanceStatus.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {attendanceStatus.message}
                    </p>
                  )}
                </div>
              ) : students.length > 0 ? (
                <p className="text-gray-400 dark:text-dark-muted text-sm">Выберите дисциплину для отметки посещаемости</p>
              ) : null}

              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
                  Журнал посещаемости ({attendance.length})
                </h3>
                {attendance.length === 0 ? (
                  <p className="text-gray-400 dark:text-dark-muted text-sm py-4">Нет записей</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-200 dark:border-dark-border">
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Студент</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Дисциплина</th>
                          <th className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Дата</th>
                          <th className="pb-3 text-xs font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.slice(0, 50).map(a => (
                          <tr key={a.id} className="border-b border-gray-50 dark:border-dark-input last:border-0 hover:bg-gray-50 dark:hover:bg-dark-input transition-colors">
                            <td className="py-3 pr-4 font-semibold text-gray-800 dark:text-dark-text">#{a.student_id}</td>
                            <td className="py-3 pr-4 text-gray-600 dark:text-dark-muted">
                              {a.group_subject?.subject?.name ?? `Дисциплина #${a.group_subject_id}`}
                            </td>
                            <td className="py-3 pr-4 text-gray-400 dark:text-dark-muted">{a.date ?? '—'}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                a.status === 'present'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {a.status === 'present' ? 'Присутствует' : 'Отсутствует'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportsSection
              groups={groups}
              myGroupSubjects={myGroupSubjects}
              onError={setError}
            />
          )}
        </div>
      </div>

      {/* Grade History Modal */}
      {historyModalGrade && (
        <GradeHistoryModal 
          grade={historyModalGrade} 
          onClose={() => setHistoryModalGrade(null)} 
        />
      )}
    </div>
  )
}
