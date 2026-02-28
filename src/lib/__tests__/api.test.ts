import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '../api'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8000/api/v1')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET requests', () => {
    it('makes GET request without params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const result = await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual({ data: 'test' })
    })

    it('makes GET request with params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      await apiClient.get('/test', { page: '1', limit: '10' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test?page=1&limit=10',
        expect.any(Object)
      )
    })

    it('handles GET request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Not found')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })
  })

  describe('POST requests', () => {
    it('makes POST request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'Test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const data = { name: 'Test' }
      const result = await apiClient.post('/test', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
      expect(result).toEqual({ id: '1', name: 'Test' })
    })

    it('handles POST request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
      })

      await expect(apiClient.post('/test', {})).rejects.toThrow('Bad request')
    })
  })

  describe('PUT requests', () => {
    it('makes PUT request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'Updated' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const data = { name: 'Updated' }
      const result = await apiClient.put('/test/1', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      )
      expect(result).toEqual({ id: '1', name: 'Updated' })
    })
  })

  describe('PATCH requests', () => {
    it('makes PATCH request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'Patched' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const data = { name: 'Patched' }
      const result = await apiClient.patch('/test/1', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      )
      expect(result).toEqual({ id: '1', name: 'Patched' })
    })
  })

  describe('DELETE requests', () => {
    it('makes DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const result = await apiClient.delete('/test/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual({ success: true })
    })
  })

  describe('Authentication', () => {
    it('includes auth header when token exists', async () => {
      localStorage.setItem('access_token', 'test-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      await apiClient.get('/protected')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      )

      localStorage.removeItem('access_token')
    })

    it('does not include auth header when token does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      await apiClient.get('/public')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/public',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })

  describe('Error handling', () => {
    it('handles JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(apiClient.get('/test')).rejects.toThrow()
    })

    it('handles non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Plain text response',
        headers: new Headers({ 'content-type': 'text/plain' }),
      })

      const result = await apiClient.get('/text-endpoint')
      expect(result).toBe('Plain text response')
    })
  })
})
