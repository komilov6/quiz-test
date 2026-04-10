import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Book, BookOpen, GraduationCap, Code, Calculator, Landmark, Atom, ChevronRight, Search, Layers, X, Play, FileText } from 'lucide-react'
import { ThemeContext } from '../App'
import api from '../services/api'

const iconMap: any = {
  'book-open': BookOpen,
  'code': Code,
  'calculator': Calculator,
  'graduation-cap': GraduationCap,
  'landmark': Landmark,
  'atom': Atom,
}

const Books = () => {
  const { theme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [catsData, booksData] = await Promise.all([
        api.getCategories(),
        api.getBooks()
      ])
      setCategories(catsData)
      setBooks(booksData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = books.filter(book => {
    if (!book.pdf_path) return false
    const matchesCategory = !selectedCategory || book.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleTakeTest = () => {
    navigate('/quiz', { state: { 
      topic_name: selectedBook.title,
      book_id: selectedBook.id,
      category: selectedBook.category_name 
    }})
  }

  const handleReadPDF = () => {
    const pdfUrl = `${import.meta.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/books/${selectedBook.pdf_path}`
    window.open(pdfUrl, '_blank')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          📚 Kitoblar kutubxonasi
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          O'zingizga yoqqan kitobni tanlang va mavzuni o'rganib, test yeching
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Kitob yoki muallifni qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
            selectedCategory === null
              ? 'bg-purple-600 text-white'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Hammasi
        </button>
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Book
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
              {cat.name}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {selectedCategory && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color + '20' }}>
              <h2 className="text-xl font-semibold" style={{ color: categories.find(c => c.id === selectedCategory)?.color }}>
                {categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {categories.find(c => c.id === selectedCategory)?.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const category = categories.find(c => c.id === book.category_id)
              const IconComponent = iconMap[category?.icon] || Book
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={`group cursor-pointer rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-750 border-gray-700'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  } border`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: (category?.color || '#6366f1') + '20' }}
                    >
                      <IconComponent 
                        className="w-7 h-7" 
                        style={{ color: category?.color || '#6366f1' }} 
                      />
                    </div>
                    {book.level && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {book.level}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-semibold mb-2 line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {book.title}
                  </h3>

                  {book.author && (
                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {book.author}
                    </p>
                  )}

                  {book.description && (
                    <p className={`text-sm mb-4 line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {book.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Book className="w-4 h-4" />
                      {book.pages} bet
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      Batafsil
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div className={`text-center py-12 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <Book className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                Hech qanday kitob topilmadi
              </p>
            </div>
          )}
        </>
      )}

      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-lg w-full rounded-2xl shadow-2xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  {(() => {
                    const category = categories.find(c => c.id === selectedBook.category_id)
                    const IconComponent = iconMap[category?.icon] || Book
                    return (
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: (category?.color || '#6366f1') + '20' }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          style={{ color: category?.color || '#6366f1' }} 
                        />
                      </div>
                    )
                  })()}
                  <div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {selectedBook.title}
                    </h2>
                    {selectedBook.author && (
                      <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedBook.author}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {selectedBook.level && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedBook.level}
                        </span>
                      )}
                      {selectedBook.pages && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedBook.pages} bet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedBook.description && (
                <div className="mb-6">
                  <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tavsif
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {selectedBook.description}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBook(null)}
                  className={`flex-1 px-4 py-3 rounded-lg transition ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yopish
                </button>
                <button
                  onClick={handleReadPDF}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition ${
                    theme === 'dark'
                      ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70 border border-green-800'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  PDF o'qish
                </button>
                <button
                  onClick={handleTakeTest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
                >
                  <Play className="w-5 h-5" />
                  Test yechish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Books
