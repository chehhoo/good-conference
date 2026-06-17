const TOKEN_KEY = 'gc_token'
const PERSON_KEY = 'gc_person'

export interface StoredPerson {
  id: number
  firstName: string
  lastName: string
  chineseName: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuth(token: string, person: StoredPerson) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PERSON_KEY, JSON.stringify(person))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PERSON_KEY)
}

export function getPerson(): StoredPerson | null {
  const raw = localStorage.getItem(PERSON_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
