import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

interface Result {
  id: number
  topic_name: string
  score: number
  total: number
  percentage: number
  completed_at: string
}

const History = () => {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const data = await api.getUserResults(user.id)
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-600 dark:text-gray-400">Yuklanmoqda...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Natijalarim</h1>

      {results.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Hali natijalar yo'q</p>
          <button
            onClick={() => navigate('/quiz')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Test ishlash
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Mavzu</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Ball</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Natija</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{result.topic_name}</td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 dark:text-green-400 font-bold">{result.score}</span>
                    <span className="text-gray-400 dark:text-gray-500"> / {result.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {result.percentage >= 60 ? (
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                      )}
                      <span className={`font-bold ${
                        result.percentage >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {result.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(result.completed_at).toLocaleDateString('uz-UZ')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default History
