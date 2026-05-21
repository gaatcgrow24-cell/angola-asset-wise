const KZ = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("pt-AO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtKz(n: number) {
  return KZ.format(n).replace("AOA", "Kz");
}
export function fmtNum(n: number) {
  return NUM.format(n);
}
export function fmtPct(n: number) {
  return `${NUM.format(n)}%`;
}
export function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
