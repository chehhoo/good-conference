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
    const url: string = err.config?.url ?? ''
    const isAuthEndpoint = url.includes('/login') || url.includes('/otp/')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      clearAuth()
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)

export type SessionType = 'PLENARY' | 'GENERAL' | 'WORSHIP' | 'WORKSHOP' | 'OTHER'

export interface EventProgram {
  code: string
  name: string
  nameEng: string | null
}

export interface CampSession {
  id: number
  title: string
  titleEng: string | null
  description: string | null
  descriptionEng: string | null
  speaker: string | null
  speakerEng: string | null
  speakerId?: number | null
  startTime: string   // ISO 8601
  endTime: string
  location: string | null
  capacity: number | null
  day: number | null
  sessionType: SessionType
  signupCount: number
  signedUp: boolean
  programCode?: string | null
  programName?: string | null
  programNameEng?: string | null
}

export interface Speaker {
  id: number
  nameChn: string | null
  nameEng: string | null
  bioChn: string | null
  bioEng: string | null
  photoUrl: string | null
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

  programs: () =>
    api.get<EventProgram[]>('/schedule/programs').then(r => r.data),
}

export const conferenceApi = {
  login: (registrationCode: string, lastName: string) =>
    api.post<{ token: string; person: StoredPerson }>('/conference/login', { registrationCode, lastName })
      .then(r => r.data),

  me: () =>
    api.get<StoredPerson>('/conference/me').then(r => r.data),

  switchMember: (personId: number) =>
    api.post<{ token: string; person: StoredPerson }>('/conference/switch-member', { personId })
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
  church?: { nameChn: string | null; nameEng: string } | null
  meals?: Record<string, MealDay>
  lodging?: MemberLodging
  programCode?: string | null
  programName?: string | null
  programNameEng?: string | null
}

export interface FamilyInfo {
  personId: number
  familyId: number | null
  registrationCode: number | null
  email: string | null
  members: FamilyMember[]
}

export interface MealScanRecord {
  personId: number
  day: number
  slot: 'breakfast' | 'lunch' | 'dinner'
  scannedAt: string        // ISO local datetime, e.g. "2024-12-20T18:34:21"
}

export interface SmsConsent {
  smsConsent: boolean
  smsConsentAt: string | null
  mobilePhoneMasked: string | null
}

export interface Announcement {
  id: number
  message: string
  messageEng: string | null
  createdAt: string   // ISO local datetime
}

export const announcementsApi = {
  getAll: () =>
    api.get<Announcement[]>('/conference/announcements').then(r => r.data),
}

export const speakersApi = {
  getById: (id: number) =>
    api.get<Speaker>(`/conference/speakers/${id}`).then(r => r.data),
}

export const myApi = {
  family: () =>
    api.get<FamilyInfo>('/conference/my/family').then(r => r.data),

  mealScans: () =>
    api.get<MealScanRecord[]>('/conference/my/meal-scans').then(r => r.data),

  mySignups: () =>
    api.get<CampSession[]>('/schedule/my-signups').then(r => r.data),

  smsConsent: () =>
    api.get<SmsConsent>('/conference/my/sms-consent').then(r => r.data),

  setSmsConsent: (consent: boolean, mobilePhone?: string) =>
    api.post<SmsConsent>('/conference/my/sms-consent', { consent, mobilePhone })
      .then(r => r.data),
}
