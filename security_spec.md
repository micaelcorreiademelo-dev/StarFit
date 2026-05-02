# Security Specification

## Data Invariants
1. A user can only read and write their own profile in `/users/{userId}`.
2. A trainer can manage their own profile in `/trainers/{userId}`.
3. A student's stats in `/students/{userId}` can be read by the student and their linked trainer.
4. Workouts can be read by their creator (trainer) or the assigned student.
5. Agenda events can only be managed by the trainer who created them.
6. Link requests can be created by trainers and read/updated by the target student or the creator trainer.
7. Chat messages can only be read/written by the participants of the chat.

## The "Dirty Dozen" Payloads
1. User A trying to update User B's profile.
2. User attempting to set their role to "ADMIN" without being an admin.
3. Trainer A trying to delete Trainer B's workouts.
4. Student attempting to modify their own weight history with a future timestamp.
5. Unauthorized user trying to read a private chat between Trainer A and Student B.
6. User trying to create an account with a fake `email_verified` claim.
7. User trying to inject a 1MB string into a workout name.
8. Trainer trying to approve a link request for another trainer.
9. Student trying to change their assigned trainer without a valid request.
10. Unauthenticated user trying to list any collection.
11. User trying to update an immutable field like `createdAt`.
12. User trying to create a document with an invalid ID (e.g., using special characters).

## The Test Runner
A `firestore.rules.test.ts` will verify these cases once implemented.
