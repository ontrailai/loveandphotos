# LOVEP Photography/Videography Marketplace

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Configuration
VITE_APP_URL=http://localhost:3000
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema in `supabase/schema.sql`
   - Copy your project URL and anon key to `.env`

3. Set up Stripe:
   - Create a Stripe account (test mode)
   - Copy your publishable and secret keys to `.env`

4. Run the development server:
```bash
npm run dev
```

## Project Structure

```
/src
  /components     - Reusable UI components
  /pages         - Page-level components
  /lib           - External service clients
  /utils         - Helper functions and utilities
  /hooks         - Custom React hooks
  /contexts      - React context providers
/supabase        - Database schema and migrations
/public          - Static assets
```

## Key Features

- **Two-sided marketplace** for photographers and clients
- **Role-based authentication** (customers vs photographers)
- **Smart booking system** with availability management
- **Stripe payments** with dynamic pricing rules
- **Photographer tiering system** based on experience
- **Training and onboarding** for photographers
- **Review and rating system**
- **Portfolio management**
- **Personalization quiz** for clients

## Tech Stack

- **Frontend**: React + Vite + React Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: TailwindCSS
- **Payments**: Stripe
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
