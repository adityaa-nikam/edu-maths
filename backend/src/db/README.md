# Database Setup

## PostgreSQL with Drizzle ORM

The backend uses **Drizzle ORM** with **PostgreSQL** (Supabase) for database management.

### Installed Packages
- `drizzle-orm` - ORM library
- `postgres` - PostgreSQL driver
- `drizzle-kit` - Migration tool (dev dependency)

### Database Connection

Connection is configured in `src/db/index.ts`:
- Uses lazy initialization to avoid environment variable issues
- Exports `db` instance for queries
- Exports `testConnection()` for health checks

### Configuration

Database URL is stored in `.env`:
```
DATABASE_URL=postgresql://...
```

Drizzle config is in `drizzle.config.ts` (ready for future migrations).

### Usage

```typescript
import { db } from './db';

// Use db instance for queries (once schemas are created)
```

### Status
✅ Database connection established
⏳ Schema/tables pending (Phase 1)
⏳ Migrations pending (Phase 1)
