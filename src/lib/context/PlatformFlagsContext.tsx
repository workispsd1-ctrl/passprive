'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_PLATFORM_FLAGS, setPlatformFlags, type PlatformFlags } from '@/lib/platformFlags'

const PlatformFlagsContext = createContext<PlatformFlags>(DEFAULT_PLATFORM_FLAGS)

/** Set while rendering, so the cashback helpers below it already see the switches. */
export function PlatformFlagsProvider({ flags, children }: { flags: PlatformFlags; children: React.ReactNode }) {
  setPlatformFlags(flags)
  return <PlatformFlagsContext.Provider value={flags}>{children}</PlatformFlagsContext.Provider>
}

export function usePlatformFlags(): PlatformFlags {
  return useContext(PlatformFlagsContext)
}
