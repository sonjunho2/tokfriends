# Fix Proposals for API usage

## Align client endpoints with contract
- Review missing endpoints detected in the client that do not exist in the OpenAPI contract:
  - `POST /{p}` (e.g. src/api/client.js:69)
  - `GET /{url}` (e.g. src/api/client.js:101)
  - `POST /{url}` (e.g. src/api/client.js:106)
  - `PUT /{url}` (e.g. src/api/client.js:111)
  - `PATCH /{url}` (e.g. src/api/client.js:116)
  - `DELETE /{url}` (e.g. src/api/client.js:121)
  - `POST /auth/login` (e.g. src/api/client.js:142)
  - `POST /auth/signup` (e.g. src/api/client.js:206)
  - `POST /auth/register` (e.g. src/api/client.js:206)
  - `POST /signup` (e.g. src/api/client.js:206)
  - ...and 33 more
  - Decide whether to add these endpoints to the server contract or simplify the client fallbacks.

## Remove stale contract operations
- The following contract operations are unused by the current client. Consider pruning or documenting the gap:
  - `GET /` – Redirect to docs
  - `POST /auth/apple` – Apple login
  - `GET /users/search` – Search users
  - `PATCH /users/{id}` – Update profile
  - `GET /users/{id}` – Get user
  - `GET /admin/users` – Admin list users
  - `GET /admin/users/{id}` – Admin user detail
  - `PATCH /admin/users/{id}` – Admin update user
  - `PATCH /admin/users/{id}/status` – Admin update status
  - `POST /admin/users/{id}/notes` – Admin add note
  - ...and 28 more

## Environment consistency
- Confirm that all environments use a consistent `EXPO_PUBLIC_API_BASE_URL`. Current values:
  - https://tok-friends-api.onrender.com
  - https://manage.tokfriends.app
- Android manifest does not opt-in to cleartext traffic. Keep backend endpoints HTTPS.
