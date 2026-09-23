'use client'

import { createContext, useContext } from 'react'
import type { CashbackPlan } from '@/lib/cashback'

const PlanContext = createContext<CashbackPlan>('free')

/** Provides the signed-in user's cashback plan, resolved server-side once in the root layout. */
export function PlanProvider({
  plan,
  children,
}: {
  plan: CashbackPlan
  children: React.ReactNode
}) {
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>
}

export function useUserPlan(): CashbackPlan {
  return useContext(PlanContext)
}
