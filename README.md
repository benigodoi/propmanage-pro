
## Run Locally

**Prerequisites:**  Node.js 20+, access to the Supabase project


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Supabase dashboard → Settings → API). Never put the service-role key in a `VITE_` variable.
3. Run the app:
   `npm run dev` (http://localhost:3000)

See [`docs/HANDOVER.md`](docs/HANDOVER.md) for architecture, deployment and security notes, and
[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for what's built and what's next.
