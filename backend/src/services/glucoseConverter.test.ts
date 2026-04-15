import { mmolToMgdl, mgdlToMmol } from './glucoseConverter';

describe('GlucoseConverterService', () => {
  describe('mmolToMgdl', () => {
    it('should convert 5.5 mmol/L to 99 mg/dL', () => {
      expect(mmolToMgdl(5.5)).toBeCloseTo(99, 0);
    });

    it('should convert 7.0 mmol/L to 126 mg/dL', () => {
      expect(mmolToMgdl(7.0)).toBeCloseTo(126, 0);
    });

    it('should convert 0 mmol/L to 0 mg/dL', () => {
      expect(mmolToMgdl(0)).toBe(0);
    });
  });

  describe('mgdlToMmol', () => {
    it('should convert 99 mg/dL to approximately 5.5 mmol/L', () => {
      expect(mgdlToMmol(99)).toBeCloseTo(5.5, 1);
    });

    it('should convert 126 mg/dL to 7.0 mmol/L', () => {
      expect(mgdlToMmol(126)).toBeCloseTo(7.0, 1);
    });

    it('should convert 0 mg/dL to 0 mmol/L', () => {
      expect(mgdlToMmol(0)).toBe(0);
    });
  });
});
