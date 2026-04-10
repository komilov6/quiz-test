import { useContext } from 'react'
import { ThemeContext } from '../App'

const Logo = () => {
  const { theme } = useContext(ThemeContext)
  
  return (
    <div className="flex items-center space-x-3">
      <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg border border-purple-200 dark:border-purple-900 group transition-all duration-300 hover:scale-105">
        <img 
          src="/logo.png" 
          alt="AI Quiz Master" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex flex-col">
        <span className={`font-black text-xl tracking-tight leading-none ${
          theme === 'dark' 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300' 
            : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600'
        }`}>
          AI Quiz Master
        </span>
        <span className={`text-[10px] uppercase tracking-widest font-bold ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Powered by Intelligence
        </span>
      </div>
    </div>
  )
}

export default Logo