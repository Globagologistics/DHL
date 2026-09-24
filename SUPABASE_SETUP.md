# Supabase Backend Setup Guide

## Completed Setup

✅ **Environment Variables** (`.env.local`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, server-side only)

✅ **Supabase Client** (`src/lib/supabase.ts`)
- Configured to use your project credentials

✅ **TypeScript Types** (`src/types/database.ts`, `src/types/chat.ts`)
- User, Shipment, Checkpoint, ChatMessage, ChatThread types

✅ **Custom Hooks** (`src/hooks/useSupabase.ts`, `src/hooks/useChat.ts`)
- `useAdminShipments()` - Fetch admin shipments with real-time updates
- `useShipmentWithCheckpoints()` - Fetch shipment + checkpoints
- `useUserShipments()` - Fetch shipments for sender/receiver
- `createShipment()` / `updateShipment()` - Shipment CRUD
- `uploadImage()` - Storage uploads
- `useChatThreads()` - Admin chat thread list with realtime updates
- `useChatMessages()` - Thread messages with realtime updates
- `sendChatMessage()` - Cloud chat messages + media upload

---

## Next Steps: Run SQL Schema

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com -> Dashboard
2. Select your project
3. Click **SQL Editor**
4. Click **New Query**

### 2. Copy & Paste SQL Schema
1. Open `sql_schema.sql`
2. Copy ALL the SQL code
3. Paste into Supabase SQL Editor
4. Click **Run**

### 3. Verify All Tables Created
You should see:
- `users`
- `shipments`
- `checkpoints`
- `chat_threads`
- `chat_messages`

Storage buckets:
- `shipment-images`
- `driver-images`
- `route-screenshots`
- `chat-media`

---

## Features Built In

### Real-time Updates
- Shipments update live (progress, pause/resume, checkpoints)
- Chat messages update live for admin and users

### Row-Level Security (RLS)
- Current policies are permissive for development (anon access)
- Tighten policies before production if you enable auth

### Storage
- Shipments, drivers, routes, and chat media are stored in Supabase Storage

---

## Integration Points

1. `src/app/pages/AdminForm.tsx` - create shipments
2. `src/app/pages/Admin.tsx` - live admin dashboard
3. `src/app/pages/AdminDetail.tsx` - shipment detail updates
4. `src/app/pages/TrackShipment.tsx` - user tracking updates
5. `src/app/pages/UserChat.tsx` - realtime user chat
6. `src/app/pages/AdminChat.tsx` - realtime admin chat

---

## Netlify Deployment

When deploying to Netlify, add these environment variables in Site settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (preferred) or `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Troubleshooting

If SQL fails:
1. Make sure you ran the full script in `sql_schema.sql`
2. Verify table names are lowercase
3. Check the SQL editor error panel for details
