<h1 align="center">🎵 Realtime Spotify Clone</h1>

<p align="center">
  A full-stack music streaming application with real-time features, social interactions, and comprehensive admin controls.
</p>

<p align="center">
  [![Live Demo](https://img.shields.io/badge/Live_Demo-green?style=for-the-badge&logo=render)](https://realtime-spotify-clone-test.onrender.com/)
</p>

<p align="center">
  <img src="/frontend/public/screenshot-for-readme.png" alt="Application Demo" width="800"/>
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Patterns](#-architecture-patterns)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎵 Music Player
- **Playback Controls**: Play, pause, skip tracks, and navigate through playlists
- **Volume Control**: Adjustable volume slider with real-time feedback
- **Queue Management**: View and manage the current playback queue
- **Album & Song Management**: Browse albums, songs, and curated playlists

### 👥 Social Features
- **Friend System**: Send, accept, and reject friend requests with real-time notifications
- **Online/Offline Status**: See which friends are currently online (Observer Pattern)
- **Activity Sharing**: View what your friends are listening to in real-time
- **Real-time Chat**: Built-in messaging system for connected friends

### 🎧 User Experience
- **AI Chatbot**: Intelligent music recommendation assistant powered by Google Gemini AI
- **Personalized Recommendations**: "Made For You" section based on recent additions
- **Trending Songs**: Discover popular tracks sorted by play count
- **Search Functionality**: Find songs, albums, and artists quickly
- **Responsive Design**: Seamless experience across desktop and mobile devices

### 🛠️ Admin Dashboard
- **Content Management**: Create, update, and delete songs and albums
- **Analytics Dashboard**: View platform statistics and user engagement metrics
- **Upload System**: Integrated Cloudinary for media file management
- **Admin Authentication**: Secure admin-only routes and features

### 🏗️ Technical Highlights
- **Real-time Communication**: WebSocket-based live updates using Socket.IO
- **Observer Pattern**: Implemented for friend activity notifications and online status
- **Authentication**: Secure user authentication with Clerk
- **State Management**: Zustand for efficient client-side state handling
- **Database**: MongoDB with Mongoose ODM for data persistence

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: Zustand
- **Routing**: React Router v6
- **Authentication**: Clerk
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: Clerk
- **AI Integration**: Google Gemini AI for music recommendations
- **File Upload**: Cloudinary
- **File Processing**: express-fileupload

---

## 🏛️ Architecture Patterns

### Observer Pattern Implementation

This application implements the **Observer Pattern** for real-time friend activity notifications and online status updates.

**Key Components:**

1. **Subject (Observable)**: `UserActivitySubject`
   - Manages user online/offline states
   - Notifies observers when state changes occur
   - Handles friend request lifecycle events

2. **Observers**: `SocketObserver`
   - Each connected user has a dedicated observer
   - Receives notifications from the subject
   - Emits real-time updates to frontend clients

3. **Benefits**:
   - Loose coupling between components
   - Scalable real-time notification system
   - Easy to add new observers (email, push notifications, analytics)
   - Automatic UI updates when friend status changes

**Real-world Example**: When User A comes online, all friends (User B, C, D) automatically see the green status indicator without manual refresh - this is the Observer Pattern in action!

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Clerk account for authentication
- Cloudinary account for media storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/enemkayy/realtime-spotify-clone.git
   cd realtime-spotify-clone
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables** (see [Environment Variables](#-environment-variables) section)

5. **Start the development servers**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

---

## 🔐 Environment Variables

### Backend Configuration

Create a `.env` file in the `backend` folder:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Admin Access
ADMIN_EMAIL=your_admin_email@example.com

# Media Storage
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Configuration

Create a `.env` file in the `frontend` folder:

```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 📁 Project Structure

```
realtime-spotify-clone/
├── backend/
│   ├── src/
│   │   ├── controller/
│   │   │   ├── admin.controller.js      # Admin CRUD operations
│   │   │   ├── album.controller.js      # Album management
│   │   │   ├── auth.controller.js       # Authentication logic
│   │   │   ├── friend.controller.js     # Friend system (Observer Pattern trigger)
│   │   │   ├── song.controller.js       # Song operations & play count
│   │   │   ├── stat.controller.js       # Analytics & statistics
│   │   │   └── user.controller.js       # User management & messaging
│   │   ├── lib/
│   │   │   ├── observers/               # Observer Pattern Implementation
│   │   │   │   ├── UserActivitySubject.js  # Subject (Observable)
│   │   │   │   └── SocketObserver.js       # Concrete Observer
│   │   │   ├── ai.js                    # Google Gemini AI integration
│   │   │   ├── cloudinary.js            # Media upload service
│   │   │   ├── db.js                    # MongoDB connection
│   │   │   └── socket.js                # Socket.IO configuration
│   │   ├── middleware/
│   │   │   └── auth.middleware.js       # Clerk authentication
│   │   ├── models/
│   │   │   ├── album.model.js           # Album schema
│   │   │   ├── message.model.js         # Chat message schema
│   │   │   ├── song.model.js            # Song schema (with playCount)
│   │   │   └── user.model.js            # User schema (friends, requests)
│   │   ├── routes/
│   │   │   ├── admin.route.js
│   │   │   ├── album.route.js
│   │   │   ├── auth.route.js
│   │   │   ├── friend.route.js
│   │   │   ├── song.route.js
│   │   │   ├── stat.route.js
│   │   │   └── user.route.js
│   │   ├── seeds/                       # Database seeding
│   │   └── index.js                     # Server entry point
│   ├── .env.sample
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── observers/
│   │   │   │   └── FriendActivityObserver.tsx  # Observer Pattern UI
│   │   │   ├── ui/                      # Shadcn UI components
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── FriendRequestAcceptedDialog.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx           # Main app layout
│   │   │   └── components/
│   │   │       ├── AudioPlayer.tsx
│   │   │       ├── FriendsActivity.tsx
│   │   │       ├── LeftSidebar.tsx
│   │   │       └── PlaybackControls.tsx
│   │   ├── pages/
│   │   │   ├── admin/                   # Admin dashboard
│   │   │   ├── album/                   # Album details page
│   │   │   ├── auth-callback/           # Authentication callback
│   │   │   ├── chat/                    # Chat interface
│   │   │   ├── friends/                 # Friends management
│   │   │   ├── home/                    # Home page
│   │   │   ├── made-for-you/            # Personalized recommendations
│   │   │   ├── not-found/               # 404 page
│   │   │   └── trending/                # Trending songs page
│   │   ├── stores/                      # Zustand state management
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useChatStore.ts          # Socket.IO integration
│   │   │   ├── useFriendStore.ts        # Friend system state
│   │   │   ├── useMusicStore.ts
│   │   │   └── usePlayerStore.ts        # Music player state
│   │   ├── lib/
│   │   │   ├── axios.ts                 # Axios configuration
│   │   │   └── utils.ts                 # Utility functions
│   │   ├── providers/
│   │   │   └── AuthProvider.tsx         # Clerk auth provider
│   │   ├── types/                       # TypeScript type definitions
│   │   ├── App.tsx                      # Main app component & routing
│   │   └── main.tsx                     # Entry point
│   ├── public/
│   │   ├── albums/                      # Album cover images
│   │   ├── cover-images/                # Additional covers
│   │   ├── songs/                       # Song files
│   │   └── screenshot-for-readme.png
│   ├── .env.sample
│   └── package.json
│
└── README.md
```

---

## 📡 API Documentation

### Authentication
All protected routes require authentication via Clerk JWT tokens.

### Key Endpoints

#### Songs
- `GET /api/songs` - Fetch all songs
- `GET /api/songs/featured` - Get featured songs
- `GET /api/songs/made-for-you` - Get personalized recommendations
- `GET /api/songs/trending` - Get trending songs (sorted by play count)
- `POST /api/songs/:id/play` - Increment play count

#### Albums
- `GET /api/albums` - Fetch all albums
- `GET /api/albums/:id` - Get album details with songs

#### Friends
- `POST /api/friends/request/:userId` - Send friend request
- `POST /api/friends/accept/:requestId` - Accept friend request
- `POST /api/friends/reject/:requestId` - Reject friend request
- `GET /api/friends` - Get user's friends list
- `GET /api/friends/requests` - Get pending friend requests

#### Admin (Protected)
- `POST /api/admin/songs` - Create new song
- `POST /api/admin/albums` - Create new album
- `DELETE /api/admin/songs/:id` - Delete song
- `DELETE /api/admin/albums/:id` - Delete album

#### Real-time Events (Socket.IO)
- `user_connected` - User comes online
- `user_disconnected` - User goes offline
- `activity_updated` - User changes current song
- `new_friend_request` - Friend request received
- `friend_request_accepted` - Friend request accepted
- `send_message` - Send chat message
- `receive_message` - Receive chat message

---

## 🎨 Features in Detail

### Friend System with Observer Pattern

The friend system demonstrates a real-world implementation of the Observer Pattern:

1. **Subject**: When a user's status changes (online/offline), the `UserActivitySubject` notifies all observers
2. **Observers**: Each connected friend receives real-time updates through their `SocketObserver`
3. **UI Updates**: Friend avatars automatically show green (online) or gray (offline) status indicators

**Benefits:**
- ✅ Automatic UI updates without manual refresh
- ✅ Scalable to thousands of concurrent users
- ✅ Decoupled architecture - easy to add new notification types
- ✅ Real-time synchronization across multiple tabs/devices

### AI-Powered Music Recommendations

Integrated Google Gemini AI chatbot provides intelligent music recommendations:
- Natural language processing for understanding user preferences
- Context-aware suggestions based on mood, genre, and listening history
- Real-time chat interface for interactive music discovery
- Personalized recommendations that adapt to user taste

**How it works:**
1. User asks the AI chatbot for music recommendations (e.g., "Suggest some upbeat pop songs")
2. Gemini AI analyzes the request and current music database
3. AI provides tailored recommendations with explanations
4. Users can refine requests through conversational follow-ups

### Play Count Tracking

Songs track play counts to generate trending lists:
- Automatic increment when a song is played
- Atomic database operations to prevent race conditions
- Trending page sorted by most played songs
- Future-ready for analytics and recommendations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Design inspiration from Spotify
- Observer Pattern implementation based on Gang of Four design patterns
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Clerk](https://clerk.com/)
- **Special Thanks**: Original tutorial and base implementation by [Buraak Dev](https://youtu.be/4sbklcQ0EXc) - This project extends the tutorial with additional features including Observer Pattern, Friend System, AI Chatbot, and Play Count tracking

---

## 👥 Contributors

This project was developed by a dedicated team of students:

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/enemkayy">
        <img src="https://github.com/enemkayy.png" width="100px;" alt="Nguyễn Minh Khôi"/><br />
        <sub><b>Nguyễn Minh Khôi (Leader)</b></sub>
      </a><br />
      <sub>ITCSIU22210</sub>
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt="Vương Quán Siêu"/><br />
      <sub><b>Vương Quán Siêu</b></sub><br />
      <sub>ITCSIU22270</sub>
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt="Đỗ Tuấn Huy"/><br />
      <sub><b>Đỗ Tuấn Huy</b></sub><br />
      <sub>ITITDK23004</sub>
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt="Đoàn Xuân Cao"/><br />
      <sub><b>Đoàn Xuân Cao</b></sub><br />
      <sub>ITCSIU23061</sub>
    </td>
  </tr>
</table>

---

## 📞 Contact & Support

- **Live Demo**: [https://realtime-spotify-clone-test.onrender.com/](https://realtime-spotify-clone-test.onrender.com/)
- **Project Repository**: [GitHub](https://github.com/enemkayy/realtime-spotify-clone)
- **Issues**: [Report Issues](https://github.com/enemkayy/realtime-spotify-clone/issues)

---

<p align="center">Made with ❤️ by My Team</p>
<p align="center">⭐ Star this repo if you find it helpful!</p>
