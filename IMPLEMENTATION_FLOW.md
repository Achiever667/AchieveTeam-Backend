# Loan Management API - Implementation Flow Documentation

## Project Overview
This is a **NestJS-based Loan Management API** built with TypeScript, featuring role-based access control (RBAC), JWT authentication, and data persistence using JSON files. The application manages loans and staff information with different access levels.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP Client (Frontend)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Express.js Server                             │
│            (Configured via app.factory.ts)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  Middleware Layer                                │
│ • LoggerMiddleware (logs all requests)                           │
│ • CORS (localhost:5173, vercel.app)                              │
│ • ValidationPipe (DTO validation)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Global Guards                                 │
│ 1. ThrottlerGuard (20 requests per 60s)                          │
│ 2. JwtAuthGuard (checks @Public decorator)                       │
│ 3. RolesGuard (enforces @Roles decorator)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                 Controllers → Services → Data                    │
│ • AuthController/Service                                         │
│ • LoansController/Service                                        │
│ • StaffService                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Data Layer (JSON Files)                        │
│ • data/staffs.json (staff credentials & info)                    │
│ • data/loans.json (loan records)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Structure & Initialization

### 1. **Application Bootstrap** (`src/main.ts`)
```
main.ts
  └─> configureNestApp() [app.factory.ts]
       └─> Creates NestFactory.create(AppModule)
           ├─> Enables CORS
           ├─> Applies ValidationPipe
           └─> Applies GlobalExceptionFilter
  └─> app.listen(3000)
```

### 2. **Root Module** (`src/app.module.ts`)
- **Imports:**
  - `ThrottlerModule` - Rate limiting (20 req/60s)
  - `AuthModule` - Authentication & authorization
  - `StaffModule` - Staff data management
  - `LoansModule` - Loan data management

- **Controllers:** `AppController`
- **Providers:** 
  - `AppService`
  - `ThrottlerGuard` (APP_GUARD)
  - `JwtAuthGuard` (APP_GUARD)
  - `RolesGuard` (APP_GUARD)

- **Middleware:** `LoggerMiddleware` applied to all routes ('*')

### 3. **App Controller & Service** (`src/app.controller.ts`, `src/app.service.ts`)
- **Endpoint:** `GET /` (or `GET /api`)
- **Decorator:** `@Public()` - accessible without authentication
- **Response:** `{ message: 'Loan management API is running' }`

---

## Authentication Flow

### Module: `AuthModule` (`src/auth/auth.module.ts`)

**Imports:**
- `StaffModule` - to find staff by email
- `PassportModule` - authentication strategies
- `JwtModule` - JWT token generation & validation

**Config:**
- JWT Secret: `appConfig.jwtSecret` (default: 'loan-management-secret')
- Token Expiry: `appConfig.jwtExpiresIn` (default: '1h')

**Providers:**
- `AuthService` - business logic
- `JwtStrategy` - Passport JWT extraction & validation
- `TokenBlacklistService` - tracks logged-out tokens

---

### 1. **Login Flow** (`POST /login` or `POST /api/login`)

**Controller:** `AuthController.login()`

```
Request: LoginDto { email, password }
         ├─ Normalize email (trim, lowercase)
         ├─ Find staff by email via StaffService
         │  └─ Search in data/staffs.json
         │
         └─ Validate password
            ├─ Check if password is bcrypted ($2a$, $2b$, $2y$)
            ├─ If bcrypted: bcrypt.compare()
            └─ If plain: direct comparison
                 │
                 └─ If invalid: throw UnauthorizedException

         └─ Create JWT payload:
            ├─ sub: staff.id
            ├─ email: staff.email
            └─ role: staff.role [staff | admin | superAdmin]

Response: {
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id, email, name, role, department
    // (password excluded)
  }
}
```

**Service:** `AuthService.login()`

```typescript
1. Normalize email (trim + lowercase)
2. this.staffService.findByEmail(email)
   └─ Searches staff array loaded in memory
3. Validate password (bcrypt or plain)
4. Generate JWT with JwtService.signAsync()
5. Return token + sanitized staff data
```

---

### 2. **Profile Retrieval** (`GET /profile` or `GET /api/profile`)

**Controller:** `AuthController.profile()`

