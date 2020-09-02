# Migration `20200902042905-removed-travis-test-field`

This migration has been generated by Zen Software at 9/1/2020, 10:29:06 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
ALTER TABLE "public"."User" DROP COLUMN "travisField"
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200901154016-travis-field-integrated..20200902042905-removed-travis-test-field
--- datamodel.dml
+++ datamodel.dml
@@ -2,9 +2,9 @@
 // learn more about it in the docs: https://pris.ly/d/prisma-schema
 datasource db {
   provider = "postgresql"
-  url = "***"
+  url = "***"
 }
 generator client {
   provider = "prisma-client-js"
@@ -23,9 +23,8 @@
   group     Group?    @relation(fields: [groupId], references: [id])
   groupId   Int?
   /// @onDelete(SET_NULL)
   comments  Comment[]
-  travisField String?
 }
 model Post {
   id        Int       @default(autoincrement()) @id
```

