## 2024-06-03 - [Parallel Paginated NocoDB Fetches]

**Learning:** Sequential `while (true)` loops for API pagination block the event loop and increase latency linearly with page count (O(N) network roundtrips). NocoDB's `pageInfo.totalRows` allows pre-calculating necessary pages for concurrent execution.
**Action:** Always extract the total page count on the first request and use `Promise.all` to fetch the remaining pages concurrently, reducing total fetch time to approximately O(1) network roundtrip time, while preserving data order.
