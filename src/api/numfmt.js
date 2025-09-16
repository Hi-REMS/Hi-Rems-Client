export const dash = v => (v === null || v === undefined ? '?' : v);

export function fmt(v, digits = 1) {
  if (v === null || v === undefined) return '?';
  return Number(v).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
