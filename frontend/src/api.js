/**
 * API wrapper для frontend.
 * Все запросы используют JSON формат.
 */

export const API_BASE = 'http://localhost:8000'

// ──── Headers helpers ────

function getHeaders() {
  // Определяем роль из sessionStorage (уникально для вкладки) или из URL
  const tabRole = sessionStorage.getItem('tab_role')
  let role = tabRole
  if (!role) {
    const path = window.location.pathname
    if (path.startsWith('/admin')) role = 'admin'
    else if (path.startsWith('/teacher')) role = 'teacher'
    else if (path.startsWith('/student')) role = 'student'
  }
  const key = role ? `token_${role}` : 'token'
  const token = localStorage.getItem(key)
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

function getToken() {
  const tabRole = sessionStorage.getItem('tab_role')
  let role = tabRole
  if (!role) {
    const path = window.location.pathname
    if (path.startsWith('/admin')) role = 'admin'
    else if (path.startsWith('/teacher')) role = 'teacher'
    else if (path.startsWith('/student')) role = 'student'
  }
  const key = role ? `token_${role}` : 'token'
  return localStorage.getItem(key)
}

// ──── Response handler ────

async function handleResponse(res) {
  if (!res.ok) {
    let detail = 'Произошла ошибка'
    try {
      const data = await res.json()
      detail = data?.detail || detail
    } catch (_) {
      if (res.status === 401) detail = 'Необходима авторизация'
      else if (res.status === 403) detail = 'Доступ запрещён'
      else if (res.status === 404) detail = 'Не найдено'
      else if (res.status >= 500) detail = 'Ошибка сервера'
    }
    throw new Error(detail)
  }
  return res.json()
}

async function handleBlobResponse(res) {
  if (!res.ok) {
    let detail = 'Произошла ошибка'
    try {
      const data = await res.json()
      detail = data?.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  return res.blob()
}

// ══════════════════════════════════════════════
// AUTH — аутентификация и авторизация
// ══════════════════════════════════════════════

export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  
  if (!res.ok) {
    let detail = 'Неверные учётные данные'
    try {
      const data = await res.json()
      detail = data?.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  
  const data = await res.json()
  return data.access_token
}

export async function apiRegister(username, email, password, role, firstName = null, lastName = null, patronymic = null) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      username, 
      email, 
      password, 
      role,
      first_name: firstName,
      last_name: lastName,
      patronymic: patronymic
    })
  })
  return handleResponse(res)
}

export async function apiPasswordReset(email) {
  const res = await fetch(`${API_BASE}/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  return handleResponse(res)
}

export async function apiResetPassword(email, newPassword) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, new_password: newPassword })
  })
  return handleResponse(res)
}

// ══════════════════════════════════════════════
// ADMIN — админские эндпоинты
// ══════════════════════════════════════════════

export async function apiAdminGet(endpoint) {
  const res = await fetch(`${API_BASE}/admin/${endpoint}`, { headers: getHeaders() })
  return handleResponse(res)
}

export async function apiAdminPost(endpoint, data) {
  const res = await fetch(`${API_BASE}/admin/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function apiAdminPut(endpoint, id, data) {
  const res = await fetch(`${API_BASE}/admin/${endpoint}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function apiAdminDelete(endpoint, id) {
  const res = await fetch(`${API_BASE}/admin/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return handleResponse(res)
}

// ══════════════════════════════════════════════
// STUDENT — студенческие эндпоинты
// ══════════════════════════════════════════════

export async function apiStudentGet(endpoint) {
  const res = await fetch(`${API_BASE}/student/${endpoint}`, { headers: getHeaders() })
  return handleResponse(res)
}

export async function apiStudentPost(endpoint, data) {
  const res = await fetch(`${API_BASE}/student/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

// ══════════════════════════════════════════════
// TEACHER — учительские эндпоинты
// ══════════════════════════════════════════════

export async function apiTeacherGet(endpoint) {
  const res = await fetch(`${API_BASE}/teacher/${endpoint}`, { headers: getHeaders() })
  return handleResponse(res)
}

export async function apiTeacherPost(endpoint, data) {
  const res = await fetch(`${API_BASE}/teacher/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function apiTeacherPut(endpoint, id, data) {
  const res = await fetch(`${API_BASE}/teacher/${endpoint}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function apiTeacherDelete(endpoint, id) {
  const res = await fetch(`${API_BASE}/teacher/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return handleResponse(res)
}

/**
 * Скачивание Blob с авторизацией.
 */
async function fetchBlob(url) {
  const token = getToken()
  const res = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  })
  return handleBlobResponse(res)
}

export async function apiTeacherExportGrades(groupId, subjectId) {
  return fetchBlob(`${API_BASE}/teacher/export-grades?group_id=${groupId}&subject_id=${subjectId}`)
}

export async function apiTeacherExportAllGrades() {
  return fetchBlob(`${API_BASE}/teacher/export-all-grades`)
}

export async function apiTeacherExportAttendance(groupId, subjectId) {
  return fetchBlob(`${API_BASE}/teacher/export-attendance?group_id=${groupId}&subject_id=${subjectId}`)
}

export async function apiTeacherExportGroupSummary(groupId) {
  return fetchBlob(`${API_BASE}/teacher/export-group-summary?group_id=${groupId}`)
}

// ══════════════════════════════════════════════
// HELPERS — вспомогательные функции
// ══════════════════════════════════════════════

export function getAuthHeaders() {
  return getHeaders()
}

/**
 * Декодирование JWT токена (без проверки подписи).
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function getUserRole() {
  const token = getToken()
  if (!token) return null
  const payload = parseJwt(token)
  return payload?.role || null
}

export function isAuthenticated() {
  return Boolean(getToken())
}

/**
 * Скачивание Blob как файла.
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
