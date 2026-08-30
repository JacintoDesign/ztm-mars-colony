# Database law

This database is shared by two unrelated applications.

## Namespacing
- This project owns tables prefixed `marscolony_` and nothing else.
- Tables prefixed `waypoint_` belong to a different application.
  Never read, write, alter or reference them.
- The auth tables are common to both. Read them. Never alter their
  structure.
- Each application keeps its own user table. `marscolony_users` and
  `waypoint_users` are not the same table and never share rows.

## Access
- Every `marscolony_` table has an owner column referencing the
  authenticated user.
- Row-level security is enabled on every `marscolony_` table, scoped
  to the current user for select, insert, update and delete.
- Application code uses the session's credentials so those policies
  apply. The service role key is not used by application code.

## Migrations
- Migration files are prefixed `marscolony_` and only ever contain
  statements affecting `marscolony_` tables.
- Never run a command operating on the whole remote schema — reset,
  pull, or equivalent. Those are project-wide.
- Never drop a table. Propose the change and stop.