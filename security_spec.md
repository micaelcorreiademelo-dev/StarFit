# Security Specification - StarFit

## 1. Data Invariants
- A `linkRequest` must have a valid `studentId` and `trainerId`.
- Only a student can create a `linkRequest`.
- Only the target trainer can approve/reject a `linkRequest`.
- A trainer can only update a student's `trainerId` if they have an approved `linkRequest` from that student.
- Users cannot change their own `role` or `email`.
- `trainerId` can only be updated by the student (owner) or the trainer being linked via a request.

## 2. The "Dirty Dozen" Payloads (Logical Attack Vectors)
1. **Identity Spoofing**: Student A creates a request claiming to be Student B.
2. **Approval Hijacking**: Trainer A approves a request meant for Trainer B.
3. **Role Escalation**: Student updates their own doc to set `role: 'ADMIN'`.
4. **Trainer Hijack**: Trainer A updates a student's `trainerId` to their own UID without a request.
5. **PII Leak**: Student A reads Student B's private data (phone/email).
6. **Ghost Field Injection**: Adding `isVerified: true` to a user doc during update.
7. **Timestamp Fraud**: Creating a request with a `createdAt` in the future.
8. **Orphaned Request**: Creating a request for a non-existent trainer.
9. **Spam Requests**: Creating 100 requests in 1 second (Rate limiting - rules can't do full rate limiting but can check existence).
10. **Immutable Field Mutate**: Changing `createdAt` on an existing document.
11. **Cross-Tenant Write**: Trainer A deleting a workout created by Trainer B.
12. **Status Skipping**: Student updating request status directly to 'approved'.

## 3. Test Runner (Conceptual)
The following rules will be tested against these vectors.
