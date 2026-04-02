import React, { useEffect, useState } from 'react'
import { apiAdminGet, apiAdminPost, apiAdminPut, apiAdminDelete } from '../api.js'
import GenericCrudForm from '../components/GenericCrudForm.jsx'
import GenericCrudTable from '../components/GenericCrudTable.jsx'

function Spinner({ message = 'Загрузка...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-dark-muted text-sm">{message}</p>
    </div>
  )
}

function SectionHeader({ title, count, onAdd, onRefresh, showAdd = true }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">
        {title} <span className="text-gray-400 dark:text-dark-muted font-medium text-sm">({count})</span>
      </h2>
      <div className="flex gap-2">
        {onRefresh && (
          <button onClick={onRefresh} className="px-3 py-1.5 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-muted rounded-lg hover:bg-gray-200 dark:hover:bg-dark-input text-sm font-medium transition-colors">
            ↻ Обновить
          </button>
        )}
        {showAdd && onAdd && (
          <button onClick={onAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-sm transition-colors">
            + Добавить
          </button>
        )}
      </div>
    </div>
  )
}

const SECTION_TABS = [
  { key: 'groups', label: 'Группы' },
  { key: 'subjects', label: 'Предметы' },
  { key: 'semesters', label: 'Семестры' },
  { key: 'control-types', label: 'Типы контроля' },
  { key: 'students', label: 'Студенты' },
  { key: 'teachers', label: 'Преподаватели' },
  { key: 'users', label: 'Пользователи' },
  { key: 'group-subjects', label: 'Дисциплины групп' },
  { key: 'appeals', label: 'Апелляции' },
]

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('groups')
  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }

  const renderSection = () => {
    const props = { onNotify: showNotification, onError: showError }
    switch (activeSection) {
      case 'groups': return <GroupsSection {...props} />
      case 'subjects': return <SubjectsSection {...props} />
      case 'semesters': return <SemestersSection {...props} />
      case 'control-types': return <ControlTypesSection {...props} />
      case 'students': return <StudentsSection {...props} />
      case 'teachers': return <TeachersSection {...props} />
      case 'users': return <UsersSection {...props} />
      case 'group-subjects': return <GroupSubjectsSection {...props} />
      case 'appeals': return <AppealsSection {...props} />
      default: return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Панель администратора</h1>
      </div>

      {notification && (
        <div className={`mb-5 p-3 rounded-xl text-sm font-semibold ${
          notification.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
        }`}>
          {notification.msg}
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-dark-border overflow-x-auto">
          {SECTION_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeSection === tab.key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  )
}

// ──── Универсальная CRUD-секция ────

function CrudSection({ title, endpoint, fields, columns, onNotify, onError, extraLoaders = [] }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setData(await apiAdminGet(endpoint)) }
    catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (editItem) {
        await apiAdminPut(endpoint, editItem.id, values)
        onNotify('Запись обновлена')
      } else {
        await apiAdminPost(endpoint, values)
        onNotify('Запись добавлена')
      }
      setShowForm(false)
      setEditItem(null)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return
    try {
      await apiAdminDelete(endpoint, id)
      onNotify('Запись удалена')
      load()
    } catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader
        title={title}
        count={data.length}
        onAdd={() => { setEditItem(null); setShowForm(true) }}
        onRefresh={load}
      />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={fields}
            initialValues={editItem || {}}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={columns}
        data={data}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

// ──── Секции ────

function GroupsSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Группы"
      endpoint="groups"
      fields={[
        { key: 'name', label: 'Название', placeholder: 'ИС-201', required: true },
        { key: 'course', label: 'Курс', placeholder: '1' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Название' },
        { key: 'course', label: 'Курс' },
      ]}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function SubjectsSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Предметы"
      endpoint="subjects"
      fields={[
        { key: 'code', label: 'Код', placeholder: 'MATH101', required: true },
        { key: 'name', label: 'Название', placeholder: 'Высшая математика', required: true },
        { key: 'credits', label: 'Оценки', type: 'number', step: '0.1', min: '0', default: 0 },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'code', label: 'Код' },
        { key: 'name', label: 'Название' },
        { key: 'credits', label: 'Оценки' },
      ]}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function SemestersSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Семестры"
      endpoint="semesters"
      fields={[
        { key: 'year', label: 'Год', type: 'number', required: true },
        { key: 'term', label: 'Терм', placeholder: 'Осенний / Весенний', required: true },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'year', label: 'Год' },
        { key: 'term', label: 'Терм' },
      ]}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function ControlTypesSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Типы контроля"
      endpoint="control-types"
      fields={[
        { key: 'name', label: 'Название', placeholder: 'Экзамен', required: true },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Название' },
      ]}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function StudentsSection({ onNotify, onError }) {
  const [groups, setGroups] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, g] = await Promise.all([apiAdminGet('students'), apiAdminGet('groups')])
      setData(s)
      setGroups(g)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (editItem) { await apiAdminPut('students', editItem.id, values); onNotify('Студент обновлён') }
      else { await apiAdminPost('students', values); onNotify('Студент добавлен') }
      setShowForm(false); setEditItem(null); load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить студента?')) return
    try { await apiAdminDelete('students', id); onNotify('Студент удалён'); load() }
    catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader title="Студенты" count={data.length} onAdd={() => { setEditItem(null); setShowForm(true) }} onRefresh={load} />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'group_id', label: 'Группа', type: 'select', options: groups.map(g => ({ value: g.id, label: g.name })) },
              { key: 'enrollment_year', label: 'Год поступления', type: 'number' },
            ]}
            initialValues={editItem || {}}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'group_id', label: 'Группа', render: v => groups.find(g => g.id === v)?.name ?? `ID:${v}` },
          { key: 'enrollment_year', label: 'Год поступления' },
        ]}
        data={data}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

function TeachersSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Преподаватели"
      endpoint="teachers"
      fields={[
        { key: 'department', label: 'Кафедра', placeholder: 'Информатики' },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'department', label: 'Кафедра' },
      ]}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function UsersSection({ onNotify, onError }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setData(await apiAdminGet('users')) }
    catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (editItem) { await apiAdminPut('users', editItem.id, values); onNotify('Пользователь обновлён') }
      else { await apiAdminPost('users', values); onNotify('Пользователь добавлен') }
      setShowForm(false); setEditItem(null); load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleToggleActive = async (user) => {
    try {
      await apiAdminPut('users', user.id, { is_active: !user.is_active })
      onNotify(user.is_active ? 'Пользователь заблокирован' : 'Пользователь активирован')
      load()
    } catch (e) { onError(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return
    try { await apiAdminDelete('users', id); onNotify('Пользователь удалён'); load() }
    catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader title="Пользователи" count={data.length} onAdd={() => { setEditItem(null); setShowForm(true) }} onRefresh={load} />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'username', label: 'Имя пользователя', placeholder: 'ivanov', required: true },
              { key: 'password', label: 'Пароль', type: 'password', placeholder: 'Оставьте пустым для сохранения' },
              { key: 'role_id', label: 'Роль', type: 'select', options: [
                { value: 1, label: 'Администратор' },
                { value: 2, label: 'Преподаватель' },
                { value: 3, label: 'Студент' },
              ]},
              { key: 'is_active', label: 'Активен', type: 'select', options: [
                { value: true, label: 'Да' },
                { value: false, label: 'Нет' },
              ]},
            ]}
            initialValues={editItem || {}}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'username', label: 'Имя' },
          { key: 'role', label: 'Роль', render: v => v?.name ?? '—' },
          {
            key: 'is_active',
            label: 'Статус',
            render: v => (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {v ? 'Активен' : 'Заблокирован'}
              </span>
            )
          },
        ]}
        data={data}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

function GroupSubjectsSection({ onNotify, onError }) {
  const [data, setData] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [gs, g, s, se] = await Promise.all([
        apiAdminGet('group-subjects'),
        apiAdminGet('groups'),
        apiAdminGet('subjects'),
        apiAdminGet('semesters'),
      ])
      setData(gs)
      setGroups(g)
      setSubjects(s)
      setSemesters(se)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      await apiAdminPost('group-subjects', values)
      onNotify('Дисциплина группы добавлена')
      setShowForm(false)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить дисциплину группы?')) return
    try { await apiAdminDelete('group-subjects', id); onNotify('Удалено'); load() }
    catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader title="Дисциплины групп" count={data.length} onAdd={() => setShowForm(true)} onRefresh={load} />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'group_id', label: 'Группа', type: 'select', options: groups.map(g => ({ value: g.id, label: g.name })), required: true },
              { key: 'subject_id', label: 'Предмет', type: 'select', options: subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` })), required: true },
              { key: 'semester_id', label: 'Семестр', type: 'select', options: semesters.map(s => ({ value: s.id, label: `${s.year} — ${s.term}` })), required: true },
            ]}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'group', label: 'Группа', render: v => v?.name ?? '—' },
          { key: 'subject', label: 'Предмет', render: v => v?.name ?? '—' },
          { key: 'semester', label: 'Семестр', render: v => v ? `${v.year} — ${v.term}` : '—' },
        ]}
        data={data}
        onDelete={handleDelete}
      />
    </div>
  )
}

function AppealsSection({ onNotify, onError }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setData(await apiAdminGet('appeals')) }
    catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleProcess = async (appeal, status) => {
    try {
      await apiAdminPut('appeals', appeal.id, { status })
      onNotify(`Апелляция ${status === 'approved' ? 'одобрена' : 'отклонена'}`)
      load()
    } catch (e) { onError(e.message) }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    }
    const labels = { pending: 'На рассмотрении', approved: 'Одобрено', rejected: 'Отклонено' }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 dark:bg-dark-border text-gray-800 dark:text-dark-muted'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div>
      <SectionHeader title="Апелляции" count={data.length} showAdd={false} onRefresh={load} />
      <GenericCrudTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'student_id', label: 'ID студента' },
          { key: 'subject_id', label: 'ID предмета' },
          { key: 'description', label: 'Описание' },
          { key: 'status', label: 'Статус', render: v => getStatusBadge(v) },
          { key: 'created_at', label: 'Дата подачи', render: v => v ? new Date(v).toLocaleString('ru-RU') : '—' },
        ]}
        data={data}
        onProcess={item => {
          if (item.status !== 'pending') return
          const action = prompt('Одобрить (approved) или отклонить (rejected)?', 'approved')
          if (action === 'approved' || action === 'rejected') handleProcess(item, action)
        }}
      />
    </div>
  )
}
