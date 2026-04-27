import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, Lightbulb, Loader2, Instagram, Send, Phone, Home, RefreshCw, CheckCircle, XCircle, Mail } from 'lucide-react'
import api from '../services/api'

const Results = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [firstUnanswered, setFirstUnanswered] = useState<number | null>(null)
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    loadQuiz()
  }, [id])

  useEffect(() => {
    if (submitted && id) {
      loadRecommendations()
    }
  }, [submitted])

  useEffect(() => {
    if (showWarning && firstUnanswered !== null) {
      const element = questionRefs.current[firstUnanswered]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [showWarning, firstUnanswered])

  const loadRecommendations = async () => {
    if (!id) return
    try {
      const recData = await api.getRecommendations(parseInt(id))
      setResult((prev: any) => ({ ...prev, recommendations: recData.recommendations }))
    } catch (err) {
      console.error('Recommendations error:', err)
    }
  }

  const loadQuiz = async () => {
    try {
      const data = await api.getQuiz(parseInt(id!))
      setQuiz(data)
      if (data.status === 'completed') {
        setSubmitted(true)
        setResult(data)
        if (data.answers) {
          setAnswers(data.answers)
        }
      } else {
        setAnswers(new Array(data.questions?.length || 0).fill(-1))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = optionIndex
    setAnswers(newAnswers)
    setShowWarning(false)
    setFirstUnanswered(null)
  }

  const handleSubmit = async () => {
    const unansweredCount = answers.filter(a => a === -1).length
    
    if (unansweredCount > 0) {
      const firstUnansweredIndex = answers.findIndex(a => a === -1)
      setFirstUnanswered(firstUnansweredIndex)
      setShowWarning(true)
      return
    }
    
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      console.log('Submitting quiz:', id, answers, user.id)
      const data = await api.submitQuiz(parseInt(id!), answers, user.id)
      console.log('Quiz submitted, data received:', data)
      setQuiz(data)
      setResult(data)
      setSubmitted(true)
      setShowWarning(false)
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <p className="text-lg">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return <div className="text-gray-600 dark:text-gray-400">Test topilmadi</div>
  }

  const score = result?.score || 0
  const unansweredCount = answers.filter(a => a === -1).length
  const total = result?.total || quiz.question_count
  const percentage = result?.percentage || ((score / total) * 100 || 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">{quiz.topic_name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.question_count} ta savol</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{submitted ? 'Natija' : 'Javob berildi'}</p>
              <p className={`font-bold ${unansweredCount > 0 && !submitted ? 'text-orange-500' : 'text-green-500'}`}>
                {submitted ? `${Math.round(percentage)}%` : `${answers.filter(a => a >= 0).length} / ${answers.length}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Hero Section */}
      {submitted && (
        <div className="max-w-3xl mx-auto px-4 py-8 text-center bg-white dark:bg-gray-800 rounded-b-2xl shadow-lg border-x border-b dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mb-4">
             <span className="text-3xl font-bold">{Math.round(percentage)}%</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sizning natijangiz: {score} / {total}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
             {percentage >= 80 ? 'Ajoyib natija!' : percentage >= 60 ? 'Yaxshi, lekin yana harakat qilish kerak!' : 'Ko\'proq shug\'ullanish tavsiya etiladi.'}
          </p>
          
          {/* Tavsiyalar - TOP */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-left">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base mb-1">AI Shaxsiy maslahati:</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {percentage >= 80
                    ? "Mavzusini tuttug'iz! Keyingi darajada murakkab mavzularga o'ting va loyiha bastiring."
                    : percentage >= 60
                    ? "Yaxshi natija! Noto'g'ri javoblaringizni tarkib tayyorlash va ularni qayta o'rganing."
                    : "Asosiy tushunchalarni qayta o'qish, video darslarni ko'rish va har kuni 10-15 daqiqaga test bajarishingiz tavsiya etiladi."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => navigate('/quiz')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-2xl transition-all font-bold shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 active:scale-95"
            >
              <RefreshCw className="w-6 h-6" />
              Yangi test yaratish
            </button>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 py-4">
            {showWarning && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400">
                  {unansweredCount} ta savolga javob bermadingiz! Iltimos, barcha savollarga javob bering.
                </p>
              </div>
            )}

        <div className="space-y-4">
          {quiz.questions.map((q: any, qIndex: number) => (
            <div 
              key={qIndex} 
              ref={el => questionRefs.current[qIndex] = el}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all ${
                showWarning && answers[qIndex] === -1 
                  ? 'ring-2 ring-red-500 dark:ring-red-400' 
                  : ''
              }`}
            >
              <h3 className="font-medium text-lg mb-4 text-gray-800 dark:text-white">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-sm font-bold mr-3">
                  {qIndex + 1}
                </span>
                {q.question}
              </h3>
              <div className="space-y-2">
                {q.options.map((option: string, oIndex: number) => (
                  <button
                    key={oIndex}
                    onClick={() => handleAnswer(qIndex, oIndex)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition flex items-center ${
                      submitted
                        ? oIndex === q.correct_answer
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : oIndex === q.user_answer
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        : answers[qIndex] === oIndex
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                      submitted
                        ? oIndex === q.correct_answer
                          ? 'bg-green-600 text-white'
                          : oIndex === q.user_answer
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
                        : answers[qIndex] === oIndex
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className={`flex-1 text-lg ${
                      submitted 
                        ? oIndex === q.correct_answer 
                          ? 'text-green-800 dark:text-green-200 font-bold' 
                          : oIndex === q.user_answer 
                            ? 'text-red-800 dark:text-red-200 font-semibold' 
                            : 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>{option}</span>
                    {submitted && oIndex === q.correct_answer && (
                      <CheckCircle className="w-6 h-6 text-green-600 ml-2" />
                    )}
                    {submitted && oIndex === q.user_answer && oIndex !== q.correct_answer && (
                      <XCircle className="w-6 h-6 text-red-600 ml-2" />
                    )}
                  </button>
                ))}
              </div>
              
              {submitted && q.explanation && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 rounded-r-lg text-sm">
                  <p className="font-bold text-yellow-800 dark:text-yellow-400 mb-1 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" /> AI Izohi:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {!submitted ? (
            <>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {quiz.questions.map((_: any, qIndex: number) => (
                  <button
                    key={qIndex}
                    onClick={() => {
                      const element = questionRefs.current[qIndex]
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className={`w-9 h-9 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                      answers[qIndex] >= 0 ? 'bg-green-500 text-white' : showWarning ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {qIndex + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 font-medium rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
              >
                {unansweredCount === 0 ? <>Natijalarni ko'rish <ArrowRight className="w-5 h-5" /></> : <><AlertCircle className="w-5 h-5" /> {unansweredCount} ta savolga javob bering</>}
              </button>
            </>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <Home className="w-5 h-5" />
                Bosh sahifa
              </button>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
              >
                Tepaga qaytish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer for completed results */}
      {submitted && (
        <footer className="mt-16 py-10 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col items-center space-y-8">
              {/* Social Icons */}
              <div className="flex flex-wrap justify-center gap-6">
                <a href="https://t.me/KomilovJahongir_bot" target="_blank" rel="noopener noreferrer" 
                   className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-all hover:-translate-y-1">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Telegram</span>
                </a>
                
                <a href="https://instagram.com/j.komilov__" target="_blank" rel="noopener noreferrer"
                   className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-md hover:shadow-pink-500/10 transition-all hover:-translate-y-1">
                  <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Instagram</span>
                </a>

                <a href="tel:+998337012686"
                   className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-md hover:shadow-green-500/10 transition-all hover:-translate-y-1">
                  <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Bog'lanish</span>
                </a>

                <a href="mailto:komilovjahongir.22@gmail.com"
                   className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm hover:shadow-md hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Gmail</span>
                </a>
              </div>

              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                  © {new Date().getFullYear()} AI Quiz Master • Barcha huquqlar himoyalangan
                </p>
              </div>
            </div>
            
{/* Bottom Back Button */}
            <div className="mt-10 mb-20 text-center">
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-700 dark:to-gray-600 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl"
              >
                <Home className="w-6 h-6" />
                Bosh menyuga qaytish
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Results