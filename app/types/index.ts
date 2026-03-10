// 用户
export interface User {
  id: number
  username: string
  role?: 'sa' | 'admin' | 'supervisor' | 'user' | 'contest-user' | 'guest'
  authority?: string
  studentId?: string
  email?: string
  certifiedName?: string
  nickname?: string
  college?: string
  profession?: string
  class?: string
  grade?: string
  status?: number
  statusEndsAt?: string | null
  remarks?: string | null
  banned?: boolean
  submits?: number
  accepts?: number
  createdAt?: string
  updatedAt?: string
}

// 题目
export interface Problem {
  id: number
  logicId: number
  prefix: string
  title: string
  description: string
  content?: string
  timeLimit: number
  memoryLimit: number
  submits: number
  accepts: number
  tags: Tag[]
  hidden: boolean
  problemId?: number
  label?: string
  color?: string
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
  // OJ/Botzone 扩展字段
  provider?: string | null
  externalJobId?: string | null
  providerMeta?: Record<string, unknown> | null
  misc?: Record<string, unknown> | null
}

// 竞赛
export interface Contest {
  id: number
  name?: string
  title?: string
  description?: string
  startTime: string
  endTime: string
  registrationEndTime?: string
  type: string
  problems?: Problem[]
  penalty?: number
  scoreByPoint?: boolean
  openForRegistration?: boolean
  fullyFreeze?: boolean
  freezeTime?: number
  freezeTimeAfterEnd?: number
  enabledLanguageJSON?: string | null
  notification?: string
  allowDirectLogin?: boolean
  public?: boolean
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
  0: '通过(AC)',
  1: '答案错误(WA)',
  2: '超时(TLE)',
  3: '内存超限(MLE)',
  4: '编译错误(CE)',
  5: '系统错误(SE)',
  6: '运行错误(RE)',
  7: '格式错误(PE)',
  8: '自定义错误(CRLE)',
  9: '等待中(PENDING)',
  10: '评测中(JUDGING)',
  11: '编译中(COMPILING)',
  12: '输出超限(OLE)',
  13: '可疑(SC)',
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

export enum Language {
  C = 0,
  CPP = 1,
  Java = 6,
  Kotlin = 7,
  Python2 = 8,
  Python3 = 9,
  JavaScript = 10,
  TypeScript = 11,
}

export function isFinalStatus(status: number): boolean {
  return status >= 0 && status <= 8
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

// 内存单位转换：bytes → KB
export const LANGUAGE_OPTIONS = [
  { label: 'C', value: 0 },
  { label: 'C++', value: 1 },
  { label: 'Java', value: 6 },
  { label: 'Python 2', value: 8 },
  { label: 'Python 3', value: 9 },
  { label: 'JavaScript', value: 10 },
  { label: 'TypeScript', value: 11 },
]

export function memoryToKB(bytes: number): number {
  return Math.round(bytes / 1024)
}

// 内存单位转换：bytes → MB（保留两位小数）
export function memoryToMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2)
}
