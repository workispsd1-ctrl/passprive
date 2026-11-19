import { OrderProductSkeleton } from '@/components/shared/Skeletons'

// own skeleton — without it the item page inherits the menu grid's (order/loading.tsx)
export default function Loading() {
  return <OrderProductSkeleton />
}
