# Puthumai Uzhavan Realtime 5.0

## What is live

The authenticated dashboard establishes Supabase Realtime subscriptions for:
- farms
- expenses
- crops
- farmer_alerts
- recommendations
- market_prices

A database change causes the active route to refresh from authoritative server data,
so UI state is not permanently dependent on a single event payload.

Expenses and farms also have targeted realtime hooks for lower-latency updates.

## Connection resilience

- connecting/subscribed/error/closed status
- bounded reconnect backoff
- browser online/offline awareness
- cleanup on unmount
- debounced route refresh to avoid render storms

## Security

Realtime never replaces RLS. Configure RLS on every user-owned table. For tables
without a safe user filter in the client, the subscription is intentionally
unfiltered and relies on Supabase RLS to decide which rows the authenticated user
may receive.

## External services

Weather and Gemini remain request-driven APIs. "Realtime" means database state
propagation; it does not mean a third-party API is streamed continuously.

## Acceptance test

Use two browsers/devices with the same user:
1. create/update/delete a farm
2. create/update/delete an expense
3. change a crop
4. create/acknowledge an alert
5. create a recommendation
6. change a market price record

Every change must appear without manual refresh.

Then use two different accounts and prove no cross-account records/events are visible.

Finally:
1. disconnect device B
2. change data on device A
3. reconnect B
4. confirm B refreshes from authoritative server state
5. verify no duplicate rows and no lost changes
