'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, LocateFixed, Landmark } from 'lucide-react'
import { CITY_DATA, DEFAULT_COUNTRY, type City } from './cityData'

interface Props {
  isOpen: boolean
  onClose: () => void
  countryCode: string
  onSelect: (city: string, region: string) => void
  onUseCurrentLocation: () => void
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function LocationPickerDialog({
  isOpen,
  onClose,
  countryCode,
  onSelect,
  onUseCurrentLocation,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeLetter, setActiveLetter] = useState('A')
  const inputRef = useRef<HTMLInputElement>(null)

  const data = CITY_DATA[countryCode] ?? CITY_DATA[DEFAULT_COUNTRY]

  const filteredAll: City[] = query
    ? data.allCities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : data.allCities.filter(c => c.name.startsWith(activeLetter))

  const letterHasCities = (letter: string) =>
    data.allCities.some(c => c.name.startsWith(letter))

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveLetter('A')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-black/40 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl min-h-screen md:min-h-0 md:rounded-2xl md:mt-16 md:mb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Select Location</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city, area or locality"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
            />
          </div>

          {/* Use Current Location */}
          <button
            type="button"
            onClick={() => { onUseCurrentLocation(); onClose() }}
            className="flex items-center gap-2.5 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
          >
            <LocateFixed className="w-5 h-5" />
            Use Current Location
          </button>

          {/* Search results */}
          {query ? (
            <div className="space-y-1">
              {filteredAll.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No cities found</p>
              ) : (
                filteredAll.map(city => (
                  <button
                    type="button"
                    key={city.name}
                    onClick={() => { onSelect(city.name, city.region); onClose() }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-3 transition-colors"
                  >
                    <Landmark className="w-4 h-4 text-purple-400 shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{city.name}</p>
                      <p className="text-xs text-gray-400">{city.region}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Popular Cities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular Cities</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {data.popularCities.map(city => {
                    const found = data.allCities.find(c => c.name === city)
                    return (
                      <button
                        key={city}
                        onClick={() => { onSelect(city, found?.region ?? ''); onClose() }}
                        className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors group"
                      >
                        <div className="w-12 h-12 flex items-center justify-center text-purple-500 group-hover:text-purple-600 transition-colors">
                          <Landmark className="w-8 h-8" strokeWidth={1.2} />
                        </div>
                        <span className="text-xs text-gray-700 font-medium text-center leading-tight">
                          {city}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* All Cities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">All Cities</h3>

                {/* Letter navigation */}
                <div className="flex flex-wrap gap-0.5 mb-4">
                  {ALPHABET.map(letter => {
                    const available = letterHasCities(letter)
                    const active = letter === activeLetter
                    return (
                      <button
                        key={letter}
                        disabled={!available}
                        onClick={() => available && setActiveLetter(letter)}
                        className={`w-7 h-7 text-xs font-medium rounded flex items-center justify-center transition-colors ${
                          active
                            ? 'text-purple-600 font-bold'
                            : available
                            ? 'text-gray-600 hover:text-purple-500'
                            : 'text-gray-200 cursor-default'
                        }`}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </div>

                {/* City list for selected letter */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                  {filteredAll.map(city => (
                    <button
                      key={city.name}
                      onClick={() => { onSelect(city.name, city.region); onClose() }}
                      className="text-left text-sm text-gray-700 hover:text-purple-600 font-medium py-0.5 transition-colors"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
