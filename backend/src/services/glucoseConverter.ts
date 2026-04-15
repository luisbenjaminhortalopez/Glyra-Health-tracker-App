/**
 * GlucoseConverterService
 * Converts glucose values between mmol/L and mg/dL units.
 * Conversion factor: 1 mmol/L = 18 mg/dL
 */

export function mmolToMgdl(mmol: number): number {
  return mmol * 18;
}

export function mgdlToMmol(mgdl: number): number {
  return mgdl / 18;
}
