'use client'

import { useRef, useState, useEffect } from 'react'
import { LoadScript } from '@react-google-maps/api'
import usePlacesAutocomplete, { getGeocode, getLatLng, Suggestion } from 'use-places-autocomplete'

const libraries: 'places'[] = ['places']

export interface LocationData {
  address: string
  lat: number
  lng: number
  placeId: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (location: LocationData | null) => void
  onInputChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  types?: string[] // Optional: restrict to specific place types (e.g., ['(cities)'])
}

function LocationAutocompleteInner({
  value,
  onChange,
  onInputChange,
  placeholder = 'Enter a location',
  disabled = false,
  className = '',
  error,
  types,
}: LocationAutocompleteProps) {
  const {
    ready,
    value: searchValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: types ? { types } : {}, // Only restrict if types provided
    debounce: 300,
    callbackName: 'initMap', // Add callback name to avoid conflicts
  })

  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize with the provided value only once
  useEffect(() => {
    if (!isInitialized && value) {
      setValue(value, false)
      setIsInitialized(true)
    }
  }, [value, isInitialized, setValue])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setValue(inputValue)
    setShowSuggestions(true)
    onInputChange?.(inputValue)

    // If user clears the input, clear the location data
    if (!inputValue) {
      onChange(null)
    }
  }

  const handleSelect = async (description: string, placeId: string) => {
    setValue(description, false)
    setShowSuggestions(false)
    clearSuggestions()

    try {
      const results = await getGeocode({ placeId }) // Use placeId instead of address for better accuracy
      const { lat, lng } = await getLatLng(results[0])

      onChange({
        address: description,
        lat,
        lng,
        placeId,
      })
    } catch (error) {
      console.error('Error fetching geocode:', error)
      // Still set the address even if geocoding fails
      onChange({
        address: description,
        lat: 0,
        lng: 0,
        placeId,
      })
    }
  }

  const renderSuggestions = () => {
    if (!showSuggestions || status !== 'OK' || data.length === 0) {
      return null
    }

    return (
      <div
        ref={suggestionsRef}
        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        {data.map((suggestion: Suggestion) => {
          const {
            place_id,
            structured_formatting: { main_text, secondary_text },
          } = suggestion

          return (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(suggestion.description, place_id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 border-gray-100"
            >
              <div className="font-medium text-gray-900">{main_text}</div>
              <div className="text-sm text-gray-600">{secondary_text}</div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInput}
        onFocus={() => searchValue.length > 0 && setShowSuggestions(true)}
        disabled={!ready || disabled}
        placeholder={!ready ? 'Loading Google Maps...' : placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />
      {renderSuggestions()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!ready && <p className="mt-1 text-xs text-gray-500">Loading Google Maps API...</p>}
    </div>
  )
}

export function LocationAutocomplete(props: LocationAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  if (!apiKey) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_KEY in your
          environment.
        </p>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <LocationAutocompleteInner {...props} />
    </LoadScript>
  )
}
