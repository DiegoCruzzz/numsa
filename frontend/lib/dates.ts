/** Próxima ocurrencia de un día del mes (1-31) a partir de `from`, clampeada a fin de mes. */
export function nextOccurrenceOfDay(day: number, from: Date = new Date()): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const clampToMonth = (y: number, m: number) => Math.min(day, new Date(y, m + 1, 0).getDate());

  const today = new Date(year, month, from.getDate());
  let candidate = new Date(year, month, clampToMonth(year, month));
  if (candidate < today) {
    candidate = new Date(year, month + 1, clampToMonth(year, month + 1));
  }
  return candidate;
}
