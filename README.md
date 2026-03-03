# Visual Workflow Builder Starter

A visual workflow builder for learning durable workflow patterns on Vercel.

## Quick Start

### Option 1: Deploy to Vercel (Recommended)

Click the deploy button in the course. Database is provisioned automatically.

### Option 2: Local Development

After deploying, set up local dev:

**1. Install Vercel CLI** (if not installed)

```bash
npm i -g vercel
```

**2. Clone your deployed repo**

```bash
git clone <your-repo-url>
cd workflow-builder-starter
pnpm install
```

**3. Link to your Vercel project**

```bash
vercel link
```

Select your project when prompted.

**4. Pull environment variables**

```bash
vercel env pull .env
```

This pulls DATABASE_URL and other env vars from your Vercel project.

**5. Push database schema**

```bash
pnpm db:push
```

**6. Run dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## What You'll See

- **Visual workflow canvas** — Drag-and-drop nodes connected by edges
- **Sample workflows** — "Hello Workflow" and "Data Pipeline" load automatically on first visit
- **Execution logs** — Watch each step run with timing and output

## Run the Workflow

1. Open the app
2. See the seeded workflow on the canvas
3. Click **Run** to execute
4. Watch the logs show step-by-step execution

## Development Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production (runs db:push first)
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

## Learn More

- [Vercel Workflow Documentation](https://useworkflow.dev/docs/introduction)
