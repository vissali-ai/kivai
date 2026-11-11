export type BrandFinances = { budget:number; price:number; unitCost:number; fee:number; lot:number; setup:number; fixed:number };
export function brandFinancials(f: BrandFinances) {
  const cents = (value:number) => Math.round((value + Number.EPSILON) * 100);
  const price = cents(f.price);
  const cost = cents(f.unitCost);
  const contribution = price - cost - Math.round(price * f.fee / 100);
  const initial = cents(f.setup) + cost * f.lot;
  return {
    contributionPerUnit: contribution / 100,
    contributionMarginPercent: price > 0 ? contribution * 100 / price : null,
    initialLotAndSetup: initial / 100,
    remainingBudget: (cents(f.budget) - initial) / 100,
    monthlyBreakEvenUnits: contribution > 0 ? Math.ceil(cents(f.fixed) / contribution) : null,
  };
}
