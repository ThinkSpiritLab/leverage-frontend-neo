// 用户
export interface User {
  id: number
  username: string
  role: 'sa' | 'admin' | 'supervisor' | 'user' | 'guest'
  studentId?: string
  email?: string
  certifiedName?: string
  college?: string
  profession?: string
  grade?: number
  submits?: number
  accepts?: number
  createdAt: string
}

// 题目
export interface Problem {
  id: number
  logicId: number
  prefix: string
  title: string
  description: string
  timeLimit: number
  memoryLimit: number
  submits: number
  accepts: number
  tags: Tag[]
  hidden: boolean
}

// 提交
export interface Submission {
  id: number
  userId: number
  problemId: number
  language: number
  status: number
  time?: number
  memory?: number
  code?: string
  createdAt: string
  user?: Pick<User, 'id' | 'username'>
  problem?: Pick<Problem, 'id' | 'title' | 'logicId' | 'prefix'>
}

// 竞赛
export interface Contest {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  type: string
  password?: string
  fullyFreeze?: boolean
  consultantId?: number
  enabledLanguages?: string
  problems?: Problem[]
}

// 课程
export interface Course {
  id: number
  title: string
  description?: string
  teacher?: string
  startTime?: string
  endTime?: string
  notification?: string
  problems?: number[]
  members?: number[]
  createdAt: string
}

// 提交状态 — API 返回值: 0=AC, 1=WA, 2=TLE, 3=MLE, 4=CE, 9=PENDING, 10=JUDGING
export enum SubmissionStatus {
  AC = 0,
  WA = 1,
  TLE = 2,
  MLE = 3,
  CE = 4,
  RE = 5,
  SE = 6,
  PENDING = 9,
  JUDGING = 10,
}

export const STATUS_LABEL: Record<number, string> = {
  [SubmissionStatus.AC]: 'AC',
  [SubmissionStatus.WA]: '答案错误',
  [SubmissionStatus.TLE]: '超时',
  [SubmissionStatus.MLE]: '内存超限',
  [SubmissionStatus.CE]: '编译错误',
  [SubmissionStatus.RE]: '运行错误',
  [SubmissionStatus.SE]: '系统错误',
  [SubmissionStatus.PENDING]: '等待中',
  [SubmissionStatus.JUDGING]: '评测中',
}

export const STATUS_COLOR: Record<number, string> = {
  [SubmissionStatus.AC]: 'success',
  [SubmissionStatus.WA]: 'error',
  [SubmissionStatus.TLE]: 'warning',
  [SubmissionStatus.MLE]: 'warning',
  [SubmissionStatus.CE]: 'error',
  [SubmissionStatus.RE]: 'error',
  [SubmissionStatus.SE]: 'error',
  [SubmissionStatus.PENDING]: 'default',
  [SubmissionStatus.JUDGING]: 'info',
}

// 语言枚举 — API 使用数字: 0=C, 1=C++, 6=Java, 8=Python2, 9=Python3, 10=JS
export enum Language {
  C = 0,
  CPP = 1,
  Java = 6,
  Python2 = 8,
  Python3 = 9,
  JavaScript = 10,
}

export const LANGUAGE_LABEL: Record<number, string> = {
  [Language.C]: 'C',
  [Language.CPP]: 'C++',
  [Language.Java]: 'Java',
  [Language.Python2]: 'Python2',
  [Language.Python3]: 'Python3',
  [Language.JavaScript]: 'JavaScript',
}

export const LANGUAGE_OPTIONS = [
  { label: 'C', value: Language.C },
  { label: 'C++', value: Language.CPP },
  { label: 'Java', value: Language.Java },
  { label: 'Python2', value: Language.Python2 },
  { label: 'Python3', value: Language.Python3 },
  { label: 'JavaScript', value: Language.JavaScript },
]

export interface Tag {
  id: number
  name: string
  color?: string
}

export interface RankItem {
  userId: number
  username: string
  score: number
  rank: number
}

/** 判断状态是否为终态（非 PENDING/JUDGING） */
export function isFinalStatus(status: number): boolean {
  return status !== SubmissionStatus.PENDING && status !== SubmissionStatus.JUDGING
}

/** 内存：API 返回字节，转换为 KB */
export function memoryToKB(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return '-'
  return `${Math.round(bytes / 1024)}KB`
}

/** 内存：API 返回字节，转换为 MB */
export function memoryToMB(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return '-'
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}
