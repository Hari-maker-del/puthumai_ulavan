# Authentication Production Setup

## Production callback
Configure Supabase Authentication → URL Configuration:

`https://puthumai-ulavan.vercel.app/auth/callback`

## Local callback
`http://localhost:5173/auth/callback`

## Verification flow
Signup → Supabase email → `/auth/callback` → Supabase verification → session → profile → dashboard.

The client never marks a user verified manually.

## Real tests
Automated CI checks the code/build contract. Real email verification and two-user RLS tests must be executed against the actual Supabase project and a test mailbox.

## Password reset
Password recovery remains on `/reset-password` and is handled separately from signup verification.
