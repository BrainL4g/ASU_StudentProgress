import React, { useEffect, useState } from 'react'
import { apiAdminGet, apiAdminPost, apiAdminPut, apiAdminDelete } from '../api.js'
import GenericCrudForm from '../components/GenericCrudForm.jsx'
import GenericCrudTable from '../components/GenericCrudTable.jsx'

function hideIdFields(columns) {
  return columns
}

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
  { key: 'appeal-statuses', label: 'Статусы апелляций' },
  { key: 'faculties', label: 'Факультеты' },
  { key: 'specializations', label: 'Специальности' },
  { key: 'enrollment-reasons', label: 'Основания зачисления' },
  { key: 'discipline-groups', label: 'Группы и преподаватели' },
  { key: 'student-groups', label: 'Группы студентов' },
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
      case 'appeal-statuses': return <AppealStatusesSection {...props} />
      case 'faculties': return <FacultiesSection {...props} />
      case 'specializations': return <SpecializationsSection {...props} />
      case 'enrollment-reasons': return <EnrollmentReasonsSection {...props} />
      case 'discipline-groups': return <DisciplineGroupsSection {...props} />
      case 'student-groups': return <StudentGroupsSection {...props} />
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
  const [faculties, setFaculties] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [g, f, s] = await Promise.all([
        apiAdminGet('groups'),
        apiAdminGet('faculties'),
        apiAdminGet('specializations')
      ])
      setData(g)
      setFaculties(f)
      setSpecializations(s)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const [values, setValues] = useState({})

  if (loading) return <Spinner />

  const filteredSpecs = () => {
    const facId = values?.faculty_id || (editItem?.faculty_id)
    if (!facId) return specializations
    return specializations.filter(s => s.faculty_id === facId)
  }

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (editItem) {
        await apiAdminPut('groups', editItem.id, values)
        onNotify('Группа обновлена')
      } else {
        await apiAdminPost('groups', values)
        onNotify('Группа добавлена')
      }
      setShowForm(false)
      setEditItem(null)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить группу?')) return
    try {
      await apiAdminDelete('groups', id)
      onNotify('Группа удалена')
      load()
    } catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader
        title="Группы"
        count={data.length}
        onAdd={() => { setEditItem(null); setShowForm(true); setValues({}) }}
        onRefresh={load}
      />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'name', label: 'Название', placeholder: 'ИС-201', required: true },
              { key: 'course', label: 'Курс', placeholder: '1' },
              { key: 'faculty_id', label: 'Факультет', type: 'select', options: faculties.map(f => ({ value: f.id, label: f.name })) },
              { key: 'specialization_id', label: 'Специальность', type: 'select', options: filteredSpecs().map(s => ({ value: s.id, label: s.name })) },
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
          { key: 'name', label: 'Название' },
          { key: 'description', label: 'Описание' },
        ]}
        data={data}
        onDelete={handleDelete}
      />
    </div>
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
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([
        apiAdminGet('appeals'),
        apiAdminGet('appeal-statuses')
      ])
      setData(a)
      setStatuses(s)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const getStatusBadge = (statusId) => {
    const status = statuses.find(s => s.id === statusId)
    const styles = {
      'На рассмотрении': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      'Удовлетворена': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      'Отклонена': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status?.name] || 'bg-gray-100 dark:bg-dark-border text-gray-800 dark:text-dark-muted'}`}>
        {status?.name || statusId}
      </span>
    )
  }

  return (
    <div>
      <SectionHeader title="Апелляции" count={data.length} showAdd={false} onRefresh={load} />
      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-input rounded-lg">
          <GenericCrudForm
            fields={[
              { key: 'status_id', label: 'Статус', type: 'select', options: statuses.map(s => ({ value: s.id, label: s.name })), required: true },
              { key: 'comment', label: 'Комментарий', type: 'textarea' },
            ]}
            initialValues={editItem || {}}
            onSubmit={async values => {
              await apiAdminPut('appeals', editItem.id, values)
              onNotify('Апелляция обновлена')
              setShowForm(false)
              setEditItem(null)
              load()
            }}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'student_id', label: 'Студент' },
          { key: 'subject_id', label: 'Предмет' },
          { key: 'description', label: 'Описание' },
          { key: 'status_id', label: 'Статус' },
          { key: 'created_at', label: 'Дата', render: v => v ? new Date(v).toLocaleString('ru-RU') : '—' },
        ]}
        data={data}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
      />
    </div>
  )
}

function AppealStatusesSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Статусы апелляций"
      endpoint="appeal-statuses"
      fields={[
        { key: 'name', label: 'Название', placeholder: 'На рассмотрении', required: true },
        { key: 'description', label: 'Описание', placeholder: 'Апелляция на рассмотрении' },
      ]}
      columns={hideIdFields([
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
      ])}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function FacultiesSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Факультеты"
      endpoint="faculties"
      fields={[
        { key: 'name', label: 'Название', placeholder: 'Факультет информатики', required: true },
        { key: 'code', label: 'Код', placeholder: 'FI' },
      ]}
      columns={hideIdFields([
        { key: 'name', label: 'Название' },
        { key: 'code', label: 'Код' },
      ])}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function SpecializationsSection({ onNotify, onError }) {
  const [faculties, setFaculties] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([apiAdminGet('specializations'), apiAdminGet('faculties')])
      setData(s)
      setFaculties(f)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (editItem) {
        await apiAdminPut('specializations', editItem.id, values)
        onNotify('Специальность обновлена')
      } else {
        await apiAdminPost('specializations', values)
        onNotify('Специальность добавлена')
      }
      setShowForm(false)
      setEditItem(null)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить специальность?')) return
    try {
      await apiAdminDelete('specializations', id)
      onNotify('Специальность удалена')
      load()
    } catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader
        title="Специальности"
        count={data.length}
        onAdd={() => { setEditItem(null); setShowForm(true) }}
        onRefresh={load}
      />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'name', label: 'Название', required: true },
              { key: 'code', label: 'Код' },
              { key: 'faculty_id', label: 'Факультет', type: 'select', options: faculties.map(f => ({ value: f.id, label: f.name })), required: true },
            ]}
            initialValues={editItem || {}}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={hideIdFields([
          { key: 'name', label: 'Название' },
          { key: 'code', label: 'Код' },
          { key: 'faculty', label: 'Факультет', render: v => v?.name ?? '—' },
        ])}
        data={data}
        onEdit={item => { setEditItem(item); setShowForm(true) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

function EnrollmentReasonsSection({ onNotify, onError }) {
  return (
    <CrudSection
      title="Основания зачисления"
      endpoint="enrollment-reasons"
      fields={[
        { key: 'name', label: 'Название', placeholder: 'Поступление', required: true },
        { key: 'description', label: 'Описание' },
      ]}
      columns={hideIdFields([
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
      ])}
      onNotify={onNotify}
      onError={onError}
    />
  )
}

function DisciplineGroupsSection({ onNotify, onError }) {
  const [data, setData] = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [groups, setGroups] = useState([])
  const [teachers, setTeachers] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [dg, d, g, t, s] = await Promise.all([
        apiAdminGet('discipline-groups'),
        apiAdminGet('subjects'),
        apiAdminGet('groups'),
        apiAdminGet('teachers'),
        apiAdminGet('semesters'),
      ])
      setData(dg)
      setDisciplines(d)
      setGroups(g)
      setTeachers(t)
      setSemesters(s)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      await apiAdminPost('discipline-groups', values)
      onNotify('Добавлено')
      setShowForm(false)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить?')) return
    try { await apiAdminDelete('discipline-groups', id); onNotify('Удалено'); load() }
    catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader title="Группы и преподаватели" count={data.length} onAdd={() => setShowForm(true)} onRefresh={load} />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'discipline_id', label: 'Дисциплина', type: 'select', options: disciplines.map(d => ({ value: d.id, label: d.name })), required: true },
              { key: 'group_id', label: 'Группа', type: 'select', options: groups.map(g => ({ value: g.id, label: g.name })), required: true },
              { key: 'teacher_id', label: 'Преподаватель', type: 'select', options: [{ value: '', label: '— Не выбран —' }, ...teachers.map(t => ({ value: t.id, label: t.department }))] },
              { key: 'semester_id', label: 'Семестр', type: 'select', options: semesters.map(s => ({ value: s.id, label: s.year + ' — ' + s.term })), required: true },
              { key: 'academic_year', label: 'Учебный год', placeholder: '2024-2025' },
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
          { key: 'discipline_id', label: 'Дисциплина' },
          { key: 'group_id', label: 'Группа' },
          { key: 'teacher_id', label: 'Преподаватель' },
          { key: 'semester_id', label: 'Семестр' },
        ]}
        data={data}
        onDelete={handleDelete}
      />
    </div>
  )
}

function StudentGroupsSection({ onNotify, onError }) {
  const [data, setData] = useState([])
  const [students, setStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [reasons, setReasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [sg, s, g, r] = await Promise.all([
        apiAdminGet('student-groups'),
        apiAdminGet('students'),
        apiAdminGet('groups'),
        apiAdminGet('enrollment-reasons'),
      ])
      setData(sg)
      setStudents(s)
      setGroups(g)
      setReasons(r)
    } catch (e) { onError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const handleSubmit = async (values) => {
    setFormLoading(true)
    try {
      if (values.is_current) {
        for (const sg of data.filter(d => d.student_id === values.student_id && d.is_current)) {
          await apiAdminPut('student-groups', sg.id, { is_current: false })
        }
      }
      await apiAdminPost('student-groups', values)
      onNotify('Добавлено')
      setShowForm(false)
      load()
    } catch (e) { onError(e.message) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить?')) return
    try { await apiAdminDelete('student-groups', id); onNotify('Удалено'); load() }
    catch (e) { onError(e.message) }
  }

  return (
    <div>
      <SectionHeader title="Группы студентов" count={data.length} onAdd={() => setShowForm(true)} onRefresh={load} />
      {showForm && (
        <div className="mb-4">
          <GenericCrudForm
            fields={[
              { key: 'student_id', label: 'Студент', type: 'select', options: students.map(s => ({ value: s.id, label: 'ID:' + s.id })), required: true },
              { key: 'group_id', label: 'Группа', type: 'select', options: groups.map(g => ({ value: g.id, label: g.name })), required: true },
              { key: 'reason_id', label: 'Основание', type: 'select', options: reasons.map(r => ({ value: r.id, label: r.name })), required: true },
              { key: 'enrollment_date', label: 'Дата зачисления', type: 'date' },
              { key: 'dropout_date', label: 'Дата отчисления', type: 'date' },
              { key: 'is_current', label: 'Текущий', type: 'select', options: [{ value: false, label: 'Нет' }, { value: true, label: 'Да' }] },
            ]}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        </div>
      )}
      <GenericCrudTable
        columns={[
          { key: 'student_id', label: 'Студент' },
          { key: 'group_id', label: 'Группа', render: v => v === 1 ? 'ИС-21' : v === 2 ? 'ИС-22' : v === 3 ? 'ИС-23' : v === 4 ? 'ПИ-21' : v === 5 ? 'ПИ-22' : v === 6 ? 'ПИБ-21' : v },
          { key: 'reason_id', label: 'Основание', render: v => v === 1 ? 'Поступление' : v === 2 ? 'Восстановление' : v === 3 ? 'Перевод' : v },
          { key: 'enrollment_date', label: 'Зачислен' },
          { key: 'dropout_date', label: 'Отчислен' },
          { key: 'is_current', label: 'Текущий', render: v => v ? '✓' : '' },
        ]}
        data={data}
        onDelete={handleDelete}
      />
    </div>
  )
}
