/** app parity: utils/referral.js ERRORS / describeReferralError */
const ERRORS: Record<string, string> = {
  NOT_FOUND: "That code doesn't exist. Check it and try again.",
  SELF: "That's your own code.",
  ALREADY_REFERRED: "You've already joined with a friend's code.",
  NOT_NEW: 'A code can only be used before your first bill payment.',
  CIRCULAR: "You can't use the code of someone you invited.",
  REFERRALS_OFF: 'Referrals are paused right now.',
}

export function describeReferralError(code?: string | null): string {
  return (code && ERRORS[code]) || 'Could not add that code. Try again.'
}
