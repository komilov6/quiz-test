export interface TestSuite {
  id: number
  name: string
  description: string
  language: string
  created_at: string
}

export interface TestCase {
  id: number
  suite_id: number
  name: string
  description: string
  code: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string
  repository_url: string
  created_at: string
}

export interface DashboardStats {
  total_projects: number
  total_tests: number
  passed_tests: number
  failed_tests: number
  pass_rate: number
}
