# DigiCRM - Architecture Analysis & Industry-Standard Roadmap

> Full analysis of the current CRM application with a roadmap to transform it into a **multi-tenant, scalable, feature-rich, industry-standard CRM**.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Architecture Overhaul Required](#2-architecture-overhaul-required)
3. [Feature Audit: What Exists vs What's Missing](#3-feature-audit-what-exists-vs-whats-missing)
4. [Multi-Tenancy Design](#4-multi-tenancy-design)
5. [State Management (Zustand)](#5-state-management-zustand)
6. [Caching Strategy (Redis + React Query)](#6-caching-strategy-redis--react-query)
7. [Backend Separation](#7-backend-separation)
8. [Database Optimization](#8-database-optimization)
9. [Security Hardening](#9-security-hardening)
10. [Performance Optimization](#10-performance-optimization)
11. [Industry-Standard Features Roadmap](#11-industry-standard-features-roadmap)
12. [DevOps & Infrastructure](#12-devops--infrastructure)
13. [Implementation Priority & Phases](#13-implementation-priority--phases)

---

## 1. Current State Summary

### Tech Stack
| Layer | Current | Status |
|-------|---------|--------|
| Framework | Next.js 15 (App Router) | Good |
| Database | MongoDB (Mongoose) | Good |
| Auth | Custom JWT (7-day expiry) | Needs hardening |
| State Mgmt | useState/useEffect only | Poor - needs Zustand |
| Caching | None | Critical gap |
| CSS | TailwindCSS v4 | Good |
| Forms | react-hook-form | Good |
| Charts | Recharts | Good |
| Icons | Lucide React | Good |

### What Works Well
- Clean folder structure following Next.js App Router conventions
- Proper Mongoose models with indexes on key fields
- Role-based access control (Admin/User) at API level
- Pagination on lead listings
- CSV bulk import/export
- Interaction logging system
- Lead request workflow (user requests leads -> admin approves)
- Analytics with conversion funnel, source analysis, monthly trends

### Critical Problems
| Problem | Impact | Current State |
|---------|--------|---------------|
| No multi-tenancy | Cannot serve multiple organizations | Single-tenant only |
| No state management | Redundant API calls, inconsistent UI | useState everywhere |
| No caching layer | Every page load hits DB | No Redis, no SWR/React Query |
| Monolithic backend | API routes tightly coupled to Next.js | Cannot scale independently |
| Security holes | `/api/auth/register-admin` has no auth check | Exploitable |
| No testing | Zero test files | High regression risk |
| No real-time updates | No WebSocket/SSE | Stale data between tabs |
| Client-side only rendering | No SSR/SSG used | Poor SEO, slow initial loads |

---

## 2. Architecture Overhaul Required

### Current Architecture (Monolithic)
```
Browser -> Next.js (Pages + API Routes) -> MongoDB
              |
         Everything in one process
```

### Target Architecture (Scalable)
```
Browser/Mobile
    |
    v
Next.js Frontend (Vercel/CDN)
    |
    v
API Gateway (Rate limiting, Auth, Routing)
    |
    +---> Auth Service (JWT, OAuth, 2FA)
    +---> Lead Service (CRUD, Assignment, Workflow)
    +---> Analytics Service (Aggregation, Reports)
    +---> Notification Service (Email, SMS, Push, WhatsApp)
    +---> Communication Service (Call logs, Email tracking)
    +---> File Service (Uploads, CSV, Documents)
    +---> Search Service (Elasticsearch)
    |
    v
Redis Cache Layer
    |
    v
MongoDB (Primary DB) + Read Replicas
    |
    v
Message Queue (BullMQ/RabbitMQ) -> Background Workers
```

### Key Architecture Changes

#### 2.1 Separate Frontend from Backend
```
Current:  src/app/api/* (API routes inside Next.js)
Target:   Standalone Express/Fastify backend OR Next.js API routes with proper middleware layers
```

**Why separate?**
- Next.js API routes have cold start issues on serverless
- Cannot scale API independently from frontend
- No middleware chaining support
- Cannot add WebSocket support easily
- Cannot share backend with mobile app

**Recommended approach (pragmatic):**
Keep Next.js API routes for now but add proper middleware layers. Extract to standalone backend when you need WebSocket support or mobile API.

#### 2.2 Add Middleware Layer
```
Current:  Each route manually calls authenticateUser() and connectToDatabase()
Target:   Centralized middleware pipeline
```

Create `src/middleware.js` (Next.js middleware) for:
- Authentication verification
- Rate limiting
- Request logging
- CORS handling
- Tenant resolution (multi-tenancy)

#### 2.3 Service Layer Pattern
```
Current:  API routes contain business logic directly
Target:   API Routes -> Service Layer -> Data Access Layer -> MongoDB
```

```
src/
  services/
    leadService.js       # Business logic for leads
    userService.js       # Business logic for users
    analyticsService.js  # Analytics computations
    notificationService.js
  repositories/
    leadRepository.js    # Database queries only
    userRepository.js
  middleware/
    auth.js
    rateLimit.js
    validate.js
    tenantResolver.js
```

---

## 3. Feature Audit: What Exists vs What's Missing

### Lead Management

| Feature | Status | Notes |
|---------|--------|-------|
| Create/Edit/Delete leads | Exists | Working |
| Lead status tracking (6 statuses) | Exists | New, Contacted, In Progress, Converted, Lost, Follow-up |
| Lead priority (Low/Med/High) | Exists | Working |
| Lead assignment to users | Exists | Admin can assign |
| Bulk assign leads | Exists | Admin only |
| Bulk status update | Exists | Working |
| Bulk delete | Exists | Admin only |
| CSV import | Exists | With flexible column mapping |
| CSV export | Exists | Working |
| Lead search (name/phone/email/company) | Exists | Basic text search |
| Lead filtering (status, assignedTo) | Exists | Basic filters |
| Lead sorting | Exists | Configurable columns |
| Pagination | Exists | Configurable page size |
| Lead value tracking | Exists | Currency field |
| Follow-up date scheduling | Exists | Date field |
| Lead request workflow | Exists | User requests -> Admin approves |
| **Duplicate lead detection** | **MISSING** | Critical for data quality |
| **Lead scoring** | **MISSING** | Auto-score based on engagement |
| **Lead merge** | **MISSING** | Combine duplicate records |
| **Lead tags/labels** | **MISSING** | Custom categorization |
| **Custom fields** | **MISSING** | User-defined fields |
| **Lead recycling/rotation** | **MISSING** | Auto-redistribute stale leads |
| **Lead nurturing sequences** | **MISSING** | Automated follow-up workflows |
| **Web-to-lead forms** | **MISSING** | Capture leads from website |
| **Lead stage pipeline (Kanban)** | **MISSING** | Visual drag-and-drop pipeline |
| **One Org can have sub caller (Kanban)** | **MISSING** | Visual drag-and-drop pipeline |

### Contact & Communication

| Feature | Status | Notes |
|---------|--------|-------|
| Interaction logging (Call/Email/WhatsApp/Meeting/Note) | Exists | Manual logging |
| Interaction outcome tracking | Exists | 6 outcomes |
| Communication history per lead | Exists | Timeline view |
| **Email integration (send/receive)** | **MISSING** | No email sending capability |
| **WhatsApp Business API integration** | **MISSING** | No actual WhatsApp connectivity |
| **Call integration (VoIP/Twilio)** | **MISSING** | No call functionality |
| **SMS integration** | **MISSING** | No SMS capability |
| **Email templates** | **MISSING** | No template system |
| **Email tracking (opens/clicks)** | **MISSING** | No tracking |
| **Call recording** | **MISSING** | No recording capability |
| **Chat/messaging system** | **MISSING** | No internal messaging |

### Sales Pipeline & Deals

| Feature | Status | Notes |
|---------|--------|-------|
| Status-based pipeline | Exists | 6 fixed statuses |
| Lead value tracking | Exists | Single value field |
| **Visual pipeline (Kanban board)** | **MISSING** | Industry standard |
| **Multiple pipelines** | **MISSING** | Different sales processes |
| **Deal/Opportunity entity** | **MISSING** | Separate from leads |
| **Quotation/Proposal generation** | **MISSING** | Document generation |
| **Invoice generation** | **MISSING** | Billing integration |
| **Revenue forecasting** | **MISSING** | Predictive analytics |
| **Win/Loss analysis** | **MISSING** | Post-deal analysis |
| **Sales goals & targets** | **MISSING** | Target vs actual tracking |
| **Commission tracking** | **MISSING** | Sales incentive management |

### Analytics & Reporting

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard stats (totals, conversion rate) | Exists | Basic stats |
| Conversion funnel | Exists | 6-stage funnel |
| Source analysis | Exists | Performance by source |
| Monthly trends | Exists | 12-month trend |
| Team performance table | Exists | Admin only |
| Lead value statistics | Exists | Basic stats |
| **Custom report builder** | **MISSING** | Industry standard |
| **Scheduled reports (email)** | **MISSING** | Automated reporting |
| **Export to PDF** | **MISSING** | Report export |
| **Sales forecasting** | **MISSING** | Predictive models |
| **Activity metrics per user** | **Partial** | Basic counts only |
| **Time-based analytics (response time, deal velocity)** | **MISSING** | Key performance metrics |
| **ROI by source** | **MISSING** | Cost tracking needed |
| **Funnel drop-off analysis** | **MISSING** | Where leads are lost |
| **Real-time dashboard** | **MISSING** | WebSocket-based live data |

### User & Team Management

| Feature | Status | Notes |
|---------|--------|-------|
| User CRUD (Admin) | Exists | Create/edit/delete users |
| Role-based access (Admin/User) | Exists | 2 roles |
| Employee performance view | Exists | Admin can view per-employee stats |
| **Team/Department hierarchy** | **MISSING** | No team structure |
| **Custom roles & permissions** | **MISSING** | Only 2 fixed roles |
| **Territory management** | **MISSING** | Geographic/account-based assignment |
| **User activity audit log** | **MISSING** | Who did what and when |
| **Login history** | **MISSING** | Security tracking |
| **User preferences/settings** | **MISSING** | Per-user configuration |

### Automation & Workflow

| Feature | Status | Notes |
|---------|--------|-------|
| Lead auto-assignment (to self for users) | Exists | Basic |
| Status update on interaction outcome | Exists | Auto-maps outcome to status |
| **Workflow automation engine** | **MISSING** | If-then rules |
| **Auto lead assignment (round-robin, load-based)** | **MISSING** | Intelligent distribution |
| **Follow-up reminders/notifications** | **MISSING** | Critical for CRM |
| **Email sequences/drip campaigns** | **MISSING** | Marketing automation |
| **Task/Todo system** | **MISSING** | User task management |
| **SLA tracking** | **MISSING** | Response time commitments |
| **Escalation rules** | **MISSING** | Auto-escalate stale leads |
| **Trigger-based actions** | **MISSING** | Event-driven automation |

### Notifications & Alerts

| Feature | Status | Notes |
|---------|--------|-------|
| **In-app notifications** | **MISSING** | Critical |
| **Email notifications** | **MISSING** | Lead assignment, follow-up reminders |
| **Push notifications** | **MISSING** | Mobile/browser push |
| **Follow-up reminders** | **MISSING** | Scheduled reminders |
| **Daily digest** | **MISSING** | Summary emails |
| **Real-time alerts** | **MISSING** | Instant notifications |

### Integration & API

| Feature | Status | Notes |
|---------|--------|-------|
| REST API | Exists | Internal use only |
| **Public API with API keys** | **MISSING** | Third-party integration |
| **Webhook support** | **MISSING** | Event notifications |
| **Zapier/Make integration** | **MISSING** | No-code automation |
| **Google Workspace integration** | **MISSING** | Calendar, Gmail, Contacts |
| **Microsoft 365 integration** | **MISSING** | Outlook, Teams |
| **Payment gateway (Razorpay/Stripe)** | **MISSING** | For deal closures |
| **Social media integration** | **MISSING** | LinkedIn, Facebook leads |
| **API documentation (Swagger)** | **MISSING** | Developer portal |

---

## 4. Multi-Tenancy Design

### Current: Single-Tenant
All data in one MongoDB database. No concept of "organizations" or "tenants."

### Target: Multi-Tenant Architecture

#### Strategy: Database-per-Tenant (Recommended for CRM)

```
Why database-per-tenant?
- Data isolation (compliance, security)
- Easy per-tenant backup/restore
- No risk of data leaks between tenants
- Independent scaling per tenant
- Simpler queries (no tenant filter everywhere)
```

#### Implementation Plan

**Step 1: Add Tenant/Organization Model**
```javascript
// src/models/Organization.js
{
  name: String,           // "Acme Corp"
  slug: String,           // "acme-corp" (subdomain)
  plan: String,           // "free", "pro", "enterprise"
  dbUri: String,          // Tenant-specific MongoDB URI
  settings: {
    logo: String,
    primaryColor: String,
    timezone: String,
    currency: String,
    dateFormat: String,
    leadStatuses: [String],  // Custom statuses per org
    customFields: [Object],  // Custom lead fields
  },
  billing: {
    stripeCustomerId: String,
    plan: String,
    seatsUsed: Number,
    seatsAllowed: Number,
  },
  isActive: Boolean,
  createdAt: Date,
}
```

**Step 2: Add Organization Reference to User**
```javascript
// Update User model
{
  ...existingFields,
  organizationId: ObjectId,  // Reference to Organization
  orgRole: String,           // 'owner', 'admin', 'manager', 'user'
}
```

**Step 3: Tenant Resolution Middleware**
```javascript
// src/middleware/tenantResolver.js
// Resolve tenant from:
//   1. Subdomain: acme.digicrm.com
//   2. Custom domain: crm.acmecorp.com
//   3. Header: X-Tenant-ID
//   4. JWT token payload
```

**Step 4: Database Connection Manager**
```javascript
// src/lib/tenantDb.js
// Maintain connection pool per tenant
// Cache connections (max 10 per tenant)
// Auto-close idle connections after 30 minutes
// Fall back to shared DB for small tenants
```

**Step 5: Tenant-Aware API Routes**
```javascript
// Every API route gets tenant context from middleware
// No manual tenant filtering needed in queries
// Queries automatically scoped to tenant's database
```

#### 3-Tier Tenant Model
```
Tier 1 - Free:        Shared database, shared collection with tenantId field
Tier 2 - Pro:         Shared database, separate collections per tenant
Tier 3 - Enterprise:  Dedicated database per tenant
```

---

## 5. State Management (Zustand)

### Current Problem
- `useState` + `useEffect` everywhere
- No shared state between components
- User data stored in `localStorage` (fragile)
- Every page fetches data independently
- No optimistic updates
- State lost on navigation

### Zustand Implementation Plan

#### Install
```bash
npm install zustand
```

#### Store Structure
```
src/
  stores/
    useAuthStore.js       # Auth state (user, token, login/logout)
    useLeadStore.js       # Leads state (list, filters, pagination, selected)
    useUIStore.js         # UI state (sidebar, modals, notifications)
    useNotificationStore.js  # Notifications
```

#### Auth Store
```javascript
// src/stores/useAuthStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        const res = await fetch('/api/auth/login', { ... })
        const data = await res.json()
        set({ user: data.user, token: data.token, isAuthenticated: true })
      },

      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()
          set({ user: data.user, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    { name: 'auth-storage' }
  )
)
```

#### Lead Store
```javascript
// src/stores/useLeadStore.js
export const useLeadStore = create((set, get) => ({
  leads: [],
  selectedLeads: [],
  filters: { status: '', search: '', assignedTo: '' },
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  isLoading: false,

  fetchLeads: async () => {
    set({ isLoading: true })
    const { filters, pagination } = get()
    const params = new URLSearchParams({ ...filters, page: pagination.page, limit: pagination.limit })
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    set({ leads: data.leads, pagination: data.pagination, isLoading: false })
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value }, pagination: { ...state.pagination, page: 1 } }))
    get().fetchLeads()
  },

  // Optimistic update example
  updateLeadStatus: async (leadId, newStatus) => {
    const previousLeads = get().leads
    // Optimistic update
    set(state => ({
      leads: state.leads.map(l => l._id === leadId ? { ...l, status: newStatus } : l)
    }))
    try {
      await fetch(`/api/leads/${leadId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
    } catch {
      set({ leads: previousLeads }) // Rollback on failure
    }
  },

  toggleSelectLead: (leadId) => { ... },
  selectAllLeads: () => { ... },
  clearSelection: () => { ... },
}))
```

#### UI Store
```javascript
// src/stores/useUIStore.js
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,      // 'addLead', 'bulkUpload', 'addUser', etc.
  modalData: null,
  notifications: [],

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (name, data) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  addNotification: (notification) => set(s => ({
    notifications: [...s.notifications, { id: Date.now(), ...notification }]
  })),
  removeNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
}))
```

### Benefits
- Eliminates prop drilling
- Centralized state for leads, auth, UI
- Optimistic updates (instant UI feedback)
- Persistent auth state (replaces localStorage hack)
- Shared filter/pagination state across components
- DevTools support for debugging

---

## 6. Caching Strategy (Redis + React Query)

### Layer 1: Client-Side Caching (TanStack React Query)

#### Install
```bash
npm install @tanstack/react-query
```

#### Setup
```javascript
// src/app/providers.js
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes before data is "stale"
      gcTime: 30 * 60 * 1000,        // 30 minutes in cache
      refetchOnWindowFocus: true,     // Refresh when user returns to tab
      retry: 2,
    },
  },
})
```

#### Usage Pattern
```javascript
// In components - replaces useState + useEffect + fetch
const { data, isLoading, error } = useQuery({
  queryKey: ['leads', filters, page],
  queryFn: () => fetchLeads(filters, page),
})

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: updateLead,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  },
})
```

#### Cache Keys Strategy
```
['leads', { status, search, assignedTo, page }]  -> Lead list
['leads', leadId]                                  -> Single lead
['leads', leadId, 'interactions']                  -> Lead interactions
['dashboard', 'stats']                             -> Dashboard stats
['analytics', { dateRange }]                       -> Analytics data
['users']                                          -> User list
['products']                                       -> Product list
['sources']                                        -> Source list
['notifications']                                  -> User notifications
['lead-requests', { status }]                      -> Lead requests
```

### Layer 2: Server-Side Caching (Redis)

#### Install
```bash
npm install ioredis
```

#### What to Cache in Redis
```
Key                              TTL        Purpose
─────────────────────────────────────────────────────────────
dashboard:stats:{userId}         5 min      Dashboard statistics
analytics:{orgId}:{dateRange}    15 min     Analytics aggregations
leads:count:{orgId}              2 min      Total lead counts
user:session:{userId}            7 days     Session data
products:{orgId}                 1 hour     Product catalog
sources:{orgId}                  1 hour     Lead sources
user:permissions:{userId}        10 min     RBAC permission cache
rate:login:{ip}                  15 min     Rate limiting counter
```

#### Redis Connection
```javascript
// src/lib/redis.js
import Redis from 'ioredis'

