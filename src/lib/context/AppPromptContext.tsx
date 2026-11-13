'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { DownloadAppDialog, type AppPromptReason } from '@/components/shared/deals/RedeemFlowPopups'

/** Opens the shared "Download the PassPrivé App" pop-up (cashback badges, deal redeem). */
const AppPromptContext = createContext<((reason: AppPromptReason) => void) | null>(null)

export function AppPromptProvider({ children }: { children: React.ReactNode }) {
  const [reason, setReason] = useState<AppPromptReason | null>(null)
  const open = useCallback((r: AppPromptReason) => setReason(r), [])
  return (
    <AppPromptContext.Provider value={open}>
      {children}
      <DownloadAppDialog open={reason != null} reason={reason ?? 'cashback'} onClose={() => setReason(null)} />
    </AppPromptContext.Provider>
  )
}

/** null outside the provider — callers then leave the badge non-interactive. */
export function useAppPrompt() {
  return useContext(AppPromptContext)
}
