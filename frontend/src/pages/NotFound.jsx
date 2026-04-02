import React from 'react'
import Header from '../components/Header'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div>
      <Header />
      <div className="p-8">
        <h1 className="text-2xl font-bold">404 — Страница не найдена</h1>
        <p className="mt-2">Страница, которую вы ищете, не существует. Вернитесь к входу:</p>
        <Link to="/login" className="text-blue-400 mt-2 inline-block">Перейти к входу</Link>
      </div>
    </div>
  )
}
