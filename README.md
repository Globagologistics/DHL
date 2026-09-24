
  # Buske Logistics Website

This repository contains the front‑end of the Buske Logistics site designed using Figma and built with React, Vite and Tailwind CSS. The goal is a production‑ready, responsive, SEO‑optimized, accessible, and deployable static site.

## Features
* Full fidelity Figma design reproduced with React components
* Mobile‑first responsive layout
* Tailwind CSS utility classes with custom animations
* Routing using `react-router` (v7)
* Netlify-ready build configuration
* ESLint/Prettier configuration for consistent code style
* GitHub Actions CI workflow for linting and building

## Getting started

```bash
npm ci
npm run dev
```

### Environment variables
Copy `.env.example` to `.env` or set your own values for API endpoints etc. Vite variables must be prefixed with `VITE_`.

### Building for production
```bash
npm run build
``` 

### Linting & formatting
```bash
npm run lint
npm run format
```

### Deploying
This project is configured to deploy to Netlify. Build the project, then deploy the `dist` folder (or connect the repo in Netlify and let it build).

```bash
npm run build
```

  This is a code bundle for the Buske Logistics website. The original project is available at https://www.figma.com/design/H0QZC7IttP9eKJYvPdYEbO/Redesign-Buske-Logistics-Website if you need the Figma source.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
---

## Admin Dashboard
A hidden admin control centre is built into the application:

1. **Access** – a secret login system is built in:
   * click the copyright text in the footer **five times**, or
   * repeatedly click the logo in the navbar.  Both actions unlock the admin mode and redirect
     to `/admin`.
2. **Routing** – once unlocked you can browse the admin area:
   * `/admin` – dashboard with a library of all shipments (most recent first)
   * `/admin/new` – full‑page form to create a new shipment
   * `/admin/edit/:id` – same form pre‑filled for editing an existing record
   * `/admin/view/:id` – detail page showing shipment data, interactive progress,
     pause/resume and stop controls (with reason/email prompt)
3. **Features** –
   * Create, edit, and delete shipments using a dedicated page.
   * Each shipment is assigned a unique ID and can store sender/receiver info, images, route screenshot, dates, cost, payment status, transportation method, vehicles/driver details and a list of checkpoints.
   * Uploaded media are previewed via object URLs.
   * Dashboard list includes a progress bar and status badges for paused/stopped shipments.
   * Clicking a shipment from the list navigates to the detail view where an admin can:
     - advance the current checkpoint by clicking on the progress bar
     - pause or resume tracking
     - stop the shipment with a reason (this will open the user's email client to notify the receiver)
   * Newly created shipments appear at the top of the dashboard list ("Recent / Current Track").
   * All data is held in memory; refreshing clears everything.

_Data is currently stored in-memory; refresh clears all shipments. Add a backend for persistence in production._
