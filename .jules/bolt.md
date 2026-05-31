## 2024-06-01 - [Map-Based Aggregation for O(1) Lookups in Backend Cash Flow Service]

**Learning:** The `computeForecast` method in `backend/services/cashFlowService.js` was previously filtering the entire transaction list multiple times for every budget category (O(N*M)). Furthermore, `new Date()` was instantiated excessively within loops.
**Action:** When filtering array data iteratively against categories or other identifiers in tight loops, construct a `Map` array grouping in a single pass up front (reducing complexity to O(N+M)), and cache derived data (like parsed timestamps) directly onto the objects to avoid repeated instantiation.
