/**
 * GenericCrudForm — универсальная форма для создания/редактирования.
 * 
 * Props:
 * - fields: [{ key, label, type?, options?, required? }]
 * - initialValues: object
 * - onSubmit: (values) => void
 * - onCancel: () => void
 * - loading: boolean
 * - title: string
 */

import React, { useState, useEffect } from 'react'

export default function GenericCrudForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  title = '',
}) {
  const [values, setValues] = useState({})

  // Сброс формы при изменении initialValues
  useEffect(() => {
    const defaults = {}
    fields.forEach(f => {
      defaults[f.key] = initialValues[f.key] ?? f.default ?? (f.type === 'number' ? 0 : '')
    })
    setValues(defaults)
  }, [initialValues, fields])

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}

      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'select' ? (
            <select
              value={values[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value === '' ? null : Number(e.target.value))}
              required={field.required}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">— Выберите —</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={values[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value)}
              required={field.required}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={values[field.key] ?? ''}
              onChange={e => {
                const val = field.type === 'number' ? Number(e.target.value) : e.target.value
                handleChange(field.key, val)
              }}
              required={field.required}
              step={field.type === 'number' ? (field.step || 'any') : undefined}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-input transition-colors text-sm"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}
