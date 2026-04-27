import { useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Loader2, FileText, Type, Brain, Zap } from 'lucide-react'
import { ThemeContext } from '../App'
import api from '../services/api'

const QuizPage = () => {
  const { theme } = useContext(ThemeContext)
  const location = useLocation()
  const [topicName, setTopicName] = useState('')
  const [topicContent, setTopicContent] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium')
  const [contentType, setContentType] = useState<'text' | 'file'>('text')
  const [aiMode, setAiMode] = useState<'auto' | 'manual'>('auto')
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.topic_name) {
      setTopicName(location.state.topic_name)
      setAiMode('auto')
    }
  }, [location])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileLoading(true)
      setError('')
      try {
        const result = await api.extractText(file)
        setTopicContent(result.text || '')
        if (!result.text) {
          setError('Fayldan matnni ajratib bo\'lmadi')
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Faylni o\'qishda xatolik yuz berdi')
      } finally {
        setFileLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topicName.trim()) {
      setError('Iltimos, mavzu nomini kiriting')
      return
    }
    
    if (aiMode === 'manual' && !topicContent.trim()) {
      setError('Iltimos, mavzu ma\'lumotini kiriting')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const quiz = await api.generateQuiz({
        topic_name: topicName,
        topic_content: aiMode === 'auto' ? '' : topicContent,
        question_count: questionCount,
        difficulty: difficulty,
        user_id: user.id
      })
      
      localStorage.setItem('currentQuiz', JSON.stringify(quiz))
      navigate(`/results/${quiz.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className={`rounded-xl shadow-lg p-8 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'
          }`}>
            <Sparkles className={`w-6 h-6 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Test yaratish</h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Mavzu tanlang va AI sizga test tayyorlaydi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Mavzu nomi</label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Masalan: Python dasturlash tili"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Savollar soni</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              />
              <span className={`w-12 text-center font-medium ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`}>{questionCount}</span>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Qiyinlik darajasi</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDifficulty('easy')}
                className={`p-3 rounded-lg border-2 transition font-medium ${
                  difficulty === 'easy'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-400 hover:border-green-500/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                Oson
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('medium')}
                className={`p-3 rounded-lg border-2 transition font-medium ${
                  difficulty === 'medium'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-400 hover:border-yellow-500/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-yellow-300'
                }`}
              >
                O'rtacha
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('hard')}
                className={`p-3 rounded-lg border-2 transition font-medium ${
                  difficulty === 'hard'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-400 hover:border-orange-500/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                }`}
              >
                Qiyin
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('expert')}
                className={`p-3 rounded-lg border-2 transition font-medium ${
                  difficulty === 'expert'
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-400 hover:border-purple-500/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                }`}
              >
                Expert
              </button>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30'
              : 'bg-gradient-to-r from-purple-50 to-blue-50'
          }`}>
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Test yaratish rejimi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAiMode('manual')}
                className={`p-4 rounded-lg border-2 transition ${
                  aiMode === 'manual'
                    ? theme === 'dark'
                      ? 'border-purple-400 bg-gray-700 shadow-md'
                      : 'border-purple-500 bg-white shadow-md'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 hover:border-purple-400'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${
                  aiMode === 'manual'
                    ? theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <p className={`font-medium ${
                  aiMode === 'manual'
                    ? theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Mavzu bilan</p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>Material kiritaman</p>
              </button>
              
              <button
                type="button"
                onClick={() => setAiMode('auto')}
                className={`p-4 rounded-lg border-2 transition ${
                  aiMode === 'auto'
                    ? theme === 'dark'
                      ? 'border-blue-400 bg-gray-700 shadow-md'
                      : 'border-blue-500 bg-white shadow-md'
                    : theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 hover:border-blue-400'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Brain className={`w-6 h-6 mx-auto mb-2 ${
                  aiMode === 'auto'
                    ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <p className={`font-medium ${
                  aiMode === 'auto'
                    ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>AI yaratsin</p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>O'zi test tuzadi</p>
              </button>
            </div>
          </div>

          {aiMode === 'manual' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Mavzu ma'lumoti</label>
              
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setContentType('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    contentType === 'text' 
                      ? theme === 'dark'
                        ? 'bg-purple-900/50 text-purple-400'
                        : 'bg-purple-100 text-purple-600' 
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Matn
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    contentType === 'file' 
                      ? theme === 'dark'
                        ? 'bg-purple-900/50 text-purple-400'
                        : 'bg-purple-100 text-purple-600' 
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Fayl
                </button>
              </div>

              {contentType === 'text' ? (
                <div className="relative">
                  <textarea
                    value={topicContent}
                    onChange={(e) => setTopicContent(e.target.value)}
                    maxLength={4000}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[180px] pb-10 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="Mavzu bo'yicha ma'lumotlarni shu yerga yozing (matn qanchalik aniq bo'lsa, test shunchalik sifatli bo'ladi)..."
                  />
                  <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-bold shadow-sm ${
                    topicContent.length >= 3800 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {topicContent.length.toLocaleString()} / 4,000 belgi
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  theme === 'dark'
                    ? 'border-gray-600 hover:border-purple-500/50'
                    : 'border-gray-300 hover:border-purple-500/50'
                }`}>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={fileLoading}
                  />
                  <label htmlFor="file-upload" className={`cursor-pointer ${fileLoading ? 'opacity-50 cursor-wait' : ''}`}>
                    {fileLoading ? (
                      <div className="py-4">
                        <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin text-purple-500" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Fayl tahlil qilinmoqda...
                        </p>
                      </div>
                    ) : (
                      <>
                        <FileText className={`w-10 h-10 mx-auto mb-2 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Fayl yuklash uchun bosing
                        </p>
                        <p className={`text-sm mt-1 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>txt, pdf, doc, docx</p>
                      </>
                    )}
                  </label>
                  {topicContent && !fileLoading && (
                    <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-left">
                      <p className={`text-sm flex items-center gap-2 ${
                        theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      }`}>
                        <span className="font-bold">✓ Matn yuklandi:</span>
                        {topicContent.substring(0, 100)}...
                      </p>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Jami: {topicContent.length.toLocaleString()} belgi
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {aiMode === 'auto' && (
            <div className={`rounded-lg p-4 ${
              theme === 'dark'
                ? 'bg-blue-900/30 border border-blue-800'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <Zap className={`w-5 h-5 mt-0.5 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                  }`}>AI o'zi test yaratadi</p>
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    Siz faqat mavzu nomini kiriting. AI o'zi mavzu bo'yicha savollar yaratadi va testni tayyorlaydi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className={`text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/20 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-500'
            }`}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || fileLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI javob kutmoqda (bu 1-3 daqiqa davom etishi mumkin)...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {aiMode === 'auto' ? 'AI bilan test yaratish' : 'Test yaratish'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default QuizPage
