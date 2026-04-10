import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileText, History, Trophy, ArrowRight } from 'lucide-react'
import { ThemeContext } from '../App'

const Home = () => {
  const navigate = useNavigate()
  const { theme } = useContext(ThemeContext)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const features = [
    {
      icon: Sparkles,
      title: 'AI bilan test',
      description: 'AI sizga mavzu bo\'yicha avtomatik test yaratadi',
      path: '/quiz',
      color: 'purple'
    },
    {
      icon: History,
      title: 'Natijalarim',
      description: 'Oldingi test natijalarini ko\'ring',
      path: '/history',
      color: 'blue'
    },
    {
      icon: Trophy,
      title: 'Statistika',
      description: 'Umumiy statistika va reyting',
      path: '/dashboard',
      color: 'green'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          Assalom, {user.name} {user.surname}!
        </h1>
        <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Bilimlaringizni sinab ko'rish uchun test yarating
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => (
          <button
            key={feature.path}
            onClick={() => navigate(feature.path)}
            className={`rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition group ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'
            }`}>
              <feature.icon className={`w-6 h-6 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              {feature.title}
              <ArrowRight className={`w-4 h-4 transition ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              } opacity-0 group-hover:opacity-100`} />
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {feature.description}
            </p>
          </button>
        ))}
      </div>

      <div className={`rounded-2xl p-8 text-center ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-purple-800 to-blue-800'
          : 'bg-gradient-to-r from-purple-600 to-blue-600'
      }`}>
        <h2 className="text-2xl font-bold text-white mb-4">Test yaratishni boshlash</h2>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-purple-200' : 'text-purple-100'
        }`}>
          Mavzuni tanlang va AI sizga savollarni tayyorlaydi
        </p>
        <button
          onClick={() => navigate('/quiz')}
          className={`inline-flex items-center gap-2 px-8 py-4 font-bold rounded-lg transition ${
            theme === 'dark'
              ? 'bg-white text-purple-700 hover:bg-purple-100'
              : 'bg-white text-purple-600 hover:bg-purple-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          Test yaratish
        </button>
      </div>
    </div>
  )
}

export default Home
