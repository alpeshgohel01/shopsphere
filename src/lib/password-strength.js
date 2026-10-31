/**
 * @param {string} password
 * @returns {{ score: number, label: 'weak' | 'fair' | 'good' | 'strong' }}
 */
export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "weak" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-zA-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "weak" };
  if (score === 2) return { score, label: "fair" };
  if (score === 3 || score === 4) return { score, label: "good" };
  return { score, label: "strong" };
}

export const strengthLabels = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

export const strengthBarClass = {
  weak: "bg-red-500",
  fair: "bg-amber-500",
  good: "bg-teal-500",
  strong: "bg-teal-700",
};
