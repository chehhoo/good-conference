import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

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
