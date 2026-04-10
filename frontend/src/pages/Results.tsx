import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, AlertCircle, Lightbulb, Loader2, Instagram, Send, Phone } from 'lucide-react'
import api from '../services/api'

const Results = () => {
  const { id } = useParams()
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
    if (submitted && result && id) {
      loadRecommendations()
    }
  }, [submitted, result])

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
      await api.getRecommendations(parseInt(id))
      // Recommendations are handled automatically when result is loaded
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
      const res = await api.submitQuiz(parseInt(id!), answers)
      setResult(res)
      setSubmitted(true)
      setShowWarning(false)
    } catch (err) {
      console.error(err)
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
  const wrongQuestions = result?.wrongQuestions || []

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
              <p className="text-sm text-gray-500 dark:text-gray-400">Javob berildi</p>
              <p className={`font-bold ${unansweredCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {answers.filter(a => a >= 0).length} / {answers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      answers[qIndex] === oIndex
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mr-3 ${
                      answers[qIndex] === oIndex
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Footer with Question Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Question squares */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {quiz.questions.map((_: any, qIndex: number) => (
              <button
                key={qIndex}
                onClick={() => {
                  const element = questionRefs.current[qIndex]
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                className={`w-9 h-9 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                  answers[qIndex] >= 0
                    ? 'bg-green-500 text-white'
                    : showWarning
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {qIndex + 1}
              </button>
            ))}
          </div>
          
          {/* Submit button */}
            <button
              onClick={handleSubmit}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-medium rounded-lg transition ${
                unansweredCount === 0
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {unansweredCount === 0 ? (
                <>
                  Natijalarni ko'rish
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  {unansweredCount} ta savolga javob bering
                </>
              )}
            </button>
        </div>
      </div>

      {/* Footer for completed results */}
      {submitted && (
        <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} AI Quiz Master
                </p>
              </div>
              <div className="flex gap-4">
                <a href="https://instagram.com/j.komilov__" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900 transition">
                  <Instagram className="w-5 h-5 text-gray-700 dark:text-white" />
                </a>
                <a href="https://t.me/KomilovJahongir_bot" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition">
                  <Send className="w-5 h-5 text-gray-700 dark:text-white" />
                </a>
                <a href="tel:+998337012686" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900 transition">
                  <Phone className="w-5 h-5 text-gray-700 dark:text-white" />
                </a>
                <a href="mailto:komilovjahongir.22@gmail.com" className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:text-purple-500">
                  komilovjahongir.22@gmail.com
                </a>
              </div>
            </div>
            
            {/* Tavsiyalar */}
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <Lightbulb className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tavsiyalar:</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      {percentage >= 80
                        ? "Mavzusini tuttug'iz! Keyingi darajada murakkab mavzularga o'ting va loyiha bastiring."
                        : percentage >= 60
                        ? "Yaxshi natija! Noto'g'ri javoblaringizni tarkib tayyorlash va ularni qayta o'rganing."
                        : "Asosiy tushunchalarni qayta o'qish, video darslarni ko'rish va har kuni 10-15 daqiqaga test bajarishingiz tavsiya etiladi."
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-3">
                  Noto'g'ri javob berilgan savollar:
                </h3>
                {wrongQuestions.map((q: any, index: number) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium mb-2">
                      Savol {index + 1}: {q.question}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sizning javobingiz: {q.options[q.selectedAnswer]}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To'g'ri javob: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Results