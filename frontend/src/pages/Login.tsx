import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sun, Moon, LogIn, UserPlus, Eye, EyeOff, Instagram, Send, Phone, Mail } from 'lucide-react'
import { ThemeContext } from '../App'
import api from '../services/api'

const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { theme, toggleTheme } = useContext(ThemeContext)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      navigate('/')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'register') {
      if (!name.trim() || !surname.trim() || !username.trim() || !password.trim()) {
        setError('Barcha maydonlarni to\'ldiring')
        return
      }
      if (password.length < 4) {
        setError('Parol kamida 4 belgidan iborat bo\'lishi kerak')
        return
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError('Username va parolni kiriting')
        return
      }
    }
    
    setLoading(true)
    setError('')
    
    try {
      let user;
      if (mode === 'register') {
        user = await api.createUser({ name, surname, username, password })
      } else {
        user = await api.login({ username, password })
      }
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/quiz')
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Xatolik yuz berdi. Qayta urinib ko\'ring.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex flex-col p-4 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600'
    }`}>
      <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg border-2 border-purple-200 dark:border-purple-800">
            <img src="/logo.png" alt="AI Quiz Master" className="w-full h-full object-cover" />
          </div>
          <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600'}`}>
            AI Quiz Master
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Bilimlaringizni sinab ko'ring
          </p>
        </div>

         <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
           <button
             onClick={() => { setMode('login'); setError(''); }}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition ${
               mode === 'login' 
                 ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' 
                 : 'text-gray-500 dark:text-gray-400'
             }`}
           >
             <LogIn className="w-4 h-4" />
             Kirish
           </button>
           <button
             onClick={() => { setMode('register'); setError(''); }}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition ${
               mode === 'register' 
                 ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' 
                 : 'text-gray-500 dark:text-gray-400'
             }`}
           >
             <UserPlus className="w-4 h-4" />
             Ro'yxatdan o'tish
           </button>
         </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Ism</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  placeholder="Ismingizni kiriting"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Familiya</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  placeholder="Familiyangizni kiriting"
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Username kiriting"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Parol</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="Parolni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              'Kuting...'
            ) : mode === 'login' ? (
              <>Kirish <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Ro'yxatdan o'tish <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
      </div>

      {/* Footer */}
      <footer className="w-full pb-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-4">
            <a href="https://instagram.com/j.komilov__" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a href="https://t.me/KomilovJahongir_bot" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
              <Send className="w-5 h-5 text-white" />
            </a>
            <a href="tel:+998337012686" className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
              <Phone className="w-5 h-5 text-white" />
            </a>
             <a href="mailto:komilovjahongir.22@gmail.com" className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
              <Mail className="w-5 h-5 text-white" />
            </a>
          </div>
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} AI Quiz Master. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Login
