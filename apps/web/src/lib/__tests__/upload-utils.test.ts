import { describe, it, expect } from 'vitest'
import { validateImage, generateFilename, MAX_IMAGE_SIZE } from '../upload-utils'

describe('Upload Utils', () => {
  describe('validateImage', () => {
    it('should accept valid JPEG image', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = validateImage(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PNG image', () => {
      const file = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid WebP image', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })
      
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject file larger than 5MB', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }) // 6MB
      
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should accept file exactly 5MB', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: MAX_IMAGE_SIZE })
      
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('generateFilename', () => {
    it('should generate unique filename', () => {
      const filename1 = generateFilename('photo.jpg')
      const filename2 = generateFilename('photo.jpg')
      
      expect(filename1).not.toBe(filename2)
      expect(filename1).toMatch(/^\d+-\w+\.jpg$/)
    })

    it('should preserve file extension', () => {
      const filename = generateFilename('photo.png')
      expect(filename).toMatch(/\.png$/)
    })

    it('should handle files without extension', () => {
      const filename = generateFilename('photo')
      expect(filename).toMatch(/^\d+-\w+\.photo$/) // Uses whole name as extension
    })
  })
})
