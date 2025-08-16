# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server on port 3500
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint
```

## Project Architecture

This is a Next.js 15.3.3 clinic administration system using App Router, TypeScript, and Supabase.

### Key Technical Stack
- **Frontend**: Next.js 15.3.3, React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **UI Components**: Radix UI, shadcn/ui pattern

### Core Application Structure

The application follows a multi-step wizard pattern for clinic data entry with these main sections:

1. **Admin Authentication** (`/admin/login`) - Supabase Auth integration
2. **Clinic Upload Wizard** (`/admin/upload`) - 6-step process:
   - Basic Info → Contact Info → Business Hours → Doctors/Images → Treatments → Languages/Feedback
3. **Reservation Management** (`/admin/reservation`) - Real-time appointment handling

### Database Tables (with `prepare_` prefix for staging)
- `prepare_hospital` - Main clinic information
- `prepare_doctor` - Doctor profiles  
- `prepare_hospital_details` - Extended details
- `prepare_hospital_treatment` - Available treatments
- `prepare_hospital_business_hour` - Operating hours
- `reservations` - Appointment bookings
- `admin` - Admin users

### Important Patterns

1. **API Routes**: Each upload step has its own API endpoint (`/api/upload/stepN`)
2. **Real-time Updates**: Uses `useReservationRealtime` hook for live data
3. **File Uploads**: Handled via Supabase Storage with drag-and-drop UI
4. **Form State**: Multi-step forms use context providers for state persistence
5. **Client Components**: Heavy use of "use client" directive for interactive features

### Working with Supabase

The app uses environment variables for Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Real-time subscriptions are managed through custom hooks in `/hooks`.

### Current Development Focus

The `refact/add_draft_save_functionality` branch is implementing:
- Draft saving for multi-step forms
- Enhanced reservation management
- Alarm/notification system
- Improved real-time synchronization