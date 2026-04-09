const assert = require('assert');
const sinon = require('sinon');
const { getLookaheadDates, formatDateForDisplay } = require('../utils/dateUtils');

describe('Date Utils', () => {
    describe('getLookaheadDates', () => {
        let clock;

        beforeEach(() => {
            // Mock Date to a fixed timestamp for deterministic tests
            // e.g., '2023-10-15T12:00:00Z'
            clock = sinon.useFakeTimers(new Date('2023-10-15T12:00:00Z').getTime());
        });

        afterEach(() => {
            clock.restore();
        });

        it('should return correct start and end dates with default duration (30 days)', () => {
            const result = getLookaheadDates();
            assert.strictEqual(result.startDate, '2023-10-15');
            // 30 days after Oct 15 is Nov 14
            assert.strictEqual(result.endDate, '2023-11-14');
        });

        it('should return correct start and end dates for a specified duration', () => {
            const result = getLookaheadDates(10);
            assert.strictEqual(result.startDate, '2023-10-15');
            // 10 days after Oct 15 is Oct 25
            assert.strictEqual(result.endDate, '2023-10-25');
        });

        it('should handle string input for duration', () => {
            const result = getLookaheadDates('15');
            assert.strictEqual(result.startDate, '2023-10-15');
            // 15 days after Oct 15 is Oct 30
            assert.strictEqual(result.endDate, '2023-10-30');
        });

        it('should handle negative duration correctly', () => {
            const result = getLookaheadDates(-5);
            assert.strictEqual(result.startDate, '2023-10-15');
            // -5 days from Oct 15 is Oct 10
            assert.strictEqual(result.endDate, '2023-10-10');
        });
    });

    describe('formatDateForDisplay', () => {
        it('should correctly format a Date object', () => {
            const date = new Date('2023-12-25T10:00:00Z');
            const result = formatDateForDisplay(date);
            assert.strictEqual(result, 'Dec 25, 2023');
        });

        it('should correctly format a string date', () => {
            const result = formatDateForDisplay('2023-01-01T00:00:00Z');
            assert.strictEqual(result, 'Jan 1, 2023');
        });

        it('should correctly format a string date without time', () => {
            const result = formatDateForDisplay('2023-05-15');
            assert.strictEqual(result, 'May 15, 2023');
        });

        it('should correctly format a timestamp (number)', () => {
            const timestamp = new Date('2023-07-04T00:00:00Z').getTime();
            const result = formatDateForDisplay(timestamp);
            assert.strictEqual(result, 'Jul 4, 2023');
        });

        it('should return "Invalid Date" for an invalid date string', () => {
            const result = formatDateForDisplay('not-a-date');
            assert.strictEqual(result, 'Invalid Date');
        });

        it('should handle null and undefined', () => {
            const resultUndefined = formatDateForDisplay(undefined);
            assert.strictEqual(resultUndefined, 'Invalid Date');

            const resultNull = formatDateForDisplay(null);
            assert.strictEqual(resultNull, 'Jan 1, 1970'); // new Date(null) is 1970-01-01
        });
    });
});
