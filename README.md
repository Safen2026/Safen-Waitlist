# SAFEN Waitlist

A small Next.js waitlist website for SAFEN. The registration form sends submissions to the existing private Supabase PostgreSQL table:

`waitlist_private.signups`

The browser never connects directly to the database. The API route uses a server-only `DATABASE_URL`.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS is a good choice)
- npm
- A Supabase database connection string for the SAFEN project

## Run locally

1. Open Terminal in this folder.
2. Install packages:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Open `.env.local` and replace the example value with the Supabase Postgres connection string. Use the Supabase Dashboard: **Project → Connect → Connection string → URI**. For a persistent local Next.js server, use the Session pooler connection string if your network cannot use the direct database host.

   The connection string must include SSL, for example `?sslmode=require`.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Visit http://localhost:3000

## Test the form

Submit a test name, email, and phone number. Then check the `waitlist_private.signups` table in Supabase.

Submitting the same email again should show a duplicate-email message. The email uniqueness check is case-insensitive.

## Deploy

Deploy the project to Vercel (or another Node.js host). Add `DATABASE_URL` to the host's server-side environment variables, then deploy. Do not use a `NEXT_PUBLIC_` prefix for this variable and never commit `.env.local`.

## Database assumptions

The project expects the private schema and table already created:

- `waitlist_private.signups`
- `full_name`, `email`, `phone` columns
- unique index on `lower(btrim(email))`

The server database role must have permission to insert into that table. Use a server-only database connection. Do not expose the Supabase service-role key or database password in client-side code.

## Before public launch

This starter includes basic validation and a hidden honeypot field. Add a proper rate limiter and, if needed, CAPTCHA/Turnstile before a public campaign. The honeypot alone is not robust bot protection.
