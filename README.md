# Graeville POS

**Graeville POS** is a point-of-sale system for retail shops, rebuilt from an original Laravel 7 app as:

| Part | Stack | Folder |
| --- | --- | --- |
| API | NestJS 11 · TypeORM 1.x · PostgreSQL 16 · JWT | [`backend/`](backend) |
| Web app | Angular 21 · Clarity 18 · angular-i18next · signals | [`frontend/`](frontend) |

Everything the Laravel app did is here: login & roles, users, brands, categories, products (with Excel import/export), customers (with birthdays), the sell screen (barcode scan / name search), parked sales, checkout with discount and payment type, printable and e-mailed receipts, returns, my sales / recent sales / all sales, reports (sales, by salesperson, out of stock, close of day) and the online sync.

---

## 1. Run it locally

### Prerequisites

| Tool | Version | macOS (Homebrew) |
| --- | --- | --- |
| Node.js | 22 LTS or 24 LTS | `brew install node@22` |
| npm | 10+ (comes with Node) | — |
| PostgreSQL | 14+ (16 recommended) | `brew install postgresql@16` **or** Docker Desktop |

> Works on Apple Silicon — there are no native modules to compile (`bcryptjs`, not `bcrypt`).

### Step 1 — Start PostgreSQL

**Option A: Docker** (from the project root)

```bash
docker compose up -d          # creates database "graeville_pos", user/password postgres/postgres
```

**Option B: Homebrew**

```bash
brew services start postgresql@16
createdb graeville_pos
# Homebrew's default superuser is your macOS username with no password.
# Either put that username in DB_USERNAME (and leave DB_PASSWORD empty), or create the postgres role:
psql -d graeville_pos -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```

### Step 2 — API (`backend/`)

```bash
cd backend
npm ci                         # installs exactly what's in package-lock.json
cp .env.example .env           # then edit .env (see below)
npm run migration:run          # creates all tables
npm run seed                   # creates the first Super Admin
npm run start:dev              # http://localhost:3000/api  (Swagger: http://localhost:3000/api/docs)
```

In `.env`, at minimum set:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=graeville_pos
JWT_SECRET=<paste the output of: openssl rand -hex 32>
```

The seed creates `admin@graeville.com` / `password1!` (change it with the `SEED_ADMIN_*` variables before seeding, or from **My profile → Change password** after signing in).

**Optional — test data:** `npm run seed:demo` loads 8 brands, 6 categories and 30 products (3 out of stock, 3 with 1–3 left). It's safe to run again; it resets those products' prices and stock. The same catalogue is in `sample-data/demo-products.xlsx` if you'd rather test **Products → Import Excel**. Barcodes are fictional EAN-13 numbers starting `615000…` — type one into the Sell screen, e.g. `6150000000198` (Indomie Chicken Noodles).

### Step 3 — Web app (`frontend/`)

```bash
cd frontend
npm ci
npm start                      # http://localhost:4200
```

`npm start` proxies `/api` to `http://localhost:3000` (see `proxy.conf.json`), so there is no CORS setup to do. Open <http://localhost:4200> and sign in with the seeded admin.

