## 2024-06-02 - [Parallelize NocoDB Pagination]

**Learning:** Sequential `while(true)` loops for fetching paginated records from NocoDB create severe network bottlenecks when dealing with large datasets, as each request must wait for the previous one to complete.
**Action:** The NocoDB API response includes a `pageInfo` object with a `totalRows` property. Use this to calculate the total number of pages needed after the first request, and then fetch all subsequent pages concurrently using `Promise.all()`. This changes an O(N) network operation to concurrent calls.