```
Request: Authorization header required (Bearer token)

Execution:
  └─ JwtAuthGuard extracts & validates token
     ├─ Uses JwtStrategy (Passport JWT)
     └─ Adds user to request object
  
  └─ Controller calls AuthService.getProfile(user.id)
     ├─ Finds staff by ID
     ├─ Returns sanitized staff data
     └─ If not found: throw NotFoundException

Response: { id, email, name, role, department }
```

---

### 3. **Logout Flow** (`POST /logout`)

**Controller:** `AuthController.logout()`

```
Request: Authorization header required (Bearer token)

Logic:
  ├─ Extract token from Authorization header
  ├─ If no token: throw UnauthorizedException
  └─> this.tokenBlacklistService.blacklist(token)
       └─ Adds token to in-memory blacklist set
          (cleared on server restart)

Response: { message: 'Logout successful' }
```

---

## Authorization/Guard System

### 1. **JWT Authentication Guard** (`src/common/guards/jwt-auth/jwt-auth.guard.ts`)

**Execution Order:**
```
Request arrives
  ├─ JwtAuthGuard checks for @Public() decorator
  │  ├─ If route is @Public: ALLOW (bypass JWT check)
  │  └─ If route requires auth: call super.canActivate()
  │
  └─ If auth required:
     ├─ JwtStrategy extracts token from "Authorization: Bearer <token>"
     ├─ Validates signature using appConfig.jwtSecret
     ├─ Checks token expiration
     ├─ Validates token not in blacklist
     ├─ Extracts payload (sub, email, role)
     ├─ Finds staff by ID for fresh data
     └─ Attaches user object to request.user
         └─ { id, email, role }
```

**Public Routes** (decorated with `@Public()`):
- `POST /login`
- `POST /api/login`
- `GET /`

**Protected Routes:**
- All others require valid JWT token

---

### 2. **Roles Guard** (`src/common/guards/roles/roles.guard.ts`)

**Execution Order:**
```
Route handler execution
  ├─ Check if route has @Roles(...roleList) decorator
  ├─ If no roles defined: ALLOW all authenticated users
  │
  └─ If @Roles defined:
     ├─ Extract required roles
     ├─ Check request.user.role
     ├─ If user role matches ANY required role: ALLOW
     └─ If no match: throw ForbiddenException
```

**Example Protected Endpoint:**
```typescript
@Roles(Role.SUPER_ADMIN)
@Delete('loan/:loanId/delete')
deleteLoan(@Param('loanId') loanId: string) { }
```

---

### 3. **Role Enum** (`src/common/enums/role.enum.ts`)

```typescript
enum Role {
  STAFF = 'staff'          // Regular staff member
  ADMIN = 'admin'          // Administrator
  SUPER_ADMIN = 'superAdmin' // Super administrator
}
```

---

## Loans Module Flow

### Module: `LoansModule` (`src/loans/loans.module.ts`)

**Providers:**
- `LoansService` - loads from `data/loans.json` on startup

**Controllers:**
- `LoansController` - handles all loan-related endpoints

---

### 1. **Get All Loans** (`GET /loans`)

```
Query Parameters:
  - status?: "pending" | "approved" | "rejected" | "completed"

Execution Flow:
  ├─ JWT Guard validates token & attaches user
  ├─ LoansService.getLoans(user.role, status)
  │  ├─ Filter loans by status (if provided)
  │  └─ Transform loans based on user role:
  │     ├─ STAFF role: exclude applicant.totalLoan field
  │     └─ ADMIN/SUPER_ADMIN: return full loan data
  │
  └─ Return filtered & transformed loans

Response (ADMIN/SUPER_ADMIN):
[
  {
    id, status, applicantEmail, maturityDate,
    applicant: { id, name, email, department, totalLoan },
    ...otherFields
  },
  ...
]

Response (STAFF):
[
  {
    id, status, applicantEmail, maturityDate,
    applicant: { id, name, email, department },  // no totalLoan
    ...otherFields
  },
  ...
]
```

---

### 2. **Get Expired Loans** (`GET /loans/expired`)

```
Execution Flow:
  ├─ JWT Guard validates token
  ├─ LoansService.getExpiredLoans(user.role)
  │  ├─ Parse all loan maturityDates
  │  ├─ Filter loans where maturityDate < currentDate
  │  └─ Transform based on role (same as above)
  │
  └─ Return expired loans

Response: Array of expired loans (role-based transformation)
```

---

### 3. **Get Loans by Applicant Email** (`GET /loans/:userEmail/get`)

```
URL Parameters:
  - userEmail: the email of the loan applicant

Execution Flow:
  ├─ JWT Guard validates token
  ├─ LoansService.getLoansByUserEmail(userEmail, user.role)
  │  ├─ Search loans where applicant.email matches (case-insensitive)
  │  └─ Transform based on role
  │
  └─ Return { loans: [...] }

Response Example:
{
  loans: [
    { id, status, applicant: {...}, ... },
    ...
  ]
}
```

---

### 4. **Delete Loan** (`DELETE /loan/:loanId/delete`)

```
Decorator: @Roles(Role.SUPER_ADMIN)
           └─ Only SUPER_ADMIN can access

URL Parameters:
  - loanId: unique loan identifier

Execution Flow:
  ├─ JWT Guard validates token
  ├─ Roles Guard checks if user.role === SUPER_ADMIN
  ├─ LoansService.deleteLoan(loanId)
  │  ├─ Filter out loan matching loanId
  │  ├─ If loan not found: throw NotFoundException
  │  └─ Update in-memory loans array
  │     (Note: changes NOT persisted to file)
  │
  └─ Return { message: '...' }

Response: { message: 'Loan deleted successfully for the current runtime session' }
```

**Important:** Deletions are in-memory only and reset on server restart.

---

### Loan Interface

```typescript
interface Loan {
  id: string;
  status: LoanStatus;  // 'pending' | 'approved' | 'rejected' | 'completed'
  applicant: {
    id: number;
    name: string;
    email: string;
    department: string;
    totalLoan: number;  // Hidden from STAFF role
  };
  maturityDate: string;  // Format: "YYYY-MM-DD HH:mm:ss"
  // ...other loan fields
}

type LoanForStaff = Omit<Loan, 'applicant'> & {
  applicant: Omit<Loan['applicant'], 'totalLoan'>;
}
```

---

## Staff Management

### Module: `StaffModule` (`src/staff/staff.module.ts`)

**Providers:**
- `StaffService` - loads staff data on initialization

---

### Staff Service (`src/staff/staff.service.ts`)

**Initialization:**
```
Constructor:
  ├─ Check if data/staffs.json exists
  ├─ If yes: use staffs.json
  └─ If no: fallback to data/staff.json (legacy)
  └─ Load JSON and parse into memory
```

**Methods:**

1. **`findByEmail(email: string): Staff | undefined`**
   - Case-insensitive search
   - Used by AuthService for login

2. **`findById(id: number): Staff | undefined`**
   - Direct ID lookup
   - Used by JwtStrategy for token validation

3. **`sanitizeStaff(staff: Staff): StaffSafe`**
   - Removes password field
   - Returns safe-to-expose staff data
   - Used in login response & profile endpoint

---

### Staff Interface

```typescript
interface Staff {
  id: number;
  name: string;
  email: string;
  password: string;  // bcrypted or plain text
  role: Role;        // 'staff' | 'admin' | 'superAdmin'
  department: string;
}

type StaffSafe = Omit<Staff, 'password'>;
```

---

## Request Pipeline Summary

```
1. Request arrives at Express server
   │
2. CORS & Middleware applied
   │
3. Validation Pipe
   ├─ Whitelist fields
   ├─ Forbid non-whitelisted
   └─ Transform to DTO
   │
4. ThrottlerGuard
   ├─ Track requests per IP
   └─ Allow max 20/60s
   │
5. JwtAuthGuard
   ├─ Check @Public() decorator
   ├─ If private route: validate token
   └─ Attach user object to request
   │
6. RolesGuard
   ├─ Check @Roles() decorator
   └─ Validate user.role
   │
7. Controller method executes
   ├─ Access to request.user data
   └─ Call service methods
   │
8. Service returns data
   │
9. Response sent to client
   │
10. Global Exception Filter (if error)
    └─ Format error response
```

---

## Configuration

### App Config (`src/config/app.config.ts`)

```typescript
{
  nodeEnv: 'development' | 'production'  // NODE_ENV env var
  isProduction: boolean
  port: 3000  // PORT env var
  jwtSecret: 'loan-management-secret'  // JWT_SECRET env var
  jwtExpiresIn: '1h'  // JWT_EXPIRES_IN env var
  dataDirectory: './data'  // Location of JSON files
  urls: {
    development: 'http://localhost:3000'  // or DEV_APP_URL
    production: 'https://achieve-team-backend.vercel.app'  // or PROD_APP_URL
    current: (dynamically selected)
  }
  throttle: {
    ttl: 60_000ms,  // 60 seconds
    limit: 20  // requests per window
  }
}
```

---

## Data Files

### 1. `data/staffs.json` (or `data/staff.json`)

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "password": "$2b$10$...",  // bcrypted
    "role": "superAdmin",
    "department": "Management"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "plainpassword123",
    "role": "staff",
    "department": "Operations"
  }
]
```

### 2. `data/loans.json`

```json
[
  {
    "id": "LOAN-001",
    "status": "pending",
    "applicant": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "department": "Operations",
      "totalLoan": 50000
    },
    "maturityDate": "2024-12-31 18:00:00",
    "interestRate": 5.5,
    "loanAmount": 50000
  }
]
```

---

## Error Handling

### Global Exception Filter (`src/common/filters/global-exception.filter.ts`)

Catches all exceptions and formats them into consistent error responses.

**Common Errors:**

| Exception | Status | Message |
|-----------|--------|---------|
| `UnauthorizedException` | 401 | Invalid email or password / Bearer token required |
| `NotFoundException` | 404 | Loan not found / Authenticated user not found |
| `ForbiddenException` | 403 | Insufficient permissions |
| `BadRequestException` | 400 | Validation errors |
| Generic Exception | 500 | Internal server error |

---

## Decorators

### 1. **`@Public()`** (`src/common/decorators/public.decorator.ts`)

Marks a route as publicly accessible (bypasses JWT check).

```typescript
@Public()
@Post('login')
login(@Body() loginDto: LoginDto) { }
```

---

### 2. **`@Roles(...roles)`** (`src/common/decorators/roles.decorator.ts`)

Restricts endpoint to specific roles.

```typescript
@Roles(Role.SUPER_ADMIN)
@Delete('loan/:id/delete')
deleteLoan(@Param('id') id: string) { }
```

---

## Middleware

### Logger Middleware (`src/common/middleware/logger/logger.middleware.ts`)

- Applied to all routes (`*`)
- Logs incoming requests
- Logs request duration & method

---

## Testing Structure

```
test/
  ├─ app.e2e-spec.ts    // End-to-end tests
  └─ jest-e2e.json      // Jest config for e2e

src/
  ├─ app.controller.spec.ts
  ├─ auth/auth.controller.spec.ts
  ├─ auth/auth.service.spec.ts
  ├─ common/guards/jwt-auth/jwt-auth.guard.spec.ts
  ├─ common/guards/roles/roles.guard.spec.ts
  ├─ common/middleware/logger/logger.middleware.spec.ts
  ├─ loans/loans.controller.spec.ts
  ├─ loans/loans.service.spec.ts
  └─ staff/staff.service.spec.ts
```

**Run Tests:**
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

---

## Deployment

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run start:dev"
}
```

### Environment Variables

Create `.env.development` and `.env.production`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
DEV_APP_URL=http://localhost:5173
PROD_APP_URL=https://achieve-team-backend.vercel.app
```

---

## API Endpoints Summary

| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| Post | `/login` | ❌ | — | User login |
| Get | `/profile` | ✅ | — | Get current user profile |
| Post | `/logout` | ✅ | — | Logout (blacklist token) |
| Get | `/` | ❌ | — | Health check |
| Get | `/loans` | ✅ | — | Get all loans (role-filtered) |
| Get | `/loans/expired` | ✅ | — | Get expired loans |
| Get | `/loans/:userEmail/get` | ✅ | — | Get loans by applicant email |
| Delete | `/loan/:loanId/delete` | ✅ | SUPER_ADMIN | Delete loan |

---

## Key Design Patterns

1. **Dependency Injection** - NestJS providers & modules
2. **Role-Based Access Control (RBAC)** - Guards & decorators
3. **JWT Authentication** - Passport + JwtStrategy
4. **Middleware Stack** - Request processing pipeline
5. **Factory Pattern** - `configureNestApp()` for app setup
6. **Service Layer** - Business logic separation
7. **DTO Validation** - `class-validator` & `class-transformer`

---

## Notes

- **In-Memory Storage:** All data loaded from JSON files at startup
- **No Persistence:** Loan deletions are NOT saved to file
- **Rate Limiting:** 20 requests per 60 seconds per IP
- **Token Blacklist:** In-memory only, cleared on restart
- **Password Support:** Both bcrypted and plain text (for legacy)
- **CORS:** Limited to localhost:5173 & vercel.app domains
