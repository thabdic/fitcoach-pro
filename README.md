# FitCoach Pro

A full-stack fitness coaching platform.

- **Backend** — Node.js, Express, TypeScript, MongoDB/Mongoose, JWT auth.
- **Frontend** — Angular 21 (standalone components), PrimeNG 21, PrimeIcons, PrimeFlex, SCSS.

> **Project status:** Feature-complete (pre-test). The backend exposes the full
> REST API (auth, users, profile, plan requests, workout/meal plans, progress,
> dashboard) and the Angular frontend implements auth, the role-based app shell,
> and all role-specific feature pages. Automated tests (E2E/API) are the next step.
>
> 📚 See [`docs/`](docs/): [app requirements](docs/app-requirements.md) ·
> [API contract](docs/api-contract.md) · [manual test plan](docs/manual-test-plan.md).

---

## Prerequisites

| Tool        | Version (tested)        |
| ----------- | ----------------------- |
| Node.js     | 20.x (20.19+)           |
| npm         | 10.x                    |
| Yarn        | 1.22.x (frontend)       |
| MongoDB     | 6.x or 7.x, running locally on port **27018** |
| Angular CLI | 21.x (`npm i -g @angular/cli`) |

> The backend uses **npm**; the frontend was scaffolded with **Yarn 1**. Use the
> package manager indicated for each app so the lockfiles stay consistent.

---

## Repository layout

```txt
FitCoach Pro/
  backend/    Express + TypeScript REST API
  frontend/   Angular + PrimeNG single-page app
  README.md
  .gitignore
```

---

## MongoDB

The backend expects a MongoDB instance reachable at the `MONGO_URI` below. This
project's local setup runs MongoDB on **port 27018** (not the 27017 default), so
the connection string is:

```txt
mongodb://127.0.0.1:27018/fitcoach_pro
```

**Option A — local install:** install MongoDB Community Server and start the
`mongod` service on port 27018 (`mongod --port 27018 ...`). The `fitcoach_pro`
database is created automatically on first write.

**Option B — Docker:**

```bash
docker run -d --name fitcoach-mongo -p 27018:27017 mongo:7
```

---

## Environment variables

### Backend (`backend/.env`)

Copy the template and adjust as needed:

```bash
# from the backend/ folder
cp .env.example .env       # PowerShell: Copy-Item .env.example .env
```

| Variable         | Default                                          | Description                          |
| ---------------- | ------------------------------------------------ | ------------------------------------ |
| `PORT`           | `4000`                                           | API port                             |
| `NODE_ENV`       | `development`                                    | Runtime environment                  |
| `MONGO_URI`      | `mongodb://127.0.0.1:27018/fitcoach_pro`         | MongoDB connection string            |
| `JWT_SECRET`     | `change-me-to-a-long-random-secret`              | JWT signing secret (change this)     |
| `JWT_EXPIRES_IN` | `7d`                                             | JWT lifetime                         |
| `CORS_ORIGIN`    | `http://localhost:4200`                          | Allowed CORS origin (the frontend)   |

### Frontend

The API base URL lives in `frontend/src/environments/environment.ts`
(`apiUrl: 'http://localhost:4000/api'`). Change it there if the backend runs
elsewhere. The JWT is stored in `localStorage` and attached to API requests by
the auth interceptor; a 401 triggers an automatic logout.

---

## Running the apps

Run the two apps in **separate terminals**.

### 1. Backend (port 4000)

```bash
cd backend
npm install            # first time only
npm run dev            # ts-node-dev with auto-reload
```

Verify it is up:

```bash
curl http://localhost:4000/api/health
# { "success": true, "data": { "status": "ok", ... } }
```

Other backend scripts:

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start in watch mode (ts-node-dev)    |
| `npm run build` | Compile TypeScript to `dist/`        |
| `npm start`     | Run the compiled server (`dist/`)    |
| `npm run seed`  | Reset & seed the DB (3 users + sample profile/plans/progress) |

> **Seeded accounts** (all with password `Password123!`):
> `admin@fitcoach.test`, `trainer@fitcoach.test`, `client@fitcoach.test`,
> `client2@fitcoach.test`. The seed also creates fitness profiles, plan requests
> (varied statuses), workout/meal plans, and progress updates so every dashboard
> has data. `npm run seed` compiles first, then runs `dist/seed/seed.js`.

### 2. Frontend (port 4200)

```bash
cd frontend
yarn install           # first time only
yarn start             # ng serve
```

Open <http://localhost:4200>. You should see the FitCoach Pro foundation page.

Other frontend scripts:

| Command       | Description                     |
| ------------- | ------------------------------- |
| `yarn start`  | Dev server (`ng serve`)         |
| `yarn build`  | Production build (`ng build`)   |
| `yarn test`   | Unit tests                      |

---

## Quick start (TL;DR)

```bash
# Terminal 1 — database (if using Docker)
docker run -d --name fitcoach-mongo -p 27018:27017 mongo:7

# Terminal 2 — backend
cd backend && npm install && npm run seed && npm run dev

# Terminal 3 — frontend
cd frontend && yarn install && yarn start
```

Then browse to <http://localhost:4200>.
