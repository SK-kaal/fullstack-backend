# After School API

Node.js + Express server backed by MongoDB Atlas for the after-school lessons marketplace.

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your MongoDB details.
3. Seed the database (optional but recommended):
   ```bash
   npm run seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Available scripts
- `npm run dev` – start Express with nodemon
- `npm start` – run Express once in production mode
- `npm run seed` – load the sample `classes` documents and clear `orders`

## REST endpoints
- `GET /health` – service heartbeat
- `GET /lessons` – list all classes
- `GET /search?q=` – full-text search over subject/location/price/spaces
- `POST /orders` – create a new order
- `PUT /lessons/:id` – update lesson attributes (including spaces after checkout)
- `GET /images/*` – serve static lesson icons (returns 404 JSON if missing)
