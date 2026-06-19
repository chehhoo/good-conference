import axios from 'axios'
import { getToken, clearAuth, type StoredPerson } from '../auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      clearAuth()
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)

export type SessionType = 'PLENARY' | 'GENERAL' | 'WORSHIP' | 'WORKSHOP' | 'OTHER'

export interface CampSession {
  id: number
  title: string
  titleEng: string | null
  description: string | null
  descriptionEng: string | null
  speaker: string | null
  speakerEng: string | null
  startTime: string   // ISO 8601
  endTime: string
  location: string | null
  capacity: number | null
  day: number | null
  sessionType: SessionType
  signupCount: number
  signedUp: boolean
}

export const scheduleApi = {
  getAll: () =>
    api.get<CampSession[]>('/schedule').then(r => r.data),

  getByDay: (day: number) =>
    api.get<CampSession[]>('/schedule', { params: { day } }).then(r => r.data),

  signup: (id: number) =>
    api.post<CampSession>(`/schedule/${id}/signup`).then(r => r.data),

  unsignup: (id: number) =>
    api.delete<CampSession>(`/schedule/${id}/signup`).then(r => r.data),
}

export const conferenceApi = {
  login: (registrationCode: string, lastName: string) =>
    api.post<{ token: string; person: StoredPerson }>('/conference/login', { registrationCode, lastName })
      .then(r => r.data),
}

export const otpApi = {
  send: (contact: string) =>
    api.post<{ channel: string; maskedDestination: string }>('/conference/otp/send', { contact })
      .then(r => r.data),

  verify: (contact: string, code: string) =>
    api.post<{ token: string; person: StoredPerson }>('/conference/otp/verify', { contact, code })
      .then(r => r.data),
}

export interface MealDay {
  breakfast: boolean | null
  lunch: boolean | null
  dinner: boolean | null
}

export interface MemberLodging {
  status: string | null
  nights: Record<string, string | null>
}

export interface FamilyMember {
  id: number
  firstName: string
  lastName: string
  chineseName: string
  gender: string | null
  ageCode: string | null
  isMe: boolean
  meals?: Record<string, MealDay>
  lodging?: MemberLodging
}

export interface FamilyInfo {
  personId: number
  familyId: number | null
  members: FamilyMember[]
}

export const myApi = {
  family: () =>
    api.get<FamilyInfo>('/conference/my/family').then(r => r.data),

  mySignups: () =>
    api.get<CampSession[]>('/schedule/my-signups').then(r => r.data),
}
