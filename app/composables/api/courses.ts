import { useApi } from '~/composables/useApi'

export interface Course {
  id: number
  title?: string
  name?: string
  description?: string
  teacher?: string
  startTime?: string
  endTime?: string
  notification?: string
  enabledLanguageJSON?: string | null
  createdAt: string
  problemCount?: number
  problems?: number[]
  members?: number[]
}

export interface CreateCourseDto {
  name: string
  notification?: string
  enabledLanguageJSON?: string | null
  problemIds?: number[]
}

export interface CourseRankItem {
  userId: number
  username: string
  score: number
  rank: number
  accepts?: number
  submits?: number
}

export function useCoursesApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: Course[]; total: number }>('/courses', { params }),
    get: (id: number) => api.get<Course>(`/courses/${id}`),
    create: (dto: CreateCourseDto) => api.post<Course>('/courses', dto),
    update: (id: number, dto: Partial<CreateCourseDto>) => api.patch<Course>(`/courses/${id}`, dto),
    delete: (id: number) => api.delete(`/courses/${id}`),
    addMember: (courseId: number, userId: number) =>
      api.post(`/courses/${courseId}/members`, { userId }),
    removeMember: (courseId: number, userId: number) =>
      api.delete(`/courses/${courseId}/members/${userId}`),
    getSubmissions: (courseId: number, params?: { page?: number; perPage?: number }) =>
      api.get(`/courses/${courseId}/submissions`, { params }),

    // 排行榜
    getRanking: (id: number) => api.get<CourseRankItem[]>(`/courses/${id}/ranking`),

    // 导出提交
    exportSubmissions: (id: number, filters?: string) =>
      api.get(`/courses/${id}/submissions/export`, { params: { filters } }),

    // 成员管理（学生接口）
    getStudents: (courseId: number) =>
      api.get<any[]>(`/courses/${courseId}/students`),
    addStudents: (courseId: number, userIds: number[]) =>
      api.post(`/courses/${courseId}/students`, { userIds }),
    removeStudent: (courseId: number, userId: number) =>
      api.delete(`/courses/${courseId}/students/${userId}`),

    // 题目管理
    addProblem: (id: number, problemId: number) =>
      api.post(`/courses/${id}/problems`, { problemId }),
    removeProblem: (id: number, problemId: number) =>
      api.delete(`/courses/${id}/problems/${problemId}`),
  }
}
