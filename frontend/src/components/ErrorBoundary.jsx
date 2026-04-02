/**
 * ErrorBoundary — перехват ошибок рендеринга React.
 * Оборачивает всё приложение в main.jsx.
 */

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
          <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-input text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
              >
                Повторить
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Обновить страницу
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-6 text-xs text-left bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto text-red-600 dark:text-red-400 max-h-48">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