### Everyday commands

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run start:dev` | API with auto-reload |
| backend | `npm test` | Unit tests |
| backend | `npm run lint` | ESLint + Prettier |
| backend | `npm run migration:generate --name=AddSomething` | Generate a migration after changing an entity |
| backend | `npm run migration:run` / `migration:revert` | Apply / undo migrations |
| frontend | `npm start` | Dev server on :4200 |
| frontend | `npm run build` | Production build to `dist/graeville-pos-web/browser` |

---

## 2. Configuration (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | API port |
| `CORS_ORIGINS` | `http://localhost:4200` | Comma-separated origins allowed to call the API |
| `APP_TIMEZONE` | `Africa/Lagos` | Defines "today" for order numbers, my-sales and reports |
| `DB_*` | — | PostgreSQL connection |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | — / `12h` | Login tokens (one shift) |
| `DEFAULT_USER_PASSWORD` | `ChangeMe123` | Password for users an admin creates without one (Laravel used `123456`) |
| `APP_NAME` | `Graeville POS` | Product name in Swagger, the browser tab and the sign-in page |
| `STORE_NAME`, `STORE_ADDRESS`, `STORE_PHONE`, `STORE_EMAIL`, `STORE_RECEIPT_FOOTER`, `STORE_CURRENCY` | Mecca Beauty sample | **First-run defaults only** — copied into the database the first time the API starts. After that, edit them in the app (section 2a). |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | empty | SMTP for e-mailed receipts. Leave `MAIL_HOST` empty locally — e-mails are logged to the console instead. Mailtrap works well for testing. |
| `SYNC_REMOTE_URL`, `SYNC_API_KEY`, `SYNC_CRON_ENABLED` | empty / `false` | Online sync (section 5) |

The API refuses to start if a required variable is missing or `JWT_SECRET` is shorter than 16 characters.

### 2a. Setting it up for a customer

Each install is branded for the shop using it (the sample customer is **Mecca Beauty**). Sign in as an Admin or Super Admin and open **Administration → Store settings** to change:

- **Store name** — top of every receipt, the header and the sign-in page
- **Address** and **phone number(s)** — printed under the name on receipts
- **E-mail** — shown on e-mailed receipts
- **Receipt footer** — e.g. a thank-you note or returns policy
- **Currency** — 3-letter code used to format every price (default `NGN`)

There's a live receipt preview beside the form. Saving takes effect immediately: no `.env` edit, no restart. The values live in the `store_settings` table.

For a brand-new install you can also pre-fill them with the `STORE_*` variables in `backend/.env` **before the first start**; they're only used to create that row once.

---

## 3. Project structure

### Backend — feature modules

Based on your `test-app` layout (one folder per feature with `entity` / `dto` / `service` / `controller` / `module`), with four additions: features live under `modules/`, cross-cutting code lives in `common/`, configuration is env-driven in `config/`, and the schema is owned by real migrations in `database/` instead of `synchronize: true`.

```
backend/src
├── main.ts                     # bootstrap: /api prefix, ValidationPipe, helmet, CORS, Swagger
├── app.module.ts               # wires modules + global JWT/roles guards, serializer, DB error filter
├── app.controller.ts           # GET /api/health, GET /api/store-info (public branding)
├── config/
│   ├── configuration.ts        # typed config from env vars
│   ├── env.validation.ts       # fail fast on bad env
│   └── typeorm.config.ts       # shared by the app and the migration CLI
├── database/
│   ├── data-source.ts          # TypeORM CLI entry
│   ├── migrations/             # InitialSchema + future migrations
│   └── seeds/run-seed.ts       # first Super Admin
├── common/
│   ├── decorators/             # @Public, @Roles, @CurrentUser, @Terminal
│   ├── guards/                 # JwtAuthGuard (global), RolesGuard (global)
│   ├── filters/                # unique/foreign-key violations → 409 instead of 500
│   ├── entities/               # BaseEntity (id, timestamps), SyncableEntity (+ synced flag)
│   ├── enums/                  # Role, PaymentType
│   ├── dto/                    # pagination & date-range query DTOs
│   └── utils/                  # money (kobo maths), dates, transforms
└── modules/
    ├── auth/        users/      brands/      categories/
    ├── products/   (+ products-excel.service.ts for import/export)
    ├── customers/   orders/     packings/    reports/
    ├── mail/       (nodemailer + receipt template)
    ├── settings/   (store name/address/phone/footer — GET/PUT /api/settings/store)
    └── sync/       (push/pull to the online store, scheduler, API-key guard)
```

### Frontend — Cradle-style Angular

