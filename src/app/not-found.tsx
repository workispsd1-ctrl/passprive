import { Header } from '@/components/layout'
import { NotFoundContent } from '@/components/shared/NotFoundContent'

/** Unmatched URLs render outside the route-group layouts, so this page brings its own header. */
export default function NotFound() {
  return (
    <>
      <Header />
      <NotFoundContent />
    </>
  )
}
