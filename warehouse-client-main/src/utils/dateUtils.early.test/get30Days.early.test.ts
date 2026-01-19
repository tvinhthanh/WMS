import { get30Days } from '../dateUtils';

// src/utils/dateUtils.get30Days.test.ts
describe('get30Days() get30Days method', () => {
  // Happy Paths
  describe('Happy Paths', () => {
    beforeEach(() => {
      // Reset system time before each test to avoid side effects
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-12-31T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return an array of 30 dates in YYYY-MM-DD format', () => {
      // This test ensures the function returns 30 dates in the correct format.
      const result = get30Days();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(30);
      result.forEach(dateStr => {
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should return dates in ascending order from 29 days ago to today', () => {
      // This test checks that the dates are in ascending order, ending with today.
      const result = get30Days();
      const expectedStart = new Date('2023-12-02T12:00:00.000Z');
      for (let i = 0; i < 30; i++) {
        const expectedDate = new Date(expectedStart);
        expectedDate.setDate(expectedStart.getDate() + i);
        const expectedStr = expectedDate.toISOString().split('T')[0];
        expect(result[i]).toBe(expectedStr);
      }
    });

    it('should include today as the last date in the array', () => {
      // This test ensures the last date is today.
      const result = get30Days();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      expect(result[29]).toBe(todayStr);
    });

    it('should include the date 29 days ago as the first date in the array', () => {
      // This test ensures the first date is 29 days before today.
      const result = get30Days();
      const date = new Date();
      date.setDate(date.getDate() - 29);
      const expectedStr = date.toISOString().split('T')[0];
      expect(result[0]).toBe(expectedStr);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle month boundaries correctly (e.g., from Jan to Feb)', () => {
      // This test checks that the function correctly handles month transitions.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-01T12:00:00.000Z'));
      const result = get30Days();
      expect(result[0]).toBe('2024-01-03');
      expect(result[29]).toBe('2024-02-01');
    });

    it('should handle year boundaries correctly (e.g., from Dec to Jan)', () => {
      // This test checks that the function correctly handles year transitions.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-05T12:00:00.000Z'));
      const result = get30Days();
      expect(result[0]).toBe('2023-12-07');
      expect(result[29]).toBe('2024-01-05');
    });

    it('should handle leap years correctly (e.g., Feb 29)', () => {
      // This test checks that the function includes Feb 29 in a leap year.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-01T12:00:00.000Z'));
      const result = get30Days();
      expect(result).toContain('2024-02-29');
      expect(result[28]).toBe('2024-02-29');
      expect(result[29]).toBe('2024-03-01');
    });

    it('should handle daylight saving time changes without skipping or duplicating dates', () => {
      // This test checks that the function does not skip or duplicate dates during DST changes.
      // Using US DST start: 2024-03-10
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T12:00:00.000Z'));
      const result = get30Days();
      // Ensure all dates are unique and consecutive
      const uniqueDates = new Set(result);
      expect(uniqueDates.size).toBe(30);
      // Check that the DST transition date is present
      expect(result).toContain('2024-03-10');
    });
  });
});