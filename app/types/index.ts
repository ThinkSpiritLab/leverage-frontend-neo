// 用户
export interface User {
  id: number
  username: string
  role: 'sa' | 'admin' | 'supervisor' | 'user' | 'guest'
  studentId?: string
  email?: string
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
  language: string
  status: number
  time?: number
  memory?: number
  createdAt: string
  user?: Pick<User, 'id' | 'username'>
  problem?: Pick<Problem, 'id' | 'title' | 'logicId' | 'prefix'>
}

// 竞赛
export interface Contest {
  id: number
  title: string
  startTime: string
  endTime: string
  type: string
  problems?: Problem[]
}

// 提交状态（与后端 heng.types.ts Status 枚举完全对齐）
export enum SubmissionStatus {
  AC = 0,
  WA = 1,
  TLE = 2,
  MLE = 3,
  CE = 4,
  SE = 5,
  RE = 6,
  PE = 7,
  CRLE = 8,
  PENDING = 9,
  JUDGING = 10,
  COMPILING = 11,
  OLE = 12,
  SC = 13,
}

export const STATUS_LABEL: Record<number, string> = {
  0: 'AC',
  1: '答案错误',
  2: '超时',
  3: '内存超限',
  4: '编译错误',
  5: '系统错误',
  6: '运行错误',
  7: '格式错误',
  8: '自定义错误',
  9: '等待中',
  10: '评测中',
  11: '编译中',
  12: '输出超限',
  13: '可疑',
}

export const STATUS_COLOR: Record<number, string> = {
  0: 'success',  // AC
  1: 'error',    // WA
  2: 'warning',  // TLE
  3: 'warning',  // MLE
  4: 'error',    // CE
  5: 'error',    // SE
  6: 'error',    // RE
  7: 'warning',  // PE
  8: 'error',    // CRLE
  9: 'default',  // PENDING
  10: 'info',    // JUDGING
  11: 'info',    // COMPILING
  12: 'warning', // OLE
  13: 'warning', // SC
}

// 语言枚举（后端 language 字段为数字）
export const LANGUAGE_LABEL: Record<number | string, string> = {
  0: 'C', 1: 'C++', 6: 'Java', 7: 'Kotlin',
  8: 'Python2', 9: 'Python3', 10: 'JavaScript', 11: 'TypeScript',
}

export const LANGUAGE_NAME: Record<number, string> = {
  0: 'c', 1: 'cpp', 6: 'java', 7: 'kotlin',
  8: 'python', 9: 'python', 10: 'javascript', 11: 'typescript',
}

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
