# Hang - Schedule Hangouts Effortlessly

A modern web application built with SvelteKit that helps friends coordinate and schedule hangouts easily.

## Features

- 👥 Smart friend selection with search and categorization
- 📅 Flexible scheduling with availability matching
- 👥 Group management for frequent hangouts
- 🗓️ Time slot voting system
- 🔄 Real-time updates with Supabase

## Tech Stack

- Frontend: SvelteKit
- Styling: Tailwind CSS
- Backend: Supabase
- Deployment: Vercel

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hang.git
   cd hang
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then fill in your Supabase credentials in the `.env` file.

4. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

This app is configured for deployment on Vercel:

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Create a new project
4. Import your GitHub repository
5. Deploy

The app uses Supabase for data persistence, so no additional configuration is needed.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT License - see LICENSE file for details
