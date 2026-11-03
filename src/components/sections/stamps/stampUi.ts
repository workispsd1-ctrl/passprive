import { t } from '@/components/sections/dining/designUnit'

export const STAMP_ASSETS = '/assets/stamps'

// app parity: CollectStampsScreen NOTCH_PATH — the corner the category icon sits in
export const NOTCH_PATH = 'M1 13.5C1 18.1944 4.80558 22 9.5 22H21.5C31.165 22 39 29.835 39 39.5V45.5C39 51.8513 44.1487 57 50.5 57H54C58.4183 57 62 60.5817 62 65C62 69.4183 58.4183 73 54 73H19C0.222317 73 -15 57.7777 -15 39V13C-15 8.58172 -11.4183 5 -7 5C-2.58172 5 1 8.58172 1 13V13.5Z'

/** Readable on laptops, where the stepped scale alone would shrink small print too far. */
export const small = (px: number, min: number) => `max(${min}px, ${t(px)})`
