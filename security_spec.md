# Security Specification for Saring

## 1. Data Invariants
- A `User` profile must have an ID that strictly matches `request.auth.uid`.
- A `User` can only read and write their own profile data.
- A `Report` must have a valid `userId` matching `request.auth.uid`.
- A `Report` cannot have its `status` changed by a normal user (only an admin could theoretically, but we don't have admins so it shouldn't change, or it's restricted).
- `createdAt` must match `request.time` during document creation.
- `updatedAt` must match `request.time` during update.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing (Create User)**: Try creating a `user` document where the document ID `users/(spoofUid)` does not match `request.auth.uid`.
2. **Ghost Field (Create Report)**: Pass `isAdmin: true` disguised in a report creation payload.
3. **Invalid Status Transition (Update Report)**: Try to update a pending report to `verified` as a normal user.
4. **Denial of Wallet - Size Injection**: Set the `description` of a `Report` to a 2MB string.
5. **Time Travel**: Create a `Report` but set `createdAt` to yesterday.
6. **Cross-Tenant Ownership Override**: Attempt to update another user's `Report` where `userId` does not match auth identity.
7. **Type Poisoning**: Set `description` to an integer.
8. **Missing Required Field**: Try to create a `Report` without a `userId`.
9. **Blanket Read (PII Data)**: Attempt to read `users` list.
10. **Immutable Field Modification**: Attempt to change `createdAt` during an update.
11. **Spoofed Email Update**: Updating email without email verified.
12. **Wrong Type for Timestamp**: Set `createdAt` to "2024-01-01" instead of a Firestore Timestamp.

## 3. Test Runner
We will generate `firestore.rules.test.ts` to implement these tests.
