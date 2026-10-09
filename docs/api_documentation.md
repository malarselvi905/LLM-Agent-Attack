# DVLA API Documentation

### Base URL: `/api`

## Authentication
- **POST `/auth/register`**: Registers a new user.
  - Body: `{ name: string, email: string, password: string }`
  - Returns: `{ message, token, user }`
- **POST `/auth/login`**: Authenticates user and returns JWT.
  - Body: `{ email: string, password: string }`
  - Returns: `{ message, token, user }`
- **POST `/auth/logout`**: Invalidates session and writes audit log.
- **GET `/auth/me`**: Returns current authenticated user profile.
- **POST `/auth/change-password`**: Updates user password.
  - Body: `{ current_password: string, new_password: string }`

## Dashboard
- **GET `/dashboard/summary`**: Returns aggregate security stats, risk breakdown, and category distribution.
- **GET `/dashboard/activity`**: Returns recent assessments and findings.

## Assessments
- **GET `/assessments`**: Lists assessments owned by the user (or all if admin).
- **POST `/assessments`**: Creates a new security assessment.
- **GET `/assessments/{id}`**: Returns full assessment details with results and findings.
- **POST `/assessments/{id}/run`**: Executes test suite against target agent model.
- **DELETE `/assessments/{id}`**: Deletes assessment.

## Test Cases
- **GET `/test-cases`**: Returns active test cases with category and difficulty filters.
- **POST `/test-cases`**: Creates custom test case.
- **GET `/test-cases/{id}`**: Retrieves single test case.

## Findings & Risk Scoring
- **GET `/findings`**: Lists findings with risk, category, and status filters.
- **GET `/findings/{id}`**: Retrieves single finding.
- **PATCH `/findings/{id}/status`**: Updates status (`Open`, `In Progress`, `Resolved`, `Accepted Risk`).

## Reports & Exports
- **GET `/assessments/{id}/report`**: Generates full executive report JSON.
- **GET `/assessments/{id}/export/csv`**: Downloads CSV report with formula injection sanitization.

## Audit Logs & Admin
- **GET `/audit-logs`**: Retrieves audit trail.
- **GET `/admin/users`**: Lists registered users (Admin only).
- **PATCH `/admin/users/{id}/role`**: Toggles user/admin roles.
- **PATCH `/admin/users/{id}/status`**: Activates/deactivates accounts.
