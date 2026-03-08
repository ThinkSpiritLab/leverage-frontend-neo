// 用户
export interface User {
  id: number
  username: string
  role: 'sa' | 'admin' | 'supervisor' | 'user' | 'guest'
  studentId?: string
  email?: string
  nickname?: string
  certifiedName?: string
  college?: string
  profession?: string
  grade?: string
  submits?: number
  accepts?: number
  banned?: boolean
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
  title?: string
  name?: string
  startTime: string
  endTime: string
  type: string
  problems?: Problem[]
}

// 提交状态
export enum SubmissionStatus {
  PENDING = 0,
  JUDGING = 1,
  AC = 2,
  WA = 3,
  TLE = 4,
  MLE = 5,
  RE = 6,
  CE = 7,
  SE = 8,
}

export const STATUS_LABEL: Record<number, string> = {
  0: '等待中',
  1: '评测中',
  2: 'AC',
  3: '答案错误',
  4: '超时',
  5: '内存超限',
  6: '运行错误',
  7: '编译错误',
  8: '系统错误',
}

export const STATUS_COLOR: Record<number, string> = {
  0: 'default',
  1: 'info',
  2: 'success',
  3: 'error',
  4: 'warning',
  5: 'warning',
  6: 'error',
  7: 'error',
  8: 'error',
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