let redis
export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
  }
  return redis
}

// Cache helper
export async function cached(key, ttlSeconds, fetchFn) {
  const redis = getRedis()
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const data = await fetchFn()
  await redis.setex(key, ttlSeconds, JSON.stringify(data))
  return data
}
```

#### Cache Invalidation Strategy
```
Event                    Invalidate
──────────────────────────────────────────
Lead created/updated     dashboard:stats:*, leads:count:*
Lead status changed      dashboard:stats:*, analytics:*
User created/deleted     users:*, user:permissions:*
Product changed          products:*
Source changed           sources:*
Interaction logged       dashboard:stats:*, analytics:*
```

### Layer 3: Database Query Optimization
- Use MongoDB `$lookup` instead of multiple queries
- Add `.lean()` to all read queries (returns plain objects, 5x faster)
- Use `projection` to select only needed fields
- Use aggregation pipelines for analytics instead of application-level computation

---

## 7. Backend Separation

### Phase 1: Service Layer (Immediate)

Extract business logic from API routes into service files:

```
src/
  services/
    auth.service.js          # Login, register, token management
    lead.service.js          # CRUD, assignment, bulk operations
    interaction.service.js   # Activity logging
    analytics.service.js     # Aggregation, reporting
    notification.service.js  # Email, SMS, push, in-app
    import.service.js        # CSV/Excel processing
    user.service.js          # User management
