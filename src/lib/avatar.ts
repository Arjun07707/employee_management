/** First letters of the first and last word, uppercased. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

const GRADIENTS = [
  "linear-gradient(135deg, #5B5BD6 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%)",
  "linear-gradient(135deg, #3B82F6 0%, #5B5BD6 100%)",
  "linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)",
  "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
  "linear-gradient(135deg, #F97316 0%, #F59E0B 100%)",
] as const;

/** Deterministic gradient picked from a stable hash of the name. */
export function gradientFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index]!;
}
