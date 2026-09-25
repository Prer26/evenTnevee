// Mimics Base44's list(sortString, limit) semantics: "-created_date" = descending by created_date
export function applySort(items, sortString, limit) {
  let result = [...items];
  if (sortString) {
    const desc = sortString.startsWith("-");
    const field = desc ? sortString.slice(1) : sortString;
    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      return av > bv ? (desc ? -1 : 1) : (desc ? 1 : -1);
    });
  }
  if (limit) result = result.slice(0, Number(limit));
  return result;
}
