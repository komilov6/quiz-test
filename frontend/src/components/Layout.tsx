import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, History, LogOut, User, Sun, Moon, X, Save, Eye, EyeOff, BookOpen, Instagram, Phone, Mail, Send } from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import api from '../services/api'
import Logo from './Logo'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSurname, setEditSurname] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      setEditName(parsed.name || '')
      setEditSurname(parsed.surname || '')
      setEditUsername(parsed.username || '')
      setEditPassword('')
    }
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editUsername.trim()) return
    
    setSaving(true)
    try {
      const updateData: any = { name: editName, surname: editSurname || '', username: editUsername }
      if (editPassword.trim()) {
        updateData.password = editPassword
      }
      const updated = await api.updateUser(user.id, updateData)
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setEditPassword('')
      setShowProfile(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const navItems = [
    { path: '/', label: 'Bosh sahifa', icon: Home },
    { path: '/quiz', label: 'Test yaratish', icon: FileText },
    { path: '/books', label: 'Kitoblar', icon: BookOpen },
    { path: '/history', label: 'Natijalarim', icon: History },
    { path: '/dashboard', label: 'Statistika', icon: User },
  ]

  if (!user && location.pathname !== '/') {
    navigate('/')
    return null
  }

  const isTestPage = location.pathname.startsWith('/results/')

  return (
    <div className={`min-h-screen w-full min-w-fit transition-colors ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {user && !isTestPage && (
        <nav className={`border-b shadow-lg ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
             <div className="flex justify-between h-16">
               <div className="flex items-center space-x-4">
                 <Logo />
               </div>
               <div className="flex space-x-8">
                 {navItems.map((item) => (
                   <Link
                     key={item.path}
                     to={item.path}
                     className={clsx(
                       'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition',
                       location.pathname === item.path
                         ? theme === 'dark'
                           ? 'border-purple-400 text-purple-400'
                           : 'border-purple-500 text-purple-600'
                         : theme === 'dark'
                           ? 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-200'
                           : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                     )}
                   >
                     <item.icon className="w-4 h-4 mr-2" />
                     {item.label}
                   </Link>
                 ))}
               </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className={clsx(
                    'p-2 rounded-lg transition',
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-yellow-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  )}
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowProfile(true)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition',
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
                  }`}>
                    <User className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
                  </div>
                  <span className="font-medium">{user.name}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition',
                    theme === 'dark'
                      ? 'text-red-400 hover:bg-red-900/30'
                      : 'text-red-600 hover:bg-red-50'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Profilni tahrirlash</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ism</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Familiya</label>
                <input
                  type="text"
                  value={editSurname}
                  onChange={(e) => setEditSurname(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yangi parol (ixtiyoriy)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Parolni o'zgartirmasdan qoldirish uchun bo'sh qoldiring"
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowProfile(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Bekor
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim() || !editUsername.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isTestPage && (
        <footer className={`mt-auto py-12 border-t ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* About */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Logo />
                  <span className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    AI Quiz Master
                  </span>
                </div>
                <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI yordamida bilimlaringizni tekshiring va rivojlantiring. 
                  Har bir fan bo'yicha testlar yarating va natijalaringizni kuzating.
                  Loyiha orqali o'z salohiyatingizni maksimal darajada oshiring.
                </p>
              </div>

              {/* Contact */}
              <div>
                <h4 className={`font-bold uppercase tracking-wider text-xs mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Bog'lanish
                </h4>
                <div className="space-y-3">
                  <a href="tel:+998337012686" className={`group flex items-center gap-3 text-sm transition ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition">
                      <Phone className="w-4 h-4" />
                    </div>
                    +998 33 701 26 86
                  </a>
                  <a href="mailto:komilovjahongir.22@gmail.com" className={`group flex items-center gap-3 text-sm transition ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">komilovjahongir.22@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Social */}
              <div>
                <h4 className={`font-bold uppercase tracking-wider text-xs mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Ijtimoiy tarmoqlar
                </h4>
                <div className="flex gap-3">
                  <a href="https://instagram.com/j.komilov__" target="_blank" rel="noopener noreferrer" 
                     className={`p-3 rounded-xl transition ${theme === 'dark' ? 'bg-gray-700 hover:bg-pink-600' : 'bg-gray-100 hover:bg-pink-100 hover:text-pink-600'} text-gray-600 dark:text-gray-300`}>
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://t.me/KomilovJahongir_bot" target="_blank" rel="noopener noreferrer"
                     className={`p-3 rounded-xl transition ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-600' : 'bg-gray-100 hover:bg-blue-100 hover:text-blue-600'} text-gray-600 dark:text-gray-300`}>
                    <Send className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className={`mt-10 pt-8 border-t text-center text-sm font-medium ${
              theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'
            }`}>
              © {new Date().getFullYear()} AI Quiz Master • Barcha huquqlar himoyalangan
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout
