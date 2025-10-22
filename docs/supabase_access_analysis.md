# Supabase Database Access Pattern Analysis

**Generated:** 2025-10-14
**Project:** Clinic Admin System

---

## Executive Summary

This document provides a comprehensive analysis of all Supabase database access patterns in the clinic administration system. The analysis identifies potential security concerns where database tables are accessed directly from client-side code rather than through protected API routes.

### Key Findings

- **Total Tables Analyzed:** 10 tables
- **Files with Direct DB Access:** 21 files
- **High Security Risk:** 8 files (client-side direct access)
- **Medium Security Risk:** 2 files (shared utilities)
- **API Routes (Secure):** 11 files

---

## Table Access Summary

### Tables Defined (from `/src/constants/tables.ts`)

| Table Name | Purpose | Primary Access Pattern |
|-----------|---------|----------------------|
| `prepare_hospital` | Hospital basic info | Mixed (API + Client) |
| `prepare_doctor` | Doctor profiles | Mixed (API + Client) |
| `prepare_hospital_details` | Extended hospital details | Mixed (API + Client) |
| `prepare_hospital_treatment` | Treatment information | Mixed (API + Client) |
| `prepare_hospital_business_hour` | Operating hours | Mixed (API + Client) |
| `prepare_hospital_contacts` | Contact information | API Only |
| `reservations` | Appointment bookings | Mixed (API + Client) |
| `admin` | Admin users | Mixed (API + Client) |
| `feedbacks` | User feedback | Mixed (API + Client) |
| `treatment_info` | Treatment catalog | Mixed (API + Client) |

### Additional Tables (Hardcoded names)

| Table Name | Purpose | Access Location |
|-----------|---------|----------------|
| `surgery_info` | Surgery information | Client Component |
| `device_catalog` | Device/equipment catalog | API Route |
| `hospital_treatment_selection` | Treatment selections | Client Component |
| `consultation_submissions` | Consultation forms | Client Component |

---

## Detailed Access Analysis

### 1. HIGH SECURITY RISK - Client-Side Direct Access

These files directly access Supabase from client components, bypassing API security layers:

#### 1.1 `/src/lib/hospitalDataLoader.ts`
**Type:** Shared Utility (used by client components)
**Accessed Tables:**
- `prepare_hospital` (SELECT)
- `prepare_hospital_details` (SELECT)
- `prepare_hospital_business_hour` (SELECT)
- `prepare_doctor` (SELECT)
- `prepare_hospital_treatment` (SELECT)
- `treatment_info` (SELECT)
- `feedbacks` (SELECT)
- `prepare_hospital_contacts` (SELECT)
- `admin` (SELECT)

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ⚠️ Direct database access from utility used in client components
- ⚠️ Exposes multiple sensitive tables to client-side code
- ⚠️ Admin table access from client utility
- ⚠️ No API rate limiting
- ⚠️ RLS (Row Level Security) is the only protection

**Usage Locations:**
- Step1BasicInfo.tsx (line 19)
- PreviewClinicInfoModal.tsx (potential usage)

---

#### 1.2 `/src/components/modal/PreviewClinicInfoModal.tsx`
**Type:** Client Component (`'use client'`)
**Accessed Tables:**
- `prepare_hospital` (SELECT) - line 115-119
- `prepare_hospital_business_hour` (SELECT) - line 124-128
- `prepare_doctor` (SELECT) - line 133-137
- `prepare_hospital_treatment` (SELECT) - line 142-145
- `treatment_info` (SELECT) - line 157-160
- `hospital_treatment_selection` (SELECT) - line 170-173
- `feedbacks` (SELECT) - line 180-187, 205-212
- `prepare_hospital_details` (SELECT) - line 194-198
- `prepare_hospital_contacts` (SELECT) - line 219-223

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ⚠️ Multiple direct database queries from client component
- ⚠️ Complex join operations happening client-side
- ⚠️ No caching mechanism
- ⚠️ Potential N+1 query problem
- ⚠️ Modal component performing heavy database operations

**Recommendation:** Create a single API endpoint `/api/hospital/preview/{id}` that returns all data in one request.

---

#### 1.3 `/src/app/admin/AdminAuthWrapper.tsx`
**Type:** Client Component (`'use client'`)
**Accessed Tables:**
- `admin` (SELECT, INSERT) - lines 34-38, 48-60
- `prepare_hospital` (SELECT) - lines 63-66

**Operations:**
- SELECT (admin verification)
- INSERT (admin creation)

**Security Concerns:**
- 🔴 **CRITICAL:** Admin table INSERT from client component
- 🔴 Admin user creation bypassing API validation
- ⚠️ Authentication logic exposed in client code
- ⚠️ No server-side validation for admin creation

**Recommendation:** Move all admin operations to `/api/admin/*` endpoints with proper authentication middleware.

---

#### 1.4 `/src/app/admin/chat/[channelUrl]/ChatRoomClient.tsx`
**Type:** Client Component (`'use client'`)
**Accessed Tables:**
- `prepare_hospital` (SELECT) - lines 43-47

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ⚠️ Fetching hospital name directly from client
- ⚠️ Could expose hospital UUID if not properly protected by RLS

**Recommendation:** Pass hospital name from server component or fetch via API.

---

#### 1.5 `/src/app/admin/upload/Step1BasicInfo.tsx`
**Type:** Client Component (`'use client'`)
**Accessed Tables:**
- `surgery_info` (SELECT) - lines 129-131

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ⚠️ Direct query from client component
- ℹ️ Using TanStack Query for caching (good practice)
- ⚠️ Table not defined in constants/tables.ts

**Recommendation:** Create `/api/surgery-info` endpoint for better control and caching.

---

#### 1.6 `/src/app/admin/consultation/page.tsx`
**Type:** Client Component (`'use client'`)
**Accessed Tables:**
- `consultation_submissions` (SELECT, UPDATE) - lines 95-98, 179-186

**Operations:**
- SELECT (fetch submissions)
- UPDATE (update doctor notes and status)

**Security Concerns:**
- 🔴 **CRITICAL:** UPDATE operations from client component
- 🔴 Client-side data modification
- ⚠️ Hardcoded table name (not in constants)
- ⚠️ Super admin check in client code (line 72)
- ⚠️ Environment variable exposed to client (`NEXT_PUBLIC_SUPER_ADMIN`)

**Recommendation:**
- Create `/api/consultation/*` endpoints for all operations
- Move super admin check to server-side middleware
- Never expose admin credentials in environment variables

---

#### 1.7 `/src/hooks/useReservationRealtime.ts`
**Type:** Client Hook
**Accessed Tables:**
- `reservations` (Real-time subscription) - lines 14-31

**Operations:** Real-time subscription (INSERT events)

**Security Concerns:**
- ⚠️ Real-time subscription from client
- ℹ️ Read-only subscription (acceptable for notifications)
- ⚠️ Relies on RLS filter for security

**Recommendation:** Consider moving to server-side webhook for sensitive operations.

---

#### 1.8 `/src/app/api/reservation/index.ts`
**Type:** Shared Utility (imported by API routes)
**Accessed Tables:**
- `reservations` (SELECT) - lines 11-16

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ⚠️ Hardcoded table name instead of using constant
- ℹ️ Used in API context (acceptable)
- ⚠️ Inconsistent naming (should use `TABLE_RESERVATIONS`)

**Recommendation:** Use constant from `/src/constants/tables.ts`.

---

### 2. MEDIUM SECURITY RISK - Shared Utilities

#### 2.1 `/src/lib/api-utils.ts`
**Type:** Server-side Utility
**Accessed Tables:**
- `admin` (SELECT) - lines 75-79

**Operations:** Read-only (SELECT)

**Security Concerns:**
- ℹ️ Server-side utility (acceptable)
- ✅ Used for authentication validation
- ✅ Proper error handling

**Status:** Acceptable - This is server-side code.

---

### 3. SECURE - API Routes

All API routes follow proper patterns with server-side validation:

#### 3.1 `/src/app/api/upload/step1/route.ts`
**Tables:** `prepare_hospital`, `admin`, `prepare_hospital_details`
**Operations:** SELECT, INSERT, UPDATE, UPSERT
**Status:** ✅ Secure (server-side)

#### 3.2 `/src/app/api/upload/step2/route.ts`
**Tables:** `prepare_hospital_contacts`
**Operations:** SELECT, DELETE, INSERT
**Status:** ✅ Secure (server-side)

#### 3.3 `/src/app/api/upload/step3/route.ts`
**Tables:** `prepare_hospital_business_hour`, `prepare_hospital_details`
**Operations:** SELECT, DELETE, INSERT, UPDATE
**Status:** ✅ Secure (server-side)

#### 3.4 `/src/app/api/upload/step4/route.ts`
**Tables:** `prepare_hospital`, `prepare_doctor`
**Operations:** SELECT, DELETE, INSERT, UPDATE
**Status:** ✅ Secure (server-side)

#### 3.5 `/src/app/api/upload/step5/route.ts`
**Tables:** `prepare_hospital_treatment`, `treatment_info`
**Operations:** SELECT, DELETE, INSERT
**Status:** ✅ Secure (server-side)

#### 3.6 `/src/app/api/upload/step6/feedback/route.ts`
**Tables:** `feedbacks`
**Operations:** SELECT, INSERT, UPDATE
**Status:** ✅ Secure (server-side)

#### 3.7 `/src/app/api/upload/step_last/route.ts`
**Tables:** `prepare_hospital_details`, `feedbacks`
**Operations:** SELECT, INSERT, UPDATE
**Status:** ✅ Secure (server-side)

#### 3.8 `/src/app/api/reservation/route.ts`
**Tables:** `reservations`
**Operations:** SELECT, UPDATE
**Status:** ✅ Secure (server-side)

#### 3.9 `/src/app/api/treatment-categories/route.ts`
**Tables:** `treatment_info`
**Operations:** SELECT
**Status:** ✅ Secure (server-side)

#### 3.10 `/src/app/api/devices/route.ts`
**Tables:** `device_catalog`
**Operations:** SELECT
**Status:** ✅ Secure (server-side)

#### 3.11 `/src/app/api/validate/route.ts`
**Tables:** `prepare_hospital`, `prepare_hospital_details`
**Operations:** SELECT
**Status:** ✅ Secure (server-side)

---

## Security Vulnerabilities by Severity

### 🔴 CRITICAL (Immediate Action Required)

1. **Admin Table INSERT from Client** (`AdminAuthWrapper.tsx`)
   - **Risk:** Unauthorized admin account creation
   - **Impact:** Complete system compromise
   - **Fix:** Move to `/api/admin/register` with proper validation

2. **Client-Side UPDATE Operations** (`consultation/page.tsx`)
   - **Risk:** Direct data manipulation from client
   - **Impact:** Data integrity compromise
   - **Fix:** Create `/api/consultation/update` endpoint

### ⚠️ HIGH (Should Fix Soon)

3. **Multiple Direct Queries from Client Components**
   - Files: `PreviewClinicInfoModal.tsx`, `hospitalDataLoader.ts`
   - **Risk:** Exposed database structure, potential RLS bypass
   - **Impact:** Information disclosure, performance issues
   - **Fix:** Create consolidated API endpoints

4. **Hardcoded Table Names**
   - Files: `reservation/index.ts`, `Step1BasicInfo.tsx`, `consultation/page.tsx`
   - **Risk:** Inconsistency, maintenance issues
   - **Impact:** Hard to refactor, potential bugs
   - **Fix:** Use constants from `/src/constants/tables.ts`

### ℹ️ MEDIUM (Consider Improving)

5. **Real-time Subscriptions from Client**
   - File: `useReservationRealtime.ts`
   - **Risk:** Depends on RLS configuration
   - **Impact:** Potential information leakage if RLS misconfigured
   - **Fix:** Document RLS requirements clearly

---

## Table Access Matrix

| Table | API Access | Client Access | Security Status |
|-------|-----------|---------------|-----------------|
| `prepare_hospital` | ✅ Yes | ⚠️ Yes (3 files) | Medium Risk |
| `prepare_doctor` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `prepare_hospital_details` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `prepare_hospital_treatment` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `prepare_hospital_business_hour` | ✅ Yes | ⚠️ Yes (1 file) | Medium Risk |
| `prepare_hospital_contacts` | ✅ Yes | ⚠️ Yes (1 file) | Medium Risk |
| `reservations` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `admin` | ✅ Yes | 🔴 Yes (2 files) | **HIGH RISK** |
| `feedbacks` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `treatment_info` | ✅ Yes | ⚠️ Yes (2 files) | Medium Risk |
| `surgery_info` | ❌ No | ⚠️ Yes | Medium Risk |
| `device_catalog` | ✅ Yes | ❌ No | ✅ Secure |
| `hospital_treatment_selection` | ❌ No | ⚠️ Yes | Medium Risk |
| `consultation_submissions` | ❌ No | 🔴 Yes (UPDATE) | **HIGH RISK** |

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Refactor Admin Operations**
   ```typescript
   // Create /src/app/api/admin/auth/route.ts
   // Move all admin verification and creation logic
   ```

2. **Create Consultation API**
   ```typescript
   // Create /src/app/api/consultation/route.ts
   // Move all CRUD operations from client
   ```

3. **Audit RLS Policies**
   - Ensure all tables have proper RLS policies
   - Document RLS requirements for each table
   - Test with different user roles

### Short-term Improvements (Priority 2)

4. **Consolidate Hospital Data Loading**
   ```typescript
   // Create /src/app/api/hospital/[id]/route.ts
   // Replace multiple client queries with single API call
   ```

5. **Standardize Table Name Usage**
   ```typescript
   // Add missing tables to /src/constants/tables.ts
   export const TABLE_SURGERY_INFO = "surgery_info";
   export const TABLE_DEVICE_CATALOG = "device_catalog";
   export const TABLE_TREATMENT_SELECTION = "hospital_treatment_selection";
   export const TABLE_CONSULTATION_SUBMISSIONS = "consultation_submissions";
   ```

6. **Create API Endpoints for Missing Tables**
   - `/api/surgery-info`
   - `/api/treatment-selection`
   - `/api/consultation/*`

### Long-term Improvements (Priority 3)

7. **Implement API Rate Limiting**
   - Add rate limiting middleware to all API routes
   - Protect against abuse and DDoS

8. **Add Request Validation**
   - Use Zod or similar for request validation
   - Validate all input data at API level

9. **Implement API Caching**
   - Cache frequently accessed read-only data
   - Use Redis or Next.js caching

10. **Add Comprehensive Logging**
    - Log all database operations
    - Monitor for suspicious patterns
    - Set up alerts for security events

---

## Client-Side Database Access Summary

### Files with Direct Client Access (8 files)

1. ⚠️ `/src/lib/hospitalDataLoader.ts` - 9 tables
2. ⚠️ `/src/components/modal/PreviewClinicInfoModal.tsx` - 9 tables
3. 🔴 `/src/app/admin/AdminAuthWrapper.tsx` - 2 tables (with INSERT)
4. ⚠️ `/src/app/admin/chat/[channelUrl]/ChatRoomClient.tsx` - 1 table
5. ⚠️ `/src/app/admin/upload/Step1BasicInfo.tsx` - 1 table
6. 🔴 `/src/app/admin/consultation/page.tsx` - 1 table (with UPDATE)
7. ⚠️ `/src/hooks/useReservationRealtime.ts` - 1 table (subscription)
8. ⚠️ `/src/app/api/reservation/index.ts` - 1 table (utility)

### Operation Types from Client

| Operation | Count | Risk Level |
|-----------|-------|-----------|
| SELECT | 15+ queries | Medium |
| INSERT | 1 location | **HIGH** |
| UPDATE | 1 location | **HIGH** |
| DELETE | 0 locations | N/A |
| Real-time Subscribe | 1 location | Low-Medium |

---

## Architecture Recommendations

### Current Architecture Issues

```
┌─────────────┐
│   Client    │
│ Components  │──────┐
└─────────────┘      │
                     ├──────► Supabase DB
┌─────────────┐      │        (Direct Access)
│  API Routes │──────┘
└─────────────┘
```

**Problems:**
- Mixed access patterns
- Inconsistent security model
- Hard to maintain RLS policies
- Performance issues

### Recommended Architecture

```
┌─────────────┐
│   Client    │
│ Components  │──────┐
└─────────────┘      │
                     ├──────► API Routes ──────► Supabase DB
┌─────────────┐      │        (Single Entry)
│   Server    │──────┘
│ Components  │
└─────────────┘
```

**Benefits:**
- Single point of access control
- Consistent security model
- Easier to implement rate limiting
- Better caching opportunities
- Easier to add validation logic

### Migration Strategy

1. **Phase 1: Create Missing API Endpoints** (1-2 weeks)
   - Consultation endpoints
   - Surgery info endpoint
   - Hospital preview endpoint

2. **Phase 2: Refactor Client Components** (2-3 weeks)
   - Replace direct DB calls with API calls
   - Update hooks to use API endpoints
   - Test thoroughly

3. **Phase 3: Strengthen RLS as Backup** (1 week)
   - Even with API layer, maintain RLS as defense-in-depth
   - Document all policies
   - Regular security audits

4. **Phase 4: Add Monitoring** (1 week)
   - Log all database operations
   - Set up alerts
   - Regular security reviews

---

## Testing Recommendations

### Security Testing

1. **Test RLS Policies**
   ```sql
   -- Test as unauthenticated user
   SET ROLE anon;
   SELECT * FROM admin; -- Should fail

   -- Test as authenticated user
   SET ROLE authenticated;
   SELECT * FROM admin; -- Should only see own record
   ```

2. **Test API Authentication**
   - Attempt API calls without authentication
   - Attempt API calls with invalid tokens
   - Attempt to access other users' data

3. **Test Client-Side Protections**
   - Disable JavaScript and test direct API access
   - Test with modified client-side code
   - Test with intercepted requests

### Performance Testing

1. **Load Testing**
   - Test with multiple concurrent users
   - Monitor database connection pool
   - Identify slow queries

2. **Caching Effectiveness**
   - Measure cache hit rates
   - Identify frequently accessed data
   - Optimize caching strategy

---

## Conclusion

The current implementation has **significant security concerns** due to extensive client-side database access. While Row Level Security (RLS) provides some protection, it should not be the only line of defense.

### Priority Actions

1. 🔴 **Immediate:** Fix admin table INSERT from client
2. 🔴 **Immediate:** Fix client-side UPDATE operations
3. ⚠️ **High:** Create consolidated API endpoints for hospital data
4. ⚠️ **High:** Standardize table name constants
5. ℹ️ **Medium:** Implement comprehensive logging and monitoring

### Success Metrics

- **0** client-side write operations (INSERT/UPDATE/DELETE)
- **< 5** client-side read locations (only for non-sensitive data)
- **100%** of sensitive operations through API routes
- **All** tables using constants from `/src/constants/tables.ts`
- **Comprehensive** RLS policies as backup security layer

---

**Document Status:** Complete
**Last Updated:** 2025-10-14
**Next Review:** After implementing Priority 1 actions
