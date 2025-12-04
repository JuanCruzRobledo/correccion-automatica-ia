# Repository Guidelines

Guide for contributors to the AI-assisted grading platform (backend in `backend/`, frontend in `frontend-correccion-automatica-n8n/`, workflows in `n8n-workflows/`).

## Project Structure & Module Organization
- **Backend (`backend/`)**: Express + MongoDB. Core code in `src/` (`config`, `models`, `controllers`, `routes`, `services`, `middleware`). Seeds/tools in `scripts/` (`seedDatabase.js`, `migrateDeletedField.js`).
- **Frontend (`frontend-correccion-automatica-n8n/`)**: React + TypeScript + Tailwind via Vite. UI in `src/components` (`admin`, `user`, `auth`, `shared`, `layout`); data access in `src/services`; hooks in `src/hooks`; shared types in `src/types`.
- **Workflows (`n8n-workflows/`)**: Webhook JSONs for Gemini/Sheets/Drive. `workflows-en-un-archivo.json` = full set; individual files for precise edits.
- **Docs**: Root contains `README.md`, `GUIA_TESTING.md`, `GUIA_CONFIGURACION_Y_DESPLIEGUE.md`, `ESTADO_ACTUAL.md` for process and status.

## Build, Test, and Development Commands
- **Backend** (Node 18+): `cd backend && npm install`; `npm run dev` (nodemon), `npm start` (prod), `npm run seed` (needs n8n + Drive env vars), `npm run migrate:deleted` (soft-delete backfill).
- **Frontend**: `cd frontend-correccion-automatica-n8n && npm install`; `npm run dev` (HMR), `npm run build` (type-check + bundle), `npm run preview`.
- **n8n**: Import `n8n-workflows/workflows-en-un-archivo.json`, set `GOOGLE_GEMINI_API_KEY` and `GOOGLE_DRIVE_ROOT_FOLDER_ID`, activate webhooks before use.

## Coding Style & Naming Conventions
- JavaScript/TypeScript with ES modules; use async/await and small functions.
- Indent with 2 spaces; keep semicolons.
- Components in PascalCase, hooks start with `use`, services in camelCase; API/DB fields stay snake_case (`university_id`, `course_id`).
- Keep UI text consistent in Spanish; avoid hardcoded secrets/URLs.

## Testing Guidelines
- No automated suite yet; rely on `GUIA_TESTING.md` and `GUIA_PRUEBAS.md`.
- Backend smoke: `npm run seed` (with n8n up) then `curl http://localhost:5000/health`; hit CRUD endpoints with Thunder Client/Postman.
- Frontend: `npm run build`; manually validate login, Admin Panel tabs, and User View against seeded data.
- n8n: fire `/rubrica`, `/corregir`, `/spreadsheet`, `/automatico` with sample payloads; ensure workflows are active.

## Commit & Pull Request Guidelines
- Focused commits with short imperative scope tags (e.g., `[backend] guard commission restore`, `[frontend] fix rubric modal`, `[n8n] tighten spreadsheet webhook`).
- Summaries should note rationale and env vars/seeds touched; keep lines under ~72 chars.
- PRs: list tests executed, affected areas (backend/frontend/n8n), and screenshots/GIFs for UI changes; link issue/task when possible. Never commit `.env` files or tokens.

## Security & Configuration Tips
- Derive env files from `.env.example`; align URLs (`CORS_ORIGIN`, `VITE_API_URL`, `N8N_*`) across backend, frontend, and n8n.
- Run n8n before `npm run seed`; set `SEED_CREATE_DRIVE_FOLDERS=false` if Drive is unavailable to avoid duplicates.
- Limit CORS to trusted origins and rotate `JWT_SECRET` outside local dev.
