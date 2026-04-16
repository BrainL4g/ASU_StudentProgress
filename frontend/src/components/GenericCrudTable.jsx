/**
 * GenericCrudTable — универсальная таблица для админки с пагинацией.
 * 
 * Props:
 * - columns: [{ key, label, render? }]
 * - data: Array
 * - onEdit: (item) => void
 * - onDelete: (item) => void
 * - onProcess: (item) => void
 * - loading: boolean
 * - emptyText: string
 * - pageSize: number (default 15)
 */

import React, { useState, useMemo } from 'react'

export default function GenericCrudTable({
  columns,
  data = [],
  onEdit,
  onDelete,
  onProcess,
  loading = false,
  emptyText = 'Нет данных',
  primaryKey = 'id',
  pageSize = 15,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const handleFilter = (val) => {
    setFilter(val)
    setPage(0)
  }

  const processedData = useMemo(() => {
    let result = [...data]

    if (filter.trim()) {
      const f = filter.toLowerCase()
      result = result.filter(item =>
        columns.some(col => {
          const val = item[col.key]
          if (val != null && typeof val === 'object') {
            return JSON.stringify(val).toLowerCase().includes(f)
          }
          return val != null && String(val).toLowerCase().includes(f)
        })
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, filter, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pagedData = processedData.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const hasActions = onEdit || onDelete || onProcess

  return (
    <div>
      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={e => handleFilter(e.target.value)}
          placeholder="Поиск..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="pb-3 pr-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="pb-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  Загрузка...
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pagedData.map(item => (
                <tr key={item[primaryKey]} className="border-b border-gray-100 dark:border-dark-border/50 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-input/50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                      {col.render 
                        ? col.render(item[col.key], item) 
                        : (typeof item[col.key] === 'object' && item[col.key] !== null)
                          ? JSON.stringify(item[col.key])
                          : (item[col.key] ?? '—')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                          >
                            Изменить
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item[primaryKey])}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Удалить
                          </button>
                        )}
                        {onProcess && (
                          <button
                            onClick={() => onProcess(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Обработать
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, processedData.length)} из {processedData.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-dark-input disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              «
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-dark-input disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i
              else if (safePage < 3) p = i
              else if (safePage > totalPages - 4) p = totalPages - 5 + i
              else p = safePage - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    p === safePage
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 dark:bg-dark-input hover:bg-gray-200 dark:hover:bg-dark-border'
                  }`}
                >
                  {p + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-dark-input disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-dark-input disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
