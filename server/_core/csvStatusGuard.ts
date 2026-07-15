/**
 * Decide whether a CSV re-import may change vehicle status.
 * Sold units stay sold unless the CSV explicitly keeps them sold/reserved.
 */
export function shouldApplyCsvStatus(
  existingStatus: string | null | undefined,
  csvStatus: string | null | undefined,
): boolean {
  if (!csvStatus || csvStatus === existingStatus) return false;
  const existingSold = existingStatus === "sold";
  const csvUnmarkingSold =
    existingSold && csvStatus !== "sold" && csvStatus !== "reserved";
  return !csvUnmarkingSold;
}
