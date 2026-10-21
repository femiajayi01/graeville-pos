# Graeville POS — API

NestJS 11 + TypeORM + PostgreSQL. Setup, configuration and structure are in the [root README](../README.md).

```bash
npm ci
cp .env.example .env      # set DB_* and JWT_SECRET
npm run migration:run
npm run seed
npm run start:dev         # http://localhost:3000/api — Swagger at /api/docs
```
