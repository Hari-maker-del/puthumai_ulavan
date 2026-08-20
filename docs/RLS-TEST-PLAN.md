# Supabase RLS Two-User Test Plan

Create two staging users A and B.

1. A creates farmer memory, conversation, alert, crop, expense, and market rows.
2. B creates equivalent rows.
3. As A, query each table and confirm B's private rows are not returned.
4. As A, attempt INSERT using `user_id = B.id`; it must fail.
5. As A, attempt UPDATE/DELETE on B's rows; it must affect zero rows or be rejected.
6. Repeat as B against A.
7. Confirm market `is_verified` cannot be self-promoted by a normal browser client.
8. Confirm only the intended verified shared market records are visible.
9. Verify admin operations use trusted server/database authorization rather than hidden frontend UI.
