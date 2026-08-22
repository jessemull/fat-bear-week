/**
 * Initials for the account avatar. One word → first letter; otherwise first + last.
 */
export function getDisplayInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  const first = Array.from(parts[0] ?? "")[0];

  if (!first) {
    return "?";
  }

  if (parts.length === 1) {
    return first.toUpperCase();
  }

  const last = Array.from(parts[parts.length - 1] ?? "")[0];

  if (!last) {
    return first.toUpperCase();
  }

  return `${first}${last}`.toUpperCase();
}
