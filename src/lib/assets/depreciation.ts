// Motor de cálculo de amortizações
// Método das Quotas Constantes (Linha Recta) — Art.º 6.º Decreto 207/15
// Início no mês de entrada em funcionamento — Art.º 3.º n.º 2

import type { Asset, DepreciationCategory } from "./types";

// Precisão decimal — arredondamento meio-acima a 2 casas
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface MonthlySchedule {
  year: number;
  month: number; // 1-12
  monthlyDepreciation: number;
  accumulated: number;
  netBookValue: number;
}

export interface YearlySchedule {
  year: number;
  yearDepreciation: number;
  accumulated: number;
  netBookValue: number;
  monthsInYear: number;
}

export interface DepreciationSummary {
  annualRate: number;
  usefulLifeYears: number;
  depreciableBase: number;       // Valor Aquisição - Valor Residual
  annualDepreciation: number;    // quota anual
  monthlyDepreciation: number;   // quota mensal
  startYear: number;
  startMonth: number;            // 1-12 (mês de entrada em funcionamento)
}

export function depreciationSummary(
  asset: Pick<Asset, "acquisitionValue" | "residualValue" | "inServiceDate">,
  category: Pick<DepreciationCategory, "ratePct" | "usefulLifeYears">,
): DepreciationSummary {
  const depreciableBase = Math.max(
    0,
    asset.acquisitionValue - asset.residualValue,
  );
  const annualDepreciation = depreciableBase * (category.ratePct / 100);
  const monthlyDepreciation = annualDepreciation / 12;
  const start = new Date(asset.inServiceDate);
  return {
    annualRate: category.ratePct,
    usefulLifeYears: category.usefulLifeYears,
    depreciableBase,
    annualDepreciation,
    monthlyDepreciation,
    startYear: start.getUTCFullYear(),
    startMonth: start.getUTCMonth() + 1,
  };
}

// Calcula amortização acumulada até uma data de referência (inclusive o mês).
export function accumulatedUntil(
  asset: Pick<
    Asset,
    "acquisitionValue" | "residualValue" | "inServiceDate" | "impairmentLoss"
  >,
  category: Pick<DepreciationCategory, "ratePct" | "usefulLifeYears">,
  ref: Date = new Date(),
): { accumulated: number; netBookValue: number; monthsElapsed: number } {
  const s = depreciationSummary(asset, category);
  const refYear = ref.getUTCFullYear();
  const refMonth = ref.getUTCMonth() + 1;
  const monthsElapsed = Math.max(
    0,
    (refYear - s.startYear) * 12 + (refMonth - s.startMonth) + 1,
  );
  const totalMonths = s.usefulLifeYears * 12;
  const effectiveMonths = Math.min(monthsElapsed, totalMonths);
  const accumulatedRaw = round2(s.monthlyDepreciation * effectiveMonths);
  const accumulated = Math.min(accumulatedRaw, s.depreciableBase);
  const nbv = round2(
    asset.acquisitionValue - accumulated - (asset.impairmentLoss ?? 0),
  );
  return { accumulated, netBookValue: nbv, monthsElapsed: effectiveMonths };
}

// Tabela anual projectada do início ao fim da vida útil.
export function projectedYearlySchedule(
  asset: Pick<
    Asset,
    "acquisitionValue" | "residualValue" | "inServiceDate" | "impairmentLoss"
  >,
  category: Pick<DepreciationCategory, "ratePct" | "usefulLifeYears">,
): YearlySchedule[] {
  const s = depreciationSummary(asset, category);
  const rows: YearlySchedule[] = [];
  const totalMonths = s.usefulLifeYears * 12;
  let remainingMonths = totalMonths;
  let accumulated = 0;
  let cursorYear = s.startYear;
  let cursorMonth = s.startMonth;

  while (remainingMonths > 0) {
    const monthsLeftInYear = 12 - cursorMonth + 1;
    const monthsThisYear = Math.min(monthsLeftInYear, remainingMonths);
    const yearDepr = round2(s.monthlyDepreciation * monthsThisYear);
    accumulated = round2(Math.min(accumulated + yearDepr, s.depreciableBase));
    const nbv = round2(
      asset.acquisitionValue - accumulated - (asset.impairmentLoss ?? 0),
    );
    rows.push({
      year: cursorYear,
      yearDepreciation: yearDepr,
      accumulated,
      netBookValue: nbv,
      monthsInYear: monthsThisYear,
    });
    remainingMonths -= monthsThisYear;
    cursorYear += 1;
    cursorMonth = 1;
  }
  return rows;
}

// Amortização do exercício corrente (ano civil em curso).
export function currentYearDepreciation(
  asset: Pick<Asset, "acquisitionValue" | "residualValue" | "inServiceDate">,
  category: Pick<DepreciationCategory, "ratePct" | "usefulLifeYears">,
  refYear: number = new Date().getUTCFullYear(),
): number {
  const s = depreciationSummary(asset, category);
  if (refYear < s.startYear) return 0;
  const startInYear = refYear === s.startYear ? s.startMonth : 1;
  const monthsInYear = 12 - startInYear + 1;
  const yearsFromStart = refYear - s.startYear;
  const monthsBefore =
    yearsFromStart === 0 ? 0 : 12 - s.startMonth + 1 + (yearsFromStart - 1) * 12;
  const totalMonths = s.usefulLifeYears * 12;
  const remaining = Math.max(0, totalMonths - monthsBefore);
  const effectiveMonths = Math.min(monthsInYear, remaining);
  return round2(s.monthlyDepreciation * effectiveMonths);
}

// Mais-valia / Menos-valia contabilística no abate/alienação
export function gainOrLoss(netBookValue: number, disposalValue: number) {
  const diff = round2(disposalValue - netBookValue);
  return {
    amount: diff,
    type: diff > 0 ? "mais-valia" : diff < 0 ? "menos-valia" : "neutro",
  } as const;
}
