import axios from 'axios'

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const api = {
  async createUser(data: { name: string; surname: string; username: string; password: string }) {
    const response = await client.post('/api/v1/register', data)
    return response.data
  },

  async login(data: { username: string; password: string }) {
    const response = await client.post('/api/v1/login', data)
    return response.data
  },

  async getUser(userId: number) {
    const response = await client.get(`/api/v1/users/${userId}`)
    return response.data
  },

  async updateUser(userId: number, data: { name: string; surname: string }) {
    const response = await client.put(`/api/v1/users/${userId}`, data)
    return response.data
  },

  async generateQuiz(data: { topic_name: string; topic_content: string; question_count: number; difficulty: string; user_id?: number }) {
    const response = await client.post('/api/v1/generate-quiz', data)
    return response.data
  },

  async getQuiz(quizId: number) {
    const response = await client.get(`/api/v1/quiz/${quizId}`)
    return response.data
  },

  async submitQuiz(quizId: number, answers: number[], userId: number) {
    const response = await client.post('/api/v1/submit-quiz', {
      quiz_id: quizId,
      answers: answers,
      user_id: userId
    })
    return response.data
  },

  async getUserResults(userId: number) {
    const response = await client.get(`/api/v1/user/${userId}/results`)
    return response.data
  },

  async getDashboardStats() {
    const response = await client.get('/api/v1/dashboard/stats')
    return response.data
  },

  async getUsers() {
    const response = await client.get('/api/v1/users')
    return response.data
  },

  async getRecommendations(quizId: number) {
    const response = await client.post(`/api/v1/quiz-recommendations?quiz_id=${quizId}`)
    return response.data
  },

  async getCategories() {
    const response = await client.get('/api/v1/categories')
    return response.data
  },

  async getBooks(categoryId?: number) {
    const url = categoryId ? `/api/v1/books?category_id=${categoryId}` : '/api/v1/books'
    const response = await client.get(url)
    return response.data
  },

  async getBook(bookId: number) {
    const response = await client.get(`/api/v1/books/${bookId}`)
    return response.data
  },
}

export default api
