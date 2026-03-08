import { useApi } from '~/composables/useApi'

export interface Course {
  id: number
  title: string
  description?: string
  createdAt: string
  problems?: number[]
  members?: number[]
}

export interface CreateCourseDto {
  title: string
  description?: string
  problemIds?: number[]
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
  }
}
