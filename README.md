# AniXDex Music Player

A modern, feature-rich music streaming application built with Next.js 14, TypeScript, and Tailwind CSS. This project migrates the original HTML/CSS/JavaScript music player to a modern tech stack while preserving the exact original design and user experience.

## 🎵 Features

- **Modern Tech Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth and email/password
- **Music Streaming**: JioSaavn API integration for music content
- **User Personalization**: Favorite artists selection and personalized recommendations
- **Playlist Management**: Create, edit, and manage custom playlists
- **Listening History**: Track and display recently played songs
- **Responsive Design**: Mobile-first design with touch optimization
- **Real-time Audio Player**: Full-featured audio player with queue management
- **Database**: MongoDB with Mongoose ODM for data persistence
- **Validation**: Zod schemas for all API inputs and forms

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account or local MongoDB instance
- Google OAuth credentials (optional)
- JioSaavn API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anixdex-music-player
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/anixdex

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # JioSaavn API
   JIOSAAVN_API_BASE=https://jiosaavnapi-harsh.vercel.app/api
   JIOSAAVN_FALLBACK_API=https://saavn.dev/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components
│   └── music/             # Music-specific components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
├── models/                # MongoDB models
└── types/                 # TypeScript type definitions
```

## 🎨 Design System

The application maintains the exact original design with:

- **Colors**: Dark theme with #000 background and #09f accent
- **Typography**: Inter font family with original sizing
- **Components**: Glassmorphism effects with backdrop blur
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first approach with exact breakpoints

## 🔧 Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod schemas
- **State Management**: React Context + useReducer
- **API Integration**: JioSaavn API for music content

## 📱 Features Overview

### Authentication & Onboarding
- Email/password and Google OAuth login
- New user onboarding with favorite artists selection
- Protected routes with middleware

### Music Discovery
- Home page with trending, new releases, and featured content
- Advanced search with songs, artists, and albums
- Personalized recommendations based on favorite artists

### Audio Player
- Full-featured audio player with play/pause, next/previous
- Progress bar with seek functionality
- Volume controls and queue management
- Player overlay with visualizer area
- Vinyl record spinning animation

### User Features
- Custom playlist creation and management
- Listening history tracking
- User profile with statistics
- Preferences management

### Mobile Experience
- Responsive design for all screen sizes
- Touch-optimized controls
- Mobile player bar with swipe gestures
- Adaptive layouts for different orientations

## 🔒 Security Features

- Input validation with Zod schemas
- Protected API routes with authentication
- CSRF protection with NextAuth
- Secure session management
- Environment variable protection

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original design inspiration from the HTML/CSS/JavaScript version
- JioSaavn API for music content
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework

## 🐛 Known Issues

- Spotify integration is planned for future releases
- File-based playlist import is in development
- Some advanced audio features are still being implemented

## 📞 Support

For support, email support@anixdex.com or create an issue in the repository.

---

**Built with ❤️ by the AniXDex team**