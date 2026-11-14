export function generatePassword(length = 12): string {
  const sets = [
    "abcdefghijkmnopqrstuvwxyz",
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "23456789",
    "!@#$%*?",
  ];
  const all = sets.join("");
  const pick = (s: string) =>
    s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];

  const chars = [
    ...sets.map(pick),
    ...Array.from({ length: length - sets.length }, () => pick(all)),
  ];

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
