const assert = require('assert');
const { getLookaheadDates, formatDateForDisplay } = require('../utils/dateUtils');

describe('dateUtils', () => {
    describe('getLookaheadDates', () => {
        let OriginalDate;

        beforeEach(() => {
            OriginalDate = global.Date;

            const fixedTime = new OriginalDate('2023-05-15T12:00:00Z').getTime();

            class MockDate extends OriginalDate {
                constructor(...args) {
                    if (args.length === 0) {
                        super(fixedTime);
                    } else {
                        super(...args);
                    }
                }
                getFullYear() { return this.getUTCFullYear(); }
                getMonth() { return this.getUTCMonth(); }
                getDate() { return this.getUTCDate(); }
            }

            MockDate.now = () => fixedTime;
            MockDate.UTC = OriginalDate.UTC;

            global.Date = MockDate;
        });

        afterEach(() => {
            global.Date = OriginalDate;
        });

        it('should return 30 days ahead by default', () => {
            const result = getLookaheadDates();
            assert.deepStrictEqual(result, {
                startDate: '2023-05-15',
                endDate: '2023-06-14' // 30 days after May 15
            });
        });

        it('should handle custom duration days', () => {
            const result = getLookaheadDates(7);
            assert.deepStrictEqual(result, {
                startDate: '2023-05-15',
                endDate: '2023-05-22'
            });
        });

        it('should handle string input for duration', () => {
            const result = getLookaheadDates('10');
            assert.deepStrictEqual(result, {
                startDate: '2023-05-15',
                endDate: '2023-05-25'
            });
        });

        it('should handle month boundaries correctly', () => {
            const OriginalDateLocal = OriginalDate;
            const fixedTime = new OriginalDateLocal('2023-01-31T12:00:00Z').getTime();
            class MockDate extends OriginalDateLocal {
                constructor(...args) {
                    if (args.length === 0) super(fixedTime);
                    else super(...args);
                }
            }
            MockDate.now = () => fixedTime;
            MockDate.UTC = OriginalDateLocal.UTC;
            global.Date = MockDate;

            const result = getLookaheadDates(5);
            assert.deepStrictEqual(result, {
                startDate: '2023-01-31',
                endDate: '2023-02-05'
            });
        });

        it('should handle leap years correctly', () => {
            const OriginalDateLocal = OriginalDate;
            const fixedTime = new OriginalDateLocal('2024-02-28T12:00:00Z').getTime();
            class MockDate extends OriginalDateLocal {
                constructor(...args) {
                    if (args.length === 0) super(fixedTime);
                    else super(...args);
                }
            }
            MockDate.now = () => fixedTime;
            MockDate.UTC = OriginalDateLocal.UTC;
            global.Date = MockDate;

            const result = getLookaheadDates(2);
            assert.deepStrictEqual(result, {
                startDate: '2024-02-28',
                endDate: '2024-03-01'
            });
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format a valid Date object correctly', () => {
            const date = new Date('2023-12-25T00:00:00Z');
            assert.strictEqual(formatDateForDisplay(date), 'Dec 25, 2023');
        });

        it('should format a valid ISO string correctly', () => {
            assert.strictEqual(formatDateForDisplay('2023-07-04T00:00:00Z'), 'Jul 4, 2023');
        });

        it('should return "Invalid Date" for invalid date strings', () => {
            assert.strictEqual(formatDateForDisplay('invalid-date-string'), 'Invalid Date');
        });

        it('should return "Invalid Date" for invalid non-string inputs', () => {
            assert.strictEqual(formatDateForDisplay({}), 'Invalid Date');
        });

        it('should handle YYYY-MM-DD input format correctly', () => {
            assert.strictEqual(formatDateForDisplay('2023-01-15'), 'Jan 15, 2023');
        });
    });
});
