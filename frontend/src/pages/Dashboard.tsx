import { useState, useEffect, useContext } from 'react'
import { Users, FileQuestion, Trophy, TrendingUp, Clock, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeContext } from '../App'
import api from '../services/api'

const Dashboard = () => {
  const { theme } = useContext(ThemeContext)
  const [stats, setStats] = useState({
    total_quizzes: 0,
    total_users: 0,
    average_score: 0,
    top_scores: [] as any[],
    recent_results: [] as any[]
  })
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Tab almashganda 1-betga qaytish
  }, [activeTab])

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

  const displayScores = activeTab === 'recent' ? stats.recent_results : stats.top_scores
  const totalPages = Math.ceil(displayScores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedScores = displayScores.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className={`text-3xl font-extrabold mb-8 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Statistika</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className={`rounded-2xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Foydalanuvchilar</p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Jami testlar</p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total_quizzes}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>O'rtacha natija</p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.average_score}%</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl shadow-sm p-6 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
            }`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Eng yaxshi</p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stats.top_scores.length > 0 ? stats.top_scores[0].percentage : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl shadow-xl border overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center gap-3 py-5 font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'recent'
                ? 'text-purple-600 border-b-4 border-purple-600 bg-white dark:bg-gray-800'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="w-5 h-5" />
            So'nggi natijalar
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 flex items-center justify-center gap-3 py-5 font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'top'
                ? 'text-yellow-600 border-b-4 border-yellow-600 bg-white dark:bg-gray-800'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Top Natijalar
          </button>
        </div>

        <div className="p-8">
          {paginatedScores.length === 0 ? (
            <div className="text-center py-16">
              <List className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Hali natijalar yo'q
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedScores.map((score: any, index: number) => (
                <div key={index} className={`group flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-gray-700/40 hover:bg-gray-700 shadow-inner' : 'bg-gray-50 hover:bg-white hover:shadow-md'
                }`}>
                  <div className="flex items-center gap-5">
                    <span className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-lg ${
                      (startIndex + index === 0 && activeTab === 'top') ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/30' :
                      (startIndex + index === 1 && activeTab === 'top') ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30' :
                      (startIndex + index === 2 && activeTab === 'top') ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30' :
                      theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-500 shadow-sm border border-gray-100'
                    }`}>
                      {startIndex + index + 1}
                    </span>
                    <div>
                      <p className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{score.topic}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                          isCurrentUser(score.user_id) 
                            ? 'bg-purple-500 text-white shadow-sm' 
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {isCurrentUser(score.user_id) ? 'Siz' : score.user_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black italic tracking-tighter ${
                      score.percentage >= 80 ? 'text-green-500' :
                      score.percentage >= 50 ? 'text-blue-500' : 'text-orange-500'
                    }`}>{score.percentage}%</p>
                    <p className={`text-sm font-bold mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {score.score} / {score.total}
                    </p>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                      currentPage === 1 
                        ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400' 
                        : theme === 'dark'
                          ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white'
                          : 'border-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white shadow-sm'
                    }`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span className="hidden md:inline">Oldingi</span>
                  </button>
                  
                  <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-12 h-12 rounded-xl font-black transition-all transform hover:scale-110 ${
                          currentPage === i + 1
                            ? 'bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-600/40 ring-4 ring-purple-500/20'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 border-2 border-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                      currentPage === totalPages 
                        ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400' 
                        : theme === 'dark'
                          ? 'border-purple-500/30 text-purple-400 hover:bg-purple-50 hover:text-purple-white'
                          : 'border-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white shadow-sm'
                    }`}
                  >
                    <span className="hidden md:inline">Keyingi</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