Standalone components, signals for state, `inject()`, the built-in control flow (`@if`, `@for … track`), functional guards and interceptors, lazy-loaded feature routes, Clarity components (datagrids, modals, forms, alerts as toasts) and every user-facing string in `assets/i18n/en.json` via `angular-i18next`.

```
frontend/src
├── app/
│   ├── app.config.ts           # router, HttpClient + interceptor, i18next, Clarity icons
│   ├── app.routes.ts           # lazy routes; auth / guest / manager guards
│   ├── core/                   # singletons
│   │   ├── auth/               # AuthService (signals), guards
│   │   ├── http/               # ApiService, auth interceptor (JWT + X-Terminal-Id, 401 → sign out)
│   │   ├── models/             # API types
│   │   ├── services/           # data services, toast, confirm dialog, terminal, store info
│   │   └── icons/              # Clarity icon registration
│   ├── shared/                 # page-header, stat-card, toast container, confirm dialog, money pipe, utils
│   ├── layout/shell/           # Clarity header + vertical nav
│   └── features/
│       ├── auth/login          dashboard
│       ├── sales/              # pos (sell screen), checkout modal, receipt, sales lists, parked, cart.store.ts
│       ├── products/           brands/   categories/   customers/
│       ├── reports/            # sales, by salesperson, out of stock, close of day
│       ├── users/              # user admin, my profile (password, till name)
│       ├── settings/           # Store settings (customer branding + receipt preview)
│       └── sync/
├── assets/i18n/en.json
└── environments/
```

> If you want the folder names to match `cradle.control-fe` exactly (e.g. a `pages/` vs `features/` split or a `state/` folder), only the folder names change — the components are self-contained.

---

## 4. Laravel → NestJS/Angular map

| Laravel | Now |
| --- | --- |
| `routes/web.php` + Blade views | Angular routes (`app.routes.ts`, `*.routes.ts`) + JSON API under `/api` |
| `Auth::attempt`, sessions | `POST /api/auth/login` → JWT; `GET /api/auth/me` |
| `UserCart` (PHP session) | `CartStore` in the browser (signals + localStorage, survives a refresh) |
| `orders.orderItems` (PHP `serialize`) | `order_items` table, one row per line |
| `sync` column `"on"/"off"` | `synced` boolean |
| `products.categories` (free text) + `brand_id` | `categoryId` / `brandId` foreign keys |
| `gethostname()` for parked sales | `X-Terminal-Id` header — each browser/till has a name (editable on **My profile**) |
| `ProductController@getOrdersCreate`, `getAddToCart*`, `increase/decrease/updateCartOrders` | `GET /api/products/lookup?code=` and `/products/search?q=`; cart maths in the browser |
| `postCheckoutPage` | `POST /api/orders/checkout` |
| `finalCartPage` (pack), `ViewPacked`, `getUnpack`, `sellPacked` | `POST/GET/DELETE /api/packings`; resume = load into cart, checkout with `packingId` |
| `getMySales`, `getMyRecentSales`, `getRecentSales` | `GET /api/orders/mine/today`, `/orders/mine/recent`, `/orders` |
| `getPrintPage`, `re-print`, `printout`, `printtt`, `getInvoice` | `GET /api/orders/:id`, `/orders/number/:orderNumber` → one printable receipt page |
| `postMailReceipt` | `POST /api/orders/:id/email-receipt` |
| `postReturn` (items = all) | `POST /api/orders/:id/return` |
| `ReportController@*` | `GET /api/reports/sales`, `/reports/close-day`, `/reports/out-of-stock`, `/reports/dashboard` |
| `ExcelImportController` (maatwebsite/excel) | `POST /api/products/import`, `GET /api/products/export` (exceljs) |
| `Console/Commands/Send*Online` / `Receive*Online` + scheduler | `SyncService` + `SyncScheduler` (every minute when enabled) |
| `api/v1/*/get*Data`, `send*ToLocal` | `POST /api/sync/inbound/:entity`, `/sync/outbound/:entity` (+ `/ack`) |

