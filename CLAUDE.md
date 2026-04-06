# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CRM system built with Next.js 15, MongoDB (via Mongoose), and TailwindCSS for managing leads, tracking customer interactions, and analyzing sales performance. Features JWT-based authentication with role-based access control (Admin/User roles).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Setup

Requires `.env.local` with:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token signing secret
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)

Initialize database with default data (admin user, products, sources):
```bash
curl -X POST http://localhost:3000/api/init
```

Default admin credentials after init: `admin@crm.com` / `admin123`

## Architecture

### Data Models

Core models in `src/models/`:

- **User**: Authentication and role management. Pre-save hook hashes passwords with bcrypt. Method `comparePassword()` for authentication. Roles: `admin`, `user`.
- **Lead**: Core business entity. References `Product`, `Source`, and `User` (assignedTo, createdBy). Statuses: New, Contacted, In Progress, Converted, Lost, Follow-up. Indexed on `assignedTo`, `status`, `createdAt`, `followUpDate`.
- **Interaction**: Activity logs tied to leads. Types: Call, Email, WhatsApp, Meeting, Note. Tracks outcomes, status changes, and follow-up scheduling. Indexed on `lead` and `user` with `createdAt`.
- **Product**: Product catalog items that leads are interested in.
- **Source**: Lead source tracking (e.g., website, referral, cold call).
- **LeadRequest**: Workflow for users to request lead assignments from admins. Statuses: pending, approved, rejected.

### Authentication Flow

1. JWT tokens generated in `src/lib/auth.js` via `generateToken()`, signed with `JWT_SECRET`, 7-day expiry
2. Tokens stored in cookies (key: `token`) or Authorization header (`Bearer <token>`)
3. `authenticateUser()` extracts and verifies tokens, returns decoded payload (`userId`, `email`, `role`)
4. All protected API routes call `authenticateUser()` first, return 401 if unauthorized
5. Role-based filtering: users see only assigned leads, admins see all leads

### Database Connection

- Singleton pattern in `src/lib/mongodb.js` using cached global connection
- Prevents connection exhaustion in serverless environment
- Always import and call `connectToDatabase()` before any database operation in API routes

### API Routes Structure

Located in `src/app/api/`:

**Authentication** (`/api/auth/`):
- `login/route.js` - POST: Authenticate user, returns JWT token
- `logout/route.js` - POST: Clear auth cookie
- `me/route.js` - GET: Get current user profile
- `register-admin/route.js` - POST: Admin creates new users

**Leads** (`/api/leads/`):
- `route.js` - GET: List leads (filtered by role), POST: Create lead
- `[id]/route.js` - GET: Lead details, PUT: Update lead, DELETE: Delete lead (admin only)
- `reassign/route.js` - POST: Reassign lead (admin only)
- `bulk-assign/route.js` - POST: Bulk assign leads
- `bulk-status/route.js` - POST: Bulk update lead statuses
- `bulk-delete/route.js` - POST: Bulk delete leads (admin only)

**Admin** (`/api/admin/`):
- `users/route.js` - GET: List all users, POST: Create user
- `users/[id]/route.js` - GET/PUT/DELETE: Manage specific user
- `employee/[id]/` - Stats, leads, and activity for specific employee
- `upload-leads/route.js` - POST: Bulk CSV/Excel lead import (uses PapaParse)
- `seed/route.js` - POST: Seed database with sample data

**Others**:
- `/api/interactions` - POST: Create interaction log
- `/api/products` - GET/POST: Manage product catalog
- `/api/sources` - GET/POST: Manage lead sources
- `/api/lead-requests` - Lead request workflow for users
- `/api/dashboard/stats` - Dashboard statistics
- `/api/analytics` - Analytics data
- `/api/init` - Database initialization

### Key Access Control Patterns

**Users (role: 'user')**:
- Can only access leads where `lead.assignedTo === user.userId`
- API routes apply filter: `query.assignedTo = user.userId`
- Cannot access admin routes, bulk operations, or reassignment

**Admins (role: 'admin')**:
- Full access to all leads and operations
- Can filter by user/unassigned in GET requests via `assignedTo` query param
- Exclusive access to user management, bulk operations, CSV upload, lead reassignment

### Frontend Structure

- **Pages**: `src/app/dashboard/`, `src/app/leads/`, `src/app/admin/`, `src/app/analytics/`, `src/app/login/`
- **Components**: Organized in `src/components/` - auth, layout, and ui directories
- **Routing**: Next.js App Router with dynamic routes (e.g., `/leads/[id]`)

### Database Indexes

Ensure performance for common queries:
- Leads: `{assignedTo: 1, status: 1}`, `{createdAt: -1}`, `{followUpDate: 1}`
- Interactions: `{lead: 1, createdAt: -1}`, `{user: 1, createdAt: -1}`
- LeadRequest: `{requestedBy: 1, status: 1}`, `{status: 1, createdAt: -1}`

## Common Development Patterns

### Adding New API Routes

1. Create route handler in appropriate `src/app/api/` directory
2. Import and call `connectToDatabase()` at start
3. Use `authenticateUser(request)` for protected routes
4. Apply role-based filtering (check `user.role`)
5. Return JSON responses via `NextResponse.json()`

### Modifying Lead Schema

1. Update `src/models/Lead.js` Mongoose schema
2. Update API route validation (GET/POST/PUT in `/api/leads`)
3. Update frontend forms and display components
4. Consider adding indexes for new filterable fields

### Adding New Interaction Types

1. Add to `type` enum in `src/models/Interaction.js`
2. Update interaction creation forms in lead detail pages
3. Update interaction display logic if type requires special handling

## Testing Database Changes

Use `/api/init` for clean slate or `/api/admin/seed` for sample data. Debug user data at `/debug-users` page or `/api/debug/users` endpoint.
