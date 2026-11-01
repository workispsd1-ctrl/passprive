import { cn } from '@/lib/utils'

/**
 * One block of a merchant detail page (Offers, Menu, Reviews, …) — the same
 * spacing, divider and heading everywhere. The `id` is what the sticky
 * section tabs scroll to; the first section after the tabs drops its divider.
 */
export function DetailSection({
  id,
  title,
  subtitle,
  action,
  children,
  className,
  headerClassName,
}: {
  id?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** right-aligned header slot — "See all", "Write a review", … */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'mt-8 scroll-mt-28 border-t border-gray-100 pt-6 font-(family-name:--font-dm-sans) md:mt-10 md:pt-8 [nav+&]:mt-2 [nav+&]:border-t-0 [nav+&]:pt-6',
        className,
      )}
    >
      <div className={cn('mb-4 flex items-end justify-between gap-4 md:mb-5', headerClassName)}>
        <div className='min-w-0'>
          <h2 className='text-[20px] font-bold tracking-[-0.3px] text-[#141414] md:text-[22px]'>{title}</h2>
          {subtitle && <p className='mt-1 text-[13px] text-gray-500'>{subtitle}</p>}
        </div>
        {action && <div className='shrink-0'>{action}</div>}
      </div>
      {children}
    </section>
  )
}