Full endpoint list with request/response shapes: <http://localhost:3000/api/docs>.

### Behaviour that changed (on purpose)

- **Checkout is a single database transaction** with the product rows locked, so two tills selling the last unit at the same moment can't both succeed (stock can't go negative; there's also a DB check constraint). Order numbers keep the Laravel format (`yymmdd` + 4-digit daily sequence, e.g. `2610150001`) but are generated under a lock, so they never collide.
- **Prices come from the database at checkout**, never from the browser, and money is added in kobo to avoid rounding drift.
- **Discount can't exceed the total** (Laravel allowed a negative amount paid).
- **Out-of-stock and "not enough stock" show a message** instead of the old `dd("nothing")` crash.
- **Re-importing an Excel sheet updates products by barcode** instead of inserting duplicates; brands/categories named in the sheet are created if missing. Old Laravel sheets (`sync, name, categories, cost_price, selling_price, quantity, barcode`) still import.
- **Roles are enforced on the API**, not just hidden in the menu. Cashiers (`User`) can sell, see their own sales, close their day, and manage products/brands/categories/customers. `Admin` and `Super Admin` also get all sales, reports, returns, deletes, Excel import/export and user management. Only a Super Admin can create or edit another Super Admin. Role values are now `User`, `Admin`, `Super Admin`.
- **Sync endpoints require a shared key** (`X-Sync-Key`). In Laravel they were open to anyone.
- New users get `DEFAULT_USER_PASSWORD` (or a password the admin types) instead of a hard-coded `123456`.
- Passwords from the old database still work: Laravel's `$2y$` bcrypt hashes are accepted as-is.

---

## 5. Online sync (optional)

The original Laravel app ran in the shop and copied data to/from an online copy. The same works here: run one API in the shop and one online, both with the **same** `SYNC_API_KEY`.

```dotenv
# Shop install (backend/.env)
SYNC_REMOTE_URL=https://your-online-api.example.com/api
SYNC_API_KEY=<long random string, same on both>
SYNC_CRON_ENABLED=true      # push + pull every minute, like the Laravel scheduler

# Online install
SYNC_API_KEY=<same string>
```

Records are matched on natural keys (product barcode, customer phone, order number, user e-mail, brand/category number), so database ids don't need to match. The **Online sync** page shows what's waiting to upload and lets you push or pull one table at a time. Like the Laravel version, the last write wins — including product stock levels — so if both sides sell at the same time, re-check stock after syncing.

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm error Cannot read properties of null (reading 'edgesOut')` | A bug in npm 10 when there is no lockfile. Use `npm ci` (the lockfiles are included) or update npm: `npm i -g npm@latest`. |
| `Invalid environment configuration` on API start | A variable in `backend/.env` is missing or `JWT_SECRET` is under 16 characters. |
| `password authentication failed for user "postgres"` | Match `DB_USERNAME`/`DB_PASSWORD` to your Postgres (see Step 1, Homebrew note). |
| `relation "users" does not exist` | Run `npm run migration:run` in `backend/`. |
| Web app shows "Cannot reach the server" | Start the API (`npm run start:dev`) — the dev server proxies `/api` to port 3000. |
| Port 5432 already in use (Docker) | Another Postgres is running: `brew services stop postgresql@16`, or change the port mapping in `docker-compose.yml` and `DB_PORT`. |
| Receipt e-mail "Unable to send mail" | Check the `MAIL_*` settings; with `MAIL_HOST` empty the e-mail is only logged. |

### Moving data from the old MySQL database

Not automated in this repo. The schema maps 1:1 except that `orders.orderItems` (PHP-serialised carts) must be unpacked into `order_items` rows, `products.categories` (text) becomes a `categoryId`, and `sync` `"on"/"off"` becomes `synced` true/false. User passwords can be copied as they are.
