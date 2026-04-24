import { useState, useEffect, useContext } from 'react'
import { Users, FileQuestion, Trophy, TrendingUp } from 'lucide-react'
import { ThemeContext } from '../App'
import api from '../services/api'

const Dashboard = () => {
  const { theme } = useContext(ThemeContext)
  const [stats, setStats] = useState({
    total_quizzes: 0,
    total_users: 0,
    average_score: 0,
    top_scores: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const statsData = await api.getDashboardStats()
      setStats(statsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isCurrentUser = (userId: number) => {
    return currentUser.id === userId
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Yuklanmoqda...
      </div>
    )
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-800'
      }`}>Statistika</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`rounded-xl shadow-lg p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Users className={`w-6 h-6 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Foydalanuvchilar</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <FileQuestion className={`w-6 h-6 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Jami testlar</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{stats.total_quizzes}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>O'rtacha natija</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{stats.average_score}%</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
            }`}>
              <Trophy className={`w-6 h-6 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Eng yaxshi</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {stats.top_scores.length > 0 ? Math.max(...stats.top_scores.map((s: any) => s.percentage)) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl shadow-lg p-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>So'nggi natijalar</h2>
        {stats.top_scores.length === 0 ? (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Hali natijalar yo'q
          </p>
        ) : (
          <div className="space-y-3">
            {stats.top_scores.map((score: any, index: number) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                    index === 0 ? theme === 'dark' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600' :
                    index === 2 ? theme === 'dark' ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600' :
                    theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{score.topic}</p>
                    <p className={`text-sm ${isCurrentUser(score.user_id) ? 'text-purple-600 dark:text-purple-400 font-medium' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isCurrentUser(score.user_id) ? 'Siz: ' : ''}{score.user_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{score.percentage}%</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{score.score} / {score.total}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
