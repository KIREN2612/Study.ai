// src/api/flashcards.js
import apiClient from './client'

export const flashcardsAPI = {
  generate: (payload) => apiClient.post('/flashcards/generate', payload),
  getByDoc: (docId)   => apiClient.get(`/flashcards/${docId}`),
}