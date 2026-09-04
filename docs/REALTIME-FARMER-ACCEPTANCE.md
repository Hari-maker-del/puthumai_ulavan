# Real-Time Farmer Acceptance Test

## A. Authentication
1. Create a new account.
2. Receive the real Supabase verification email.
3. Click the link.
4. Confirm `/auth/callback` succeeds.
5. Confirm the user reaches the dashboard.
6. Log out.
7. Log in again.
8. Test forgot/reset password.

## B. Same-account realtime
Use two browsers/devices with the SAME farmer account.

### Farm
- Device A creates a farm.
- Device B sees it without refresh.
- A edits it.
- B sees the edit.
- A deletes it.
- B sees deletion.

### Crop
Repeat create/edit/delete.

### Expense
Repeat create/edit/delete.

### Alerts
Create/acknowledge an alert and verify the second device updates.

### Recommendations
Create/update an AI recommendation and verify the second device receives it.

## C. Offline/reconnect
1. Open the app on Device B.
2. Disable internet.
3. Make a supported offline change.
4. Re-enable internet.
5. Verify queued work syncs exactly once.
6. Verify the authoritative server state is restored.
7. Verify no duplicate records.

## D. RLS isolation
Use TWO DIFFERENT accounts.

- Farmer A must never see Farmer B's farms.
- Farmer A must never see Farmer B's expenses.
- Farmer A must never receive Farmer B's realtime events.
- Direct database/API attempts must be denied.
- Repeat in reverse.

## E. External APIs
Weather:
- valid key
- invalid key
- timeout/offline
- stale cache label

Gemini:
- valid key
- invalid key
- quota/429
- timeout/offline

The UI must never turn API failure into a white screen.

## F. Mobile
On a real Android device:
- login
- signup
- verification
- camera/crop health
- microphone/voice if enabled
- expense form
- charts
- alerts
- offline/reconnect
- Tamil + English
- 320/360/412px layouts

## PASS CRITERIA

The product can be called "real-time farmer ready" only after A-F pass against the real deployed environment.
