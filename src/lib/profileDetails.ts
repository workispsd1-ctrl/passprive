/** Profile details screen — app parity: screens/ProfileDetailsScreen.jsx. */
export type ProfileDetails = {
  fullName: string
  phone: string
  /** from the auth account — shown, not editable (as in the app) */
  email: string
  address: string
  gender: string
  /** YYYY-MM-DD (users.dob is a `date`) */
  dob: string
}

export const GENDER_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'] as const
