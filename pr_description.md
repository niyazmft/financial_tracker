🎯 **What:** The vulnerability fixed
Added a null and empty object check to `transactionController.js`'s `getTransactionById` method. This check prevents accessing the `user_id` property of a `transaction` object that might be null or empty when a transaction is not found.

⚠️ **Risk:** The potential impact if left unfixed
If left unfixed, calling this endpoint with a non-existent transaction ID would result in a `TypeError: Cannot read properties of null (reading 'user_id')` or similar errors at runtime. This causes the backend process to throw unhandled exceptions, potentially leading to application crashes, denial of service, or leaking of stack traces to the client depending on error handling configuration.

🛡️ **Solution:** How the fix addresses the vulnerability
A check was added immediately after fetching the transaction from the NocoDB service:

```javascript
if (!transaction || Object.keys(transaction).length === 0) {
    return next(new AppError('Transaction not found.', 404));
}
```

This safely catches the null/empty case, returning a proper 404 AppError instead of crashing the process. This follows the codebase convention of checking for null/empty database records before verifying ownership permissions.
