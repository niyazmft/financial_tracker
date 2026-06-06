## 2024-06-03 - [Parallel Paginated NocoDB Fetches]

**Learning:** Sequential `while (true)` loops for API pagination block the event loop and increase latency linearly with page count (O(N) network roundtrips). NocoDB's `pageInfo.totalRows` allows pre-calculating necessary pages for concurrent execution.
**Action:** Always extract the total page count on the first request and use `Promise.all` to fetch the remaining pages concurrently, reducing total fetch time to approximately O(1) network roundtrip time, while preserving data order.

## 2024-06-06 - [O(1) Dictionary Lookup]

**Learning:** `!Object.keys(map).includes(id.toString())` operates in O(N) time as it has to generate an array of keys and then iterate through the array to check for inclusion. Direct property access `!map[id]` does the same check in O(1) time.
**Action:** Replace `Object.keys().includes()` with direct property access for dictionaries / objects mapping keys to values when evaluating key existence.
