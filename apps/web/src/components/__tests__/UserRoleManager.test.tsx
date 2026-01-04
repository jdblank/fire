import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { UserRoleManager } from '../../app/admin/users/[userId]/UserRoleManager'

// Mock fetch globally
global.fetch = vi.fn()

describe('UserRoleManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset alert mock
    global.alert = vi.fn()
  })

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      // Mock fetch to never resolve
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('User Role')).toBeInTheDocument()
    })
  })

  describe('No LogTo ID', () => {
    it('should show message when logtoId is null', async () => {
      render(<UserRoleManager userId="user-123" logtoId={null} />)

      await waitFor(() => {
        expect(screen.getByText(/User has not completed registration/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Role can be set after they accept their invite/i)
      ).toBeInTheDocument()
    })

    it('should not fetch role when logtoId is null', async () => {
      render(<UserRoleManager userId="user-123" logtoId={null} />)

      await waitFor(() => {
        expect(screen.getByText(/User has not completed registration/i)).toBeInTheDocument()
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Successful Role Fetch', () => {
    it('should fetch and display current role', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByText(/Current Role:/)).toBeInTheDocument()
      })

      expect(screen.getByText('USER')).toBeInTheDocument()
      expect(fetch).toHaveBeenCalledWith('/api/admin/users/user-123/role')
    })

    it('should populate dropdown with current role', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'ADMIN' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement
        expect(select.value).toBe('ADMIN')
      })
    })
  })

  describe('Role Dropdown', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)
    })

    it('should have USER, EDITOR, and ADMIN options', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const options = screen.getAllByRole('option') as HTMLOptionElement[]
      expect(options).toHaveLength(3)
      expect(options[0].value).toBe('USER')
      expect(options[1].value).toBe('EDITOR')
      expect(options[2].value).toBe('ADMIN')
    })

    it('should allow changing the selected role', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      expect(select.value).toBe('ADMIN')
    })
  })

  describe('Update Button', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)
    })

    it('should show update button only when role changes', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Initially no button
      expect(screen.queryByRole('button', { name: /Update Role/i })).not.toBeInTheDocument()

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Role/i })).toBeInTheDocument()
      })
    })

    it('should hide update button when role changes back to current', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')

      // Change to different role
      fireEvent.change(select, { target: { value: 'ADMIN' } })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Role/i })).toBeInTheDocument()
      })

      // Change back to original
      fireEvent.change(select, { target: { value: 'USER' } })
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Update Role/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Disable During Save', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)
    })

    it('should disable form during save', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock save request (never resolves to keep saving state)
      vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}))

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Updating.../i })).toBeDisabled()
        expect(select).toBeDisabled()
      })
    })

    it('should show "Updating..." text during save', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock save request
      vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}))

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch user role')).toBeInTheDocument()
      })
    })

    it('should display error when fetch throws', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch user role')).toBeInTheDocument()
      })
    })

    it('should display error when save fails', async () => {
      // Mock successful initial fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock failed save
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot change own role' }),
      } as Response)

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Cannot change own role')).toBeInTheDocument()
      })
    })
  })

  describe('Successful Role Update', () => {
    it('should call API with correct payload', async () => {
      // Mock successful initial fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock successful save
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Role updated to ADMIN. User must log out and back in.',
        }),
      } as Response)

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/admin/users/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'logto-456',
            role: 'ADMIN',
          }),
        })
      })
    })

    it('should show success message', async () => {
      // Mock successful initial fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock successful save
      const successMessage = 'Role updated to ADMIN. User must log out and back in.'
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: successMessage,
        }),
      } as Response)

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(successMessage)
      })
    })

    it('should update current role after successful save', async () => {
      // Mock successful initial fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)

      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByText('USER')).toBeInTheDocument()
      })

      // Change role
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ADMIN' } })

      // Mock successful save
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Role updated',
        }),
      } as Response)

      const updateButton = await screen.findByRole('button', { name: /Update Role/i })
      fireEvent.click(updateButton)

      // Wait for update to complete and current role to change
      await waitFor(() => {
        const currentRoleText = screen.getByText(/Current Role:/)
        expect(currentRoleText.parentElement).toHaveTextContent('ADMIN')
      })

      // Button should disappear since selected === current now
      expect(screen.queryByRole('button', { name: /Update Role/i })).not.toBeInTheDocument()
    })
  })

  describe('Component Text Content', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'USER' }),
      } as Response)
    })

    it('should display LogTo information message', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByText(/Roles are managed in LogTo/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Changes require the user to log out and back in/i)
      ).toBeInTheDocument()
    })

    it('should have proper role option labels', async () => {
      render(<UserRoleManager userId="user-123" logtoId="logto-456" />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Editor' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()
    })
  })
})
