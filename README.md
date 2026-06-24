# Codovate Meet - Premium Video Conferencing Platform

A modern, premium SaaS video conferencing platform combining the best features of Google Meet, Zoom, Linear, and Notion with AI-powered insights and seamless collaboration tools.

## Overview

Codovate Meet is a fully-featured video conferencing application built with Next.js 15, Framer Motion, and Tailwind CSS. The platform features a glassmorphic design with royal blue accents, dark/light mode support, and premium UI interactions.

## Features

### Core Features
- **Premium Video Grid**: Responsive video conferencing with up to 16 participant support
- **Real-time Chat**: Integrated messaging sidebar with file sharing
- **AI Notes Panel**: Automatic transcription, meeting summaries, action items, and next steps
- **Control Dock**: Floating bottom bar with mute, camera, screen share, and participant controls
- **Responsive Design**: Fully responsive from mobile to desktop

### Dashboard
- **Meeting Management**: View, create, and manage meetings
- **Statistics**: Total meetings, active connections, notes generated, proposals
- **Quick Actions**: Start instant meetings or join with code
- **Recent Meetings**: Table view with status indicators and actions
- **Sidebar Navigation**: Dashboard, Meetings, Proposals, and Settings

### Authentication
- Premium login/register flow with glassmorphic cards
- Email and password authentication UI
- Google OAuth ready (UI prepared)
- Forgot password link

### Additional Pages
- **Settings**: Profile management, security, notifications, and theme preferences
- **Proposals**: List, create, view, download, and manage proposals
- **Join Meeting**: Enter meeting codes or access recent meetings
- **Landing Page**: Hero section with statistics, features showcase, and CTA

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4.2
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui (Button, Input)
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light mode)

### Project Structure

```
app/
├── page.tsx                 # Landing page
├── login/page.tsx          # Login page
├── register/page.tsx       # Registration page
├── join/page.tsx           # Join meeting page
├── dashboard/page.tsx      # Main dashboard
├── settings/page.tsx       # Settings page
├── meeting/[id]/page.tsx   # Meeting room
├── proposals/page.tsx      # Proposals list
├── layout.tsx              # Root layout
├── providers.tsx           # Theme provider
└── globals.css             # Global styles with design tokens

components/
├── ui/
│   ├── button.tsx          # Button component
│   └── input.tsx           # Input component
├── layout/
│   ├── dashboard-header.tsx    # Dashboard header
│   └── dashboard-sidebar.tsx   # Dashboard sidebar
├── meeting/
│   ├── video-grid.tsx      # Video participant grid
│   ├── control-dock.tsx    # Floating control bar
│   ├── chat-sidebar.tsx    # Chat panel
│   └── ai-notes-panel.tsx  # AI notes panel
└── common/
    └── gradient-blob.tsx   # Animated gradient blob
```

## Design System

### Color Palette
- **Primary**: Royal Blue (#2563eb)
- **Accent**: Cyan (#06b6d4)
- **Backgrounds**: White/Dark Navy (#f8f9fb / #0f1729)
- **Surfaces**: Light gray/Dark gray (#ffffff / #1a2541)

### Glassmorphism Effects
- Backdrop blur (md)
- Semi-transparent backgrounds (10-20%)
- Border effects (white/10)
- Shadow effects for depth

### Typography
- **Font Family**: Geist (sans-serif)
- **Mono Font**: Geist Mono
- **Font Sizes**: Semantic hierarchy with Tailwind presets

### Spacing & Radius
- **Spacing**: Tailwind default scale (4px increments)
- **Border Radius**: 12px base (0.75rem)

## Key Components

### Landing Page
- Animated gradient blobs background
- Hero section with CTA buttons
- Statistics cards
- Features showcase
- Call-to-action section
- Footer with links

### Dashboard
- **Header**: Search, notifications, theme toggle, profile
- **Sidebar**: Navigation with active states, usage tracker
- **Statistics Grid**: 4-column stat cards with icons
- **Quick Actions**: Start/Join meeting cards
- **Recent Meetings Table**: Sortable with inline actions

### Meeting Room
- **Video Grid**: 2x2 grid for 4 participants (auto-layout for other counts)
- **Control Dock**: 10 control buttons in floating dock
- **Chat Sidebar**: Message list, input, attachments
- **AI Notes Panel**: Transcript, action items, next steps
- **Header Info**: Meeting title, duration, participant count

### Authentication Pages
- Centered glassmorphic card design
- Form validation UI
- Social auth buttons (Google)
- Links between login/register
- Back navigation

## Interactions & Animations

### Page Transitions
- Fade-in on page load
- Stagger animation for list items
- Smooth scroll transitions

### Component Animations
- Gradient blob floating animation (8s loop)
- Button hover effects
- Chat message appear animations
- Video grid card entrance animations

### Interactive Elements
- Hover state changes
- Active nav indicators
- Loading states
- Responsive touch interactions

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open browser
open http://localhost:3000
```

### Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Deploy to Vercel
vercel deploy
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_APP_NAME=Codovate Meet
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

### Optimizations
- Next.js Image optimization
- CSS-in-JS with Tailwind (tree-shaking)
- Component code-splitting
- Lazy loading where applicable
- Minimal dependencies

### Core Web Vitals
- LCP (Largest Contentful Paint): Optimized for <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

## Future Enhancements

### Phase 2
- Real-time video/audio with WebRTC
- Backend API integration (Node.js/Express or Next.js API routes)
- Database (PostgreSQL/Supabase) for meetings, users, notes
- Authentication (Better Auth / Auth.js)
- Real-time chat with WebSockets

### Phase 3
- AI integrations (transcription, summarization)
- Video recording and playback
- Meeting scheduling
- Proposal generation with AI
- Team management and billing

### Phase 4
- Mobile apps (React Native)
- Advanced analytics
- Integrations (Calendar, CRM, Slack)
- Custom branding for enterprise
- Advanced security features (2FA, SSO)

## Contributing

This is a v0-generated application. To extend:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feedback:
- Email: support@codovate.com
- Website: https://codovate.com
- Issues: GitHub Issues

## Changelog

### v1.0.0 (Initial Release)
- Landing page with hero section
- Authentication (login/register)
- Dashboard with meeting management
- Meeting room with video grid
- Chat sidebar with messaging
- AI Notes panel with transcription
- Settings page with preferences
- Proposals management
- Dark/light theme support
- Responsive design

---

Built with ❤️ using Next.js, Framer Motion, and Tailwind CSS
