# API Documentation

Base URL: `/api`

All endpoints return JSON unless otherwise noted. Authentication is via `mms_session` cookie (JWT).

---

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with email/password | None |
| POST | `/api/auth/register` | Register new account | None |
| POST | `/api/auth/logout` | Clear session | None |
| POST | `/api/auth/update-password` | Reset password via OTP | None |

---

## User

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/switch-mess` | Switch active mess context | Yes |
| POST | `/api/user/change-password` | Change password | Yes |
| GET | `/api/user/download-log` | Download Excel log | Yes |
| POST | `/api/user/update-profile` | Update name/phone/avatar | Yes |
| POST | `/api/user/find-account` | Look up account by email/phone | No |
| POST | `/api/user/upload-avatar` | Upload profile picture | Yes |
| POST | `/api/user/guest-meal` | Request guest meal | Yes |
| POST | `/api/user/stock-access` | Request stock access | Yes |
| POST | `/api/user/leave-mess` | Request to leave mess | Yes |
| GET | `/api/user/meal-off` | Get meal-off status | Yes |
| POST | `/api/user/meal-off` | Create meal-off request | Yes |

---

## Mess

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/mess/create` | Create a new mess | Yes |
| PUT | `/api/mess/create` | Regenerate invite code | Yes (Manager) |
| POST | `/api/mess/join` | Join mess via invite code | Yes |

---

## Admin

### Bazar

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/bazar-duty` | Get bazar duties | Yes |
| POST | `/api/admin/bazar-duty` | Assign bazar duty | Yes (Mod+) |
| PUT | `/api/admin/bazar-duty` | Update duty status | Yes (Mod+) |
| POST | `/api/admin/bazar` | Add bazar expense | Yes (Mod+) |

### Contacts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/contacts` | List contacts (full) | Yes (Mod+) |
| POST | `/api/admin/contacts` | Add contact | Yes (Mod+) |
| PUT | `/api/admin/contacts` | Update contact | Yes (Mod+) |
| DELETE | `/api/admin/contacts` | Delete contact | Yes (Mod+) |

### Deposits

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/deposits` | Record deposit | Yes (Mod+) |

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/events` | List events | Yes (Mod+) |
| POST | `/api/admin/events` | Create event | Yes (Mod+) |
| PUT | `/api/admin/events` | Update event | Yes (Mod+) |
| DELETE | `/api/admin/events` | Delete event | Yes (Mod+) |

### Meals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/meals` | Get meal entries | Yes (Mod+) |
| POST | `/api/admin/meals` | Save meal entries | Yes (Mod+) |

### Members

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/members` | List members | Yes (Mod+) |
| PUT | `/api/admin/members` | Update member role/status | Yes (Manager) |
| DELETE | `/api/admin/members` | Remove member | Yes (Manager) |

### Menu

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/menu` | Get menus | Yes (Mod+) |
| POST | `/api/admin/menu` | Save menus | Yes (Mod+) |

### Notices

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/notices` | List notices | Yes (Mod+) |
| POST | `/api/admin/notices` | Create notice | Yes (Mod+) |
| PUT | `/api/admin/notices` | Update notice | Yes (Mod+) |
| PATCH | `/api/admin/notices` | Toggle pin | Yes (Mod+) |
| DELETE | `/api/admin/notices` | Delete notice | Yes (Mod+) |

### Requests

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/requests` | List pending requests | Yes (Mod+) |
| PUT | `/api/admin/requests` | Approve/reject request | Yes (Mod+) |
| PUT | `/api/admin/requests/approve-join` | Approve join request | Yes (Manager) |

### Stock

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stock` | Get freezer stock | Yes (Mod+) |
| POST | `/api/admin/stock` | Add/update stock item | Yes (Mod+) |
| PUT | `/api/admin/stock` | Update stock item | Yes (Mod+) |
| DELETE | `/api/admin/stock` | Delete stock item | Yes (Mod+) |

---

## Contacts (Member)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/contacts` | List contacts (read-only) | Yes |

---

## Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get unread count | Yes |
| PUT | `/api/notifications` | Mark as read | Yes |

---

## Role Hierarchy

- **Manager** — Full admin access
- **Moderator** — Can manage meals, bazar, deposits, menus, notices
- **Member** — Read access, can submit requests
