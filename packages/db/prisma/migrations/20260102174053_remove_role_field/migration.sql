-- Drop the index on role column
DROP INDEX IF EXISTS "users_role_idx";

-- Drop the role column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

-- Drop the UserRole enum type
DROP TYPE IF EXISTS "UserRole";
