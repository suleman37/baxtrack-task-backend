## Local Setup

1. Clone the repository and move into the backend folder.
2. Install dependencies:

```bash
npm install
```

3. Create a local `.env` file in the project root.

You can use either a single `DATABASE_URL` connection string or separate database variables.

```env
PORT=8000
JWT_SECRET=replace-with-a-secure-random-secret

# Option 1: use a PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/db_name

# Option 2: use separate PostgreSQL variables instead of DATABASE_URL
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_NAME=db_name
```

4. Make sure your PostgreSQL database is running and already contains the required tables:

- `users`
- `customers`
- `logs`

Note: `synchronize` is disabled in TypeORM config, so this project does not auto-create tables on startup.

5. Start the development server:

```bash
npm run start:dev
```

The API will run on `http://localhost:8000` if `PORT=8000` is set. If `PORT` is not provided, the app falls back to `8080`.

## Available Scripts

```bash
npm run start
npm run start:dev
npm run start:debug
npm run build
npm run start:prod
npm run lint
```

## Production Build

```bash
npm run build
npm run start:prod
```