```

**Benefits:**
- Testable business logic (unit tests without HTTP)
- Reusable across API routes, WebSocket handlers, background jobs
- Cleaner API routes (just request parsing + response formatting)

### Phase 2: API Route Middleware (Immediate)

```javascript
// src/lib/apiHandler.js
export function createHandler(config) {
  return async function handler(request, context) {
    // 1. Database connection
    await connectToDatabase()

    // 2. Authentication (if required)
    let user = null
    if (config.auth !== false) {
      user = await authenticateUser(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Role check
    if (config.role && user.role !== config.role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Rate limiting
    if (config.rateLimit) {
      const limited = await checkRateLimit(request, config.rateLimit)
      if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 5. Input validation
    let body = null
    if (config.validate && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.json()
      const errors = config.validate(body)
      if (errors) return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }

    // 6. Execute handler
    return config.handler(request, { user, body, params: context?.params })
  }
}
```

### Phase 3: Standalone Backend (When Needed)

When to separate:
- Need WebSocket support (real-time notifications)
- Building mobile app (shared API)
- API response times need independent scaling
- Need background job processing

**Recommended Stack:**
```
Framework:    Express.js or Fastify (faster)
Auth:         Passport.js + JWT
Validation:   Zod or Joi
ORM:          Mongoose (keep current)
Queue:        BullMQ (Redis-based job queue)
WebSocket:    Socket.io
Docs:         Swagger/OpenAPI
```

---

## 8. Database Optimization

### Current Issues
1. No connection pooling configuration
2. No read replicas
3. Some queries missing `.lean()`
4. Analytics queries computed on the fly (no pre-aggregation)
5. No database migration strategy
6. No compound indexes for common filter combinations

### Recommended Changes

#### 8.1 Connection Pooling
```javascript
// src/lib/mongodb.js - Updated
const options = {
  maxPoolSize: 10,          // Max concurrent connections
  minPoolSize: 2,           // Keep 2 connections warm
  maxIdleTimeMS: 30000,     // Close idle connections after 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

#### 8.2 New Indexes Required
```javascript
// For multi-tenancy
Lead:         { organizationId: 1, status: 1, assignedTo: 1 }
Lead:         { organizationId: 1, createdAt: -1 }
Lead:         { organizationId: 1, phone: 1 }           // Duplicate detection
Lead:         { organizationId: 1, email: 1 }            // Duplicate detection
Interaction:  { organizationId: 1, lead: 1, createdAt: -1 }
User:         { organizationId: 1, email: 1 }            // Unique per org
```

#### 8.3 Pre-Aggregated Analytics
```javascript
// New model: DailyStats (computed by background job)
{
  organizationId: ObjectId,
  date: Date,                    // Rounded to day
  userId: ObjectId,              // null for org-wide
  metrics: {
    leadsCreated: Number,
    leadsConverted: Number,
    leadsLost: Number,
    callsMade: Number,
    emailsSent: Number,
    meetingsHeld: Number,
    totalLeadValue: Number,
    avgResponseTime: Number,     // Minutes to first contact
  }
}
```

Run nightly aggregation job instead of computing analytics on every request.

#### 8.4 Read Replicas
```
Primary:    Writes (create, update, delete)
Secondary:  Reads (list, search, analytics, export)

MongoDB Atlas: Enable read preference "secondaryPreferred" for read-heavy routes
```

---

## 9. Security Hardening

### Critical Fixes (Do Immediately)

| Issue | Fix |
|-------|-----|
| `/api/auth/register-admin` has no auth check | Add admin-only middleware OR remove entirely |
| `/api/debug/users` exposed without auth | Delete this route in production |
| `/debug-users` page exposed | Delete this page |
| `/admin-register` page open to public | Delete or protect with invite-only token |
| Default admin credentials (admin123) | Force password change on first login |
| JWT_SECRET = "your-jwt-secret-here" | Generate a strong 256-bit random secret |
| NEXTAUTH_SECRET = "your-secret-key-here" | Generate a strong random secret |

### Security Additions

#### 9.1 Rate Limiting
```javascript
// Using Redis for distributed rate limiting
Login:       5 attempts / 15 minutes / IP
API:         100 requests / minute / user
CSV Upload:  5 uploads / hour / user
Password Reset: 3 requests / hour / email
```

#### 9.2 Input Validation (Zod)
```bash
npm install zod
```
```javascript
// src/lib/validators.js
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
})

export const createLeadSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().regex(/^[+]?[\d\s-]{7,15}$/),
  email: z.string().email().optional(),
  productInterest: z.string().min(1),
  source: z.string().min(1),
  leadValue: z.number().min(0).optional(),
  // ... etc
})
```

#### 9.3 Additional Security Measures
- **Helmet headers** (via Next.js `headers()` config)
- **CORS whitelist** for API routes
- **Request size limits** (prevent payload attacks)
- **SQL/NoSQL injection protection** (Mongoose handles most, but sanitize `$` operators)
- **XSS protection** (React handles most, sanitize rich text inputs)
- **Audit logging** (who did what, when, from where)
- **Session management** (invalidate tokens on password change)
- **Password policy** (min 8 chars, uppercase, number, special char)
- **Account lockout** after failed attempts
- **2FA/MFA** for admin accounts

---

## 10. Performance Optimization

### Frontend

| Optimization | How |
|---|---|
| Code splitting | Use `next/dynamic` for heavy components (Recharts, CSV parser, modals) |
| Image optimization | Use `next/image` for all images |
| Bundle analysis | Add `@next/bundle-analyzer` to find large imports |
| Virtual scrolling | Use `@tanstack/react-virtual` for lead tables with 1000+ rows |
| Debounced search | Add 300ms debounce on search input (reduce API calls) |
| Optimistic updates | Update UI before API confirms (via Zustand + React Query) |
| Prefetching | Prefetch lead detail on row hover |
| Skeleton loading | Replace spinners with content-shaped skeletons |
| Memoization | Use `React.memo`, `useMemo`, `useCallback` for expensive components |

### Backend

| Optimization | How |
|---|---|
| Response compression | Enable gzip/brotli in Next.js config |
| Lean queries | Add `.lean()` to all read queries |
| Field projection | Select only needed fields: `.select('name email status')` |
| Aggregation pipeline | Replace multiple queries with `$lookup` pipelines |
| Background jobs | Move CSV processing, analytics, notifications to BullMQ workers |
| Connection pooling | Configure MongoDB pool size (10 connections) |
| Query result caching | Redis with TTL for frequently accessed data |
| Pagination limits | Enforce max page size (100) to prevent memory issues |
| Stream large exports | Stream CSV exports instead of building in memory |

### Database

| Optimization | How |
|---|---|
| Compound indexes | Add indexes for common filter combinations |
| Covered queries | Create indexes that include projected fields |
| Explain plans | Run `explain()` on slow queries to find missing indexes |
| Text indexes | Add text index on Lead (name, email, companyName) for `$text` search |
| Pre-aggregation | Nightly job to compute daily stats instead of real-time aggregation |
| TTL indexes | Auto-delete old notifications, audit logs after retention period |

---

## 11. Industry-Standard Features Roadmap

### Tier 1: Table Stakes (Every CRM Has These)

#### 1. Contact Management (Separate from Leads)
```
Contact Model:
  - firstName, lastName, email, phone, mobile
  - company, jobTitle, department
  - address (street, city, state, country, zip)
  - socialProfiles (linkedin, twitter)
  - tags, customFields
  - relationships (linked contacts, deals, companies)
  - lifecycle stage (subscriber, lead, MQL, SQL, opportunity, customer, evangelist)
```

#### 2. Company/Account Management
```
Company Model:
  - name, domain, industry, employeeCount
  - annualRevenue, address
  - owner (assigned user)
  - contacts (linked)
  - deals (linked)
  - type (prospect, partner, vendor, competitor)
```

#### 3. Deal/Opportunity Pipeline
```
Deal Model:
  - name, value, currency
  - stage (customizable per pipeline)
  - pipeline (allow multiple pipelines)
  - probability, expectedCloseDate
  - contact, company (linked)
  - owner (assigned user)
  - products (line items with quantity, price, discount)
  - competitors, lossReason
```

#### 4. Task & Activity Management
```
Task Model:
  - title, description, type (call, email, meeting, todo)
  - dueDate, priority, status (pending, completed, overdue)
  - assignedTo, relatedTo (lead, contact, deal)
  - reminder (date, type)
  - recurring (daily, weekly, monthly)
```

#### 5. Email Integration
- Connect Gmail/Outlook
- Send emails from CRM
- Track opens, clicks, replies
- Auto-log emails to lead/contact timeline
- Email templates with merge fields

#### 6. Notification System
- In-app notifications (bell icon + dropdown)
- Email notifications (configurable per event)
- Browser push notifications
- Daily digest email
- Follow-up reminders
- Lead assignment alerts

#### 7. Kanban Board View
- Drag-and-drop pipeline visualization
- Customizable stages
- Card previews (name, value, age, next activity)
- Inline quick actions

### Tier 2: Competitive Advantage

#### 8. Workflow Automation Engine
```
Workflow:
  trigger: "Lead status changes to 'Contacted'"
  conditions:
    - "Lead source is 'Website'"
    - "Lead value > 50000"
  actions:
    - "Send email template 'Welcome'"
    - "Create task 'Follow up in 3 days'"
    - "Notify manager"
    - "Update field 'priority' to 'High'"
```

#### 9. Lead Scoring
```
Scoring Rules:
  +10: Email opened
  +20: Replied to email
  +30: Attended meeting
  +5:  Visited pricing page (web tracking)
  -10: No response in 7 days
  +50: Requested demo
  Score > 80: Auto-mark as "Hot Lead"
```

#### 10. Duplicate Detection & Merge
- Match on phone, email, name+company
- Show duplicate warnings on lead creation
- Merge UI: select which fields to keep
- Auto-merge option for CSV imports

#### 11. Custom Fields
- Text, Number, Date, Dropdown, Multi-select, Checkbox, URL, Email, Phone
- Per-entity (leads, contacts, deals)
- Required/optional, default values
- Filterable and searchable
- Show/hide per role

#### 12. Web Forms & Landing Pages
- Drag-and-drop form builder
- Embed code for external websites
- Auto-create leads from submissions
- Auto-assign based on rules
- Thank-you page redirect

#### 13. Document Management
- Attach files to leads, contacts, deals
- Document templates (proposals, contracts)
- E-signature integration (DocuSign, similar)
- Version history

### Tier 3: Enterprise Features

#### 14. Multi-Currency Support
- Organization default currency
- Per-deal currency
- Auto-conversion using exchange rates
- Reports in base currency

#### 15. Territory Management
- Geographic territories
- Account-based territories
- Auto-assignment rules
- Territory performance reports

#### 16. Advanced Analytics & AI
- Predictive lead scoring (ML-based)
- Deal win probability
- Best time to contact
- Churn prediction
- Revenue forecasting
- Natural language querying ("Show me all leads from Mumbai that haven't been contacted in 7 days")

#### 17. API & Webhooks
- RESTful public API with API key auth
- Webhook subscriptions (lead created, deal won, etc.)
- Rate limiting per API key
- API documentation portal (Swagger)

#### 18. Audit Trail
- Every create, update, delete logged
- Who, what, when, from where (IP)
- Field-level change tracking
- Exportable audit reports
- Retention policies

#### 19. Multi-Language (i18n)
- UI in multiple languages
- RTL support
- Currency/date format per locale
- Translation management

#### 20. Mobile App
- React Native or Flutter
- Push notifications
- Offline capability
- Call logging from phone
- Business card scanner (OCR)
- Location-based check-ins

---

## 12. DevOps & Infrastructure

### CI/CD Pipeline
```yaml
# GitHub Actions
on: [push, pull_request]
jobs:
  test:
    - Lint (ESLint)
    - Unit tests (Jest/Vitest)
    - Integration tests (API routes with test DB)
    - E2E tests (Playwright)
  build:
    - Next.js build
    - Bundle size check
    - Docker image build
  deploy:
    - Staging: auto-deploy on PR merge to develop
    - Production: manual approval + deploy on merge to main
```

### Testing Strategy
```
Unit Tests:       Services, utilities, validators (Vitest)
Integration Tests: API routes with test database (Vitest + Supertest)
E2E Tests:        User flows (Playwright)
Load Tests:       API performance (k6 or Artillery)

Coverage Target:  80% for services, 60% for API routes
```

### Monitoring & Observability
```
Error Tracking:     Sentry
Performance:        Vercel Analytics or New Relic
Uptime:             BetterUptime or Checkly
Logging:            Pino (structured JSON logs) -> Datadog/Grafana
Database:           MongoDB Atlas monitoring
Redis:              Redis Insight
```

### Infrastructure
```
Frontend:    Vercel (or AWS CloudFront + S3)
Backend:     Vercel Serverless (or AWS ECS/Fargate for standalone)
Database:    MongoDB Atlas (M10+ for production)
Cache:       Redis (Upstash for serverless, or AWS ElastiCache)
Queue:       BullMQ on Redis (or AWS SQS)
Storage:     AWS S3 (file uploads, documents)
Email:       SendGrid or Amazon SES
SMS:         Twilio
Search:      MongoDB Atlas Search (or Elasticsearch)
CDN:         Vercel Edge / CloudFront
```

---

## 13. Implementation Priority & Phases

### Phase 1: Foundation (Weeks 1-3)
> Fix critical issues, add state management, set up caching

| Task | Priority | Effort |
|------|----------|--------|
| Fix security vulnerabilities (register-admin, debug routes) | P0 | 1 day |
| Install & configure Zustand (auth, leads, UI stores) | P0 | 3 days |
| Install & configure TanStack React Query | P0 | 2 days |
| Add Zod validation on all API routes | P1 | 2 days |
| Add service layer (extract business logic from routes) | P1 | 3 days |
| Add API middleware (auth, rate limiting, error handling) | P1 | 2 days |
| Set up Vitest + write tests for services | P1 | 3 days |
| Set up Redis caching (Upstash) | P1 | 2 days |

### Phase 2: Core Features (Weeks 4-8)
> Add must-have CRM features

| Task | Priority | Effort |
|------|----------|--------|
| Contact model + CRUD (separate from leads) | P0 | 3 days |
| Company/Account model + CRUD | P0 | 3 days |
| Deal/Opportunity pipeline with Kanban board | P0 | 5 days |
| Task/Activity management system | P0 | 3 days |
| In-app notification system | P0 | 3 days |
| Email notifications (SendGrid) | P1 | 2 days |
| Follow-up reminders | P1 | 2 days |
| Duplicate lead detection | P1 | 2 days |
| Lead tags/labels | P2 | 1 day |
| Custom fields engine | P2 | 4 days |

### Phase 3: Multi-Tenancy (Weeks 9-12)
> Transform to multi-tenant architecture

| Task | Priority | Effort |
|------|----------|--------|
| Organization model + tenant resolution | P0 | 3 days |
| Tenant-aware database connections | P0 | 4 days |
| User invitation & onboarding flow | P0 | 3 days |
| Tenant settings (branding, currency, timezone) | P1 | 3 days |
| Subscription/billing integration (Stripe/Razorpay) | P1 | 5 days |
| Custom roles & permissions per tenant | P1 | 4 days |
| Tenant data isolation testing | P0 | 2 days |

### Phase 4: Automation & Integrations (Weeks 13-18)
> Add competitive features

| Task | Priority | Effort |
|------|----------|--------|
| Workflow automation engine | P1 | 8 days |
| Email integration (Gmail/Outlook) | P1 | 5 days |
| WhatsApp Business API | P1 | 4 days |
| Lead scoring system | P2 | 3 days |
| Web-to-lead forms | P2 | 3 days |
| Public API + API keys | P2 | 4 days |
| Webhook system | P2 | 3 days |
| Document management | P2 | 3 days |

### Phase 5: Scale & Polish (Weeks 19-24)
> Enterprise features and optimization

| Task | Priority | Effort |
|------|----------|--------|
| Advanced analytics & custom reports | P1 | 5 days |
| Audit trail system | P1 | 3 days |
| Multi-currency support | P2 | 2 days |
| i18n (multi-language) | P2 | 4 days |
| Mobile app (React Native) | P2 | 15 days |
| AI features (lead scoring, recommendations) | P3 | 8 days |
| E2E test suite (Playwright) | P1 | 5 days |
| Performance optimization & load testing | P1 | 4 days |
| Documentation (API docs, user guide) | P1 | 3 days |

---

## Summary

### Immediate Actions (This Week)
1. Fix security holes (`register-admin`, debug routes, weak secrets)
2. Install Zustand + create auth/lead/UI stores
3. Install TanStack React Query + wrap all data fetching
4. Add Zod validation on API inputs
5. Set up Redis (Upstash) for caching

### Architecture Decisions
| Decision | Recommendation |
|----------|---------------|
| State management | Zustand (lightweight, simple) |
| Server state/caching | TanStack React Query |
| Server-side cache | Redis (Upstash for serverless) |
| Validation | Zod |
| Backend separation | Service layer now, standalone later if needed |
| Multi-tenancy | Database-per-tenant (enterprise) + shared DB (free/pro) |
| Background jobs | BullMQ on Redis |
| Testing | Vitest + Playwright |
| Email | SendGrid |
| File storage | AWS S3 |
| Search | MongoDB Atlas Search |
| Monitoring | Sentry + Vercel Analytics |

### From Current State to Industry-Standard
```
Current:   ~30% of industry-standard CRM features
Phase 1:   ~35% (foundation + stability)
Phase 2:   ~55% (core CRM features)
Phase 3:   ~65% (multi-tenancy)
Phase 4:   ~80% (automation + integrations)
Phase 5:   ~95% (enterprise + polish)
```

---

*Document generated: 2026-04-14*
*Based on analysis of DigiCRM codebase at commit 8bca024*
