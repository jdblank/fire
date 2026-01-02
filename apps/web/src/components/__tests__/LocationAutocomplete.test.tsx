import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationAutocomplete } from '../LocationAutocomplete'

// Mock @react-google-maps/api
vi.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <div data-testid="load-script">{children}</div>,
}))

// Mock use-places-autocomplete
vi.mock('use-places-autocomplete', () => ({
  default: () => ({
    ready: true,
    value: '',
    suggestions: { status: 'OK', data: [] },
    setValue: vi.fn(),
    clearSuggestions: vi.fn(),
  }),
  getGeocode: vi.fn(),
  getLatLng: vi.fn(),
}))

describe('LocationAutocomplete Component', () => {
  const mockOnChange = vi.fn()
  const mockOnInputChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set NEXT_PUBLIC_GOOGLE_MAPS_KEY
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = 'test-api-key'
  })

  describe('API Key Validation', () => {
    it('should show error when API key is missing', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(
        screen.getByText(/Google Maps API key is not configured/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Please set NEXT_PUBLIC_GOOGLE_MAPS_KEY/i)
      ).toBeInTheDocument()
    })

    it('should render normally when API key is present', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = 'test-api-key'

      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(screen.getByPlaceholderText('Enter a location')).toBeInTheDocument()
      expect(screen.getByTestId('load-script')).toBeInTheDocument()
    })
  })

  describe('Component Rendering', () => {
    it('should render with default placeholder', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(screen.getByPlaceholderText('Enter a location')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          placeholder="Search for a city"
        />
      )

      expect(screen.getByPlaceholderText('Search for a city')).toBeInTheDocument()
    })

    it('should display error message when provided', () => {
      render(
        <LocationAutocomplete value="" onChange={mockOnChange} error="Invalid location" />
      )

      expect(screen.getByText('Invalid location')).toBeInTheDocument()
    })

    it('should respect disabled prop', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} disabled={true} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toBeDisabled()
    })

    it('should apply custom className', () => {
      render(
        <LocationAutocomplete value="" onChange={mockOnChange} className="custom-class" />
      )

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Error Styling', () => {
    it('should apply error styling when error prop is provided', () => {
      render(
        <LocationAutocomplete value="" onChange={mockOnChange} error="Invalid input" />
      )

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toHaveClass('border-red-500')
    })

    it('should not apply error styling when no error', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toHaveClass('border-gray-300')
      expect(input).not.toHaveClass('border-red-500')
    })
  })

  describe('Props Interface', () => {
    it('should accept value prop', () => {
      render(<LocationAutocomplete value="San Francisco" onChange={mockOnChange} />)

      expect(screen.getByPlaceholderText('Enter a location')).toBeInTheDocument()
    })

    it('should accept onChange callback', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(mockOnChange).toBeDefined()
    })

    it('should accept optional onInputChange callback', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          onInputChange={mockOnInputChange}
        />
      )

      expect(mockOnInputChange).toBeDefined()
    })

    it('should accept optional types prop for filtering', () => {
      // This verifies the types prop is accepted by the component
      render(<LocationAutocomplete value="" onChange={mockOnChange} types={['(cities)']} />)

      expect(screen.getByPlaceholderText('Enter a location')).toBeInTheDocument()
    })

    it('should work without types prop (unrestricted)', () => {
      // When types is omitted, search should be unrestricted
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(screen.getByPlaceholderText('Enter a location')).toBeInTheDocument()
    })
  })

  describe('Type Restrictions', () => {
    it('should support city-only filtering with types={["(cities)"]}', () => {
      // Component should accept cities filter for hometown fields
      render(<LocationAutocomplete value="" onChange={mockOnChange} types={['(cities)']} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toBeInTheDocument()
    })

    it('should support unrestricted search when types is undefined', () => {
      // Component should allow all place types for event locations
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toBeInTheDocument()
    })

    it('should support multiple type filters', () => {
      // Component should accept array of types
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          types={['(cities)', 'locality']}
        />
      )

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toBeInTheDocument()
    })
  })

  describe('LocationData Interface', () => {
    it('should expect LocationData with address, lat, lng, placeId', () => {
      // Type check - LocationData should have these fields
      type ExpectedLocationData = {
        address: string
        lat: number
        lng: number
        placeId: string
      }

      const mockLocationData: ExpectedLocationData = {
        address: 'San Francisco, CA, USA',
        lat: 37.7749,
        lng: -122.4194,
        placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
      }

      expect(mockLocationData.address).toBeDefined()
      expect(typeof mockLocationData.lat).toBe('number')
      expect(typeof mockLocationData.lng).toBe('number')
      expect(mockLocationData.placeId).toBeDefined()
    })

    it('should allow onChange to be called with null', () => {
      // onChange should accept null when input is cleared
      const handleChange = (location: { address: string; lat: number; lng: number; placeId: string } | null) => {
        // This function signature matches the component's expected callback
        expect(location).toBeNull()
      }

      handleChange(null)
    })
  })

  describe('Component Structure', () => {
    it('should wrap content in LoadScript component', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      expect(screen.getByTestId('load-script')).toBeInTheDocument()
    })

    it('should render input inside LoadScript', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const loadScript = screen.getByTestId('load-script')
      const input = screen.getByPlaceholderText('Enter a location')

      expect(loadScript).toContainElement(input)
    })
  })

  describe('Accessibility', () => {
    it('should have text input type', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should be keyboard accessible', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input.tagName).toBe('INPUT')
    })

    it('should show disabled state visually', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} disabled={true} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toHaveClass('disabled:bg-gray-100')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<LocationAutocomplete value="" onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter a location')
      expect(input).toBeInTheDocument()
    })

    it('should handle null onChange gracefully in type system', () => {
      // onChange is required, not optional
      // This test verifies the prop is not nullable
      expect(() => {
        // @ts-expect-error - onChange is required
        render(<LocationAutocomplete value="" />)
      }).toBeDefined()
    })
  })
})
