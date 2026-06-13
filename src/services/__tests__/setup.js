import { vi } from 'vitest'

// Mock localStorage
const storage = {}
const localStorageMock = {
  getItem: vi.fn((key) => storage[key] || null),
  setItem: vi.fn((key, value) => { storage[key] = value }),
  removeItem: vi.fn((key) => { delete storage[key] }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]) }),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock FormData
globalThis.FormData = class FormData {
  constructor() { this._data = {} }
  append(key, value) { this._data[key] = value }
  get(key) { return this._data[key] }
}
