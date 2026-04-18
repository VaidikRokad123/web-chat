# ChatVerse — Real-Time Chat Application

A full-stack real-time chat platform with **voice/video calling**, **contact request system**, **media sharing**, and a **cyberpunk gaming HUD** aesthetic. Features WebRTC support, typing indicators, online presence, and production-grade security.

---

## ✨ Features

### 🔐 Security & Authentication
- **Google OAuth 2.0** — Secure authentication via Google Sign-In (Passport.js)
- **JWT Tokens** — 24-hour expiry with Bearer authentication
- **Token Blacklisting** — In-memory/Redis-backed logout system
- **Password Hashing** — bcrypt with 10 salt rounds for local auth
- **Rate Limiting** — Express rate limiter (5 auth attempts/15min, 100 API calls/min, 60 messages/min)
- **Helmet Security** — Enhanced CSP, HSTS, XSS protection
- **CORS Protection** — Configured for frontend origin
- **Socket Authentication** — Socket.IO middleware verifies JWT tokens

### 💬 Real-Time Messaging
- **Instant Messaging** — Socket.IO bidirectional communication
- **Message Persistence** — Messages stored in MongoDB
- **Message Types** — Text, images, files, system logs
- **Typing Indicators** — Real-time "user is typing..." with auto-stop
- **Online/Offline Presence** — Live user status tracking with last seen timestamps
- **Read Receipts** — WhatsApp-style delivery status (✓ sent, ✓✓ delivered, ✓✓ seen)
- **Message History** — Full chat history with scroll loading
- **Unread Counts** — Per-group unread badges with real-time updates
- **Browser Notifications** — Desktop notifications for background messages

### 📸 Media & File Sharing
- **Cloudinary Integration** — Secure file uploads to cloud storage
- **Image Upload** — Image sharing with preview in chat
- **File Attachments** — Support for documents, videos, audio files
- **Avatar Upload** — Profile pictures with Cloudinary storage
- **Media Preview** — Click to view full-size images
- **File Download** — Direct download links for shared files

### 👥 Contact Request System
- **Privacy-First Contacts** — Users must accept contact requests before DM creation
- **Request Management** — Send, accept, reject contact requests
- **Contact List** — Separate contacts view with online status
- **Request Notifications** — Real-time contact request alerts with badge count
- **User Directory** — Browse and search all users
- **Spam Prevention** — Rate-limited contact requests

### 🎥 Voice & Video Calling (WebRTC)
- **Peer-to-Peer Calling** — Direct WebRTC connections for voice/video
- **Call Buttons** — Phone and video icons in DM chat headers
- **Incoming Call UI** — Accept/reject incoming calls
- **Call Controls** — End call, connection status display
- **Signaling Server** — Socket.IO-based WebRTC signaling
- **ICE Candidate Exchange** — STUN server configuration for NAT traversal
- **Call Duration Timer** — Real-time call duration display

### 🔔 Real-Time Events & Presence
- **Typing Indicators** — `typing-start` / `typing-stop` events
- **Online Status** — `user-online` / `user-offline` broadcasts
- **Message Delivery** — `receive-message` with delivery status
- **Group Updates** — `group-added` / `group-removed` events
- **Read Receipts** — `messages-seen` event for delivery ticks
- **Call Signaling** — `call-user`, `call-accepted`, `call-rejected`, `ice-candidate`, `end-call`

### 👥 Group Management
- **Create Group** — Name + member emails; creator becomes admin
- **Delete Group** — Admin-only; removes group document
- **Add/Remove Members** — Admin-only with system message logs
- **Admin Management** — Promote/demote admins (cannot remove last admin)
- **Direct Chat Protection** — DMs cannot be modified like groups
- **System Messages** — Audit trail for all group actions
- **Member List** — View all group members with online status

### 🎨 Frontend UI
- **Gaming HUD Theme** — Dark neon aesthetic with cyan/magenta accents
- **Binary Rain Background** — Full-screen canvas with falling `0` and `1` digits
- **Semi-Transparent Panels** — All UI elements with backdrop blur
- **Custom Animated Cursor** — 4-corner bracket ring with pulse effects
- **Discord-Style Sidebar** — Expandable icon strip with smooth animations
- **Circular Avatars** — Color-coded with initials or uploaded images
- **Unread Badges** — Green dot indicators on sidebar
- **Responsive Design** — Mobile-optimized with touch-friendly targets
- **Theme Toggle** — Dark/light mode support

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express 5** | REST API server |
| **Socket.IO 4** | Real-time bidirectional messaging |
| **MongoDB** + **Mongoose 9** | Database & ODM |
| **Passport.js** | OAuth 2.0 authentication |
| **passport-google-oauth20** | Google Sign-In strategy |
| **Cloudinary** | Cloud-based file storage & CDN |
| **Multer** | File upload middleware |
| **express-rate-limit** | DDoS protection & rate limiting |
| **express-session** | Session management |
| **bcrypt** | Password hashing (10 rounds) |
| **jsonwebtoken** | Authentication (24h tokens) |
| **express-validator** | Input validation |
| **Helmet** | Security headers (CSP, HSTS, XSS) |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Socket.IO Client 4** | Real-time communication |
| **WebRTC API** | Peer-to-peer voice/video calling |
| **Canvas API** | Binary rain background animation |

---

## 🎯 What's Working

### ✅ Fully Implemented Features
- Real-time messaging with Socket.IO
- Voice & video calling (WebRTC)
- Contact request system
- Typing indicators
- Online/offline presence
- Read receipts (WhatsApp-style ticks)
- Media sharing (Cloudinary)
- Group management
- Google OAuth authentication
- Rate limiting & security headers
- Browser notifications
- Profile management

### 🔄 Optional Enhancements (Not Implemented)
- End-to-end encryption (E2EE)
- Zero-knowledge architecture
- Recovery phrase system
- Redis caching (uses in-memory fallback)

---

## 🔒 Security Features

### Current Implementation

- **Helmet Security Headers** — CSP, HSTS, XSS protection, referrer policy
- **Rate Limiting** — Multi-tier protection against abuse
- **JWT Authentication** — Secure token-based auth with 24h expiry
- **Password Hashing** — bcrypt with 10 salt rounds
- **CORS Protection** — Configured for specific frontend origin
- **Input Validation** — express-validator for all user inputs
- **Socket Authentication** — JWT verification on WebSocket connections

### Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| Auth (login/register) | 5 requests | 15 minutes |
| API calls | 100 requests | 1 minute |
| Messages | 60 messages | 1 minute |

---

## 📁 Project Structure

```
chat-ai/
├── backend/
│   ├── server.js                          # HTTP server + Socket.IO init
│   ├── app.js                             # Express app (CORS, routes, rate limiting, Helmet)
│   ├── .env                               # Environment variables (not in git)
│   ├── .env.example                       # Environment variables template
│   └── src/
│       ├── config/
│       │   ├── passport.js                # Google OAuth 2.0 configuration
│       │   └── cloudinary.js              # Cloudinary configuration
│       ├── controllers/
│       │   ├── user.controller.js         # Auth, profile, contacts, OAuth callback
│       │   └── group.controller.js        # CRUD groups, add/remove members/admins, DMs, file upload
│       ├── db/
│       │   └── db.js                      # MongoDB connection
│       ├── middleware/
│       │   ├── auth.middleware.js         # JWT verification
│       │   ├── rateLimiter.js             # Rate limiting configurations
│       │   └── upload.js                  # Multer file upload middleware
│       ├── models/
│       │   ├── user.model.js              # User schema (contacts, requests, publicKey)
│       │   ├── group.model.js             # Group schema (name, admins, members, isDirectChat)
│       │   └── message.model.js           # Chat schema (messages, media support)
│       ├── routes/
│       │   ├── user.routes.js             # /user endpoints (auth, contacts, OAuth)
│       │   └── group.routes.js            # /group endpoints (CRUD, file upload)
│       ├── services/
│       │   ├── user.services.js           # User creation with password hashing
│       │   ├── group.services.js          # Group CRUD, RBAC, last-message sorting
│       │   └── redis.services.js          # Redis client connection (optional)
│       └── socket.js                      # Socket.IO (auth, rooms, typing, presence, WebRTC signaling)
│
└── frontend/
    ├── .env.local                         # Local environment variables (not in git)
    ├── .env.example                       # Environment variables template
    ├── .env.production                    # Production environment variables
    └── src/
        ├── App.jsx                        # Root: BinaryRain + CustomCursor + Routes
        ├── index.css                      # CSS variables (all semi-transparent)
        ├── main.jsx                       # React DOM entry
        ├── components/
        │   ├── BinaryRain.jsx             # Canvas animation (falling 0s and 1s)
        │   ├── CustomCursor.jsx           # Animated corner-bracket cursor
        │   ├── CreateGroupModal.jsx       # Group creation with inline user list
        │   ├── StartChatModal.jsx         # DM creation with inline user search
        │   ├── GroupManageModal.jsx       # Add/remove members/admins, delete group
        │   ├── ProfileModal.jsx           # User profile editor
        │   ├── UserProfileViewer.jsx      # View other user profiles
        │   ├── ContactRequestModal.jsx    # Contact request management (NEW)
        │   ├── CallModal.jsx              # Voice/video call UI (NEW)
        │   └── ProtectedRoute.jsx         # Auth guard for routes
        ├── context/
        │   ├── AuthContext.jsx            # JWT token state, login/logout/register
        │   ├── SocketContext.jsx          # Socket.IO connection provider
        │   └── ThemeContext.jsx           # Dark/light theme toggle
        ├── pages/
        │   ├── Chat.jsx                   # Main chat page with calling features
        │   ├── Login.jsx                  # Google OAuth login
        │   ├── Register.jsx               # Google OAuth registration
        │   ├── AuthCallback.jsx           # OAuth redirect handler
        │   └── Auth.css                   # Auth page styles
        ├── services/
        │   └── api.js                     # Fetch helpers for all API calls
        └── utils/
            ├── crypto.js                  # E2EE utilities (optional - not implemented)
            └── encryption.js              # Encryption helpers (optional - not implemented)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (local or [Redis Cloud](https://redis.com/try-free/))
- **Google OAuth Credentials** ([Google Cloud Console](https://console.cloud.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/VaidikRokad123/web-chat.git
cd web-chat
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=6969
MONGODB_URI=mongodb://localhost:27017/chatverse
JWT_SECRET=your_super_secret_jwt_key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=
FRONTEND_URL=http://localhost:5173

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:6969/user/auth/google/callback
SESSION_SECRET=your_session_secret_here
```

**Get Google OAuth Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Application type: Web application
7. Add authorized redirect URIs: `http://localhost:6969/user/auth/google/callback`
8. Copy the Client ID and Client Secret to your `.env` file

Start the backend:

```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:6969
```

Start the frontend:

```bash
npm run dev
```

### 4. Open in Browser

Navigate to **http://localhost:5173** — sign in with Google and start chatting securely!

---

## 🌐 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Set **Framework Preset** to `Vite`
5. Add environment variable: `VITE_API_URL` = your Railway backend URL

### Backend → Railway

1. Create a new service in [Railway](https://railway.app)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random string
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS` — your Redis instance
   - `FRONTEND_URL` — your Vercel frontend URL (for CORS)
5. Deploy!

> **Note:** Railway supports WebSocket connections natively, which is required for Socket.IO.

---

## 📡 API Reference

### User Routes (`/user`)

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `GET` | `/user/auth/google` | ❌ | — | Initiate Google OAuth flow |
| `GET` | `/user/auth/google/callback` | ❌ | — | Google OAuth callback (redirects to frontend) |
| `GET` | `/user/profile` | ✅ | — | Get current user profile |
| `PUT` | `/user/profile` | ✅ | `{ username, avatar, bio, status }` | Update user profile |
| `POST` | `/user/logout` | ✅ | — | Blacklist current token in Redis |
| `GET` | `/user/all` | ✅ | — | List all registered users |
| `POST` | `/user/contact/request` | ✅ | `{ targetEmail }` | Send contact request |
| `POST` | `/user/contact/accept` | ✅ | `{ requestId }` | Accept contact request |
| `POST` | `/user/contact/reject` | ✅ | `{ requestId }` | Reject contact request |
| `GET` | `/user/contact/requests` | ✅ | — | Get pending contact requests |
| `GET` | `/user/contacts` | ✅ | — | Get accepted contacts list |

### Group Routes (`/group`)

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `POST` | `/group/create` | ✅ | `{ groupName, members: [emails] }` | Create group (creator = admin) |
| `GET` | `/group/all` | ✅ | — | Get all groups user belongs to |
| `POST` | `/group/add-user` | ✅ | `{ groupName, targetEmail: [emails] }` | Add members (admin only) |
| `POST` | `/group/remove-user` | ✅ | `{ groupName, targetEmail }` | Remove member (admin only) |
| `POST` | `/group/add-admin` | ✅ | `{ groupName, targetEmail }` | Promote to admin (admin only) |
| `POST` | `/group/remove-admin` | ✅ | `{ groupName, targetEmail }` | Demote admin (admin only) |
| `POST` | `/group/delete` | ✅ | `{ groupName }` | Delete group (admin only) |
| `POST` | `/group/direct` | ✅ | `{ targetEmail }` | Create/get 1-on-1 DM |
| `POST` | `/group/upload` | ✅ | `FormData: file` | Upload file to Cloudinary |
| `GET` | `/group/search` | ✅ | `?groupId=&q=` | Search messages in group |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-group` | `groupId` | User opened this chat; marks messages as read |
| `load-messages` | `groupId` | Request full message history for a group |
| `send-message` | `{ groupId, text, mediaUrl?, mediaType?, fileName?, fileSize? }` | Send message (validates membership) |
| `typing-start` | `{ groupId }` | User started typing in this group |
| `typing-stop` | `{ groupId }` | User stopped typing in this group |
| `call-user` | `{ targetUserId, offer, callType }` | Initiate WebRTC call |
| `call-accepted` | `{ targetUserId, answer }` | Accept incoming call |
| `call-rejected` | `{ targetUserId }` | Reject incoming call |
| `ice-candidate` | `{ targetUserId, candidate }` | Exchange ICE candidates |
| `end-call` | `{ targetUserId }` | End active call |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `receive-message` | `{ _id, sender, message, time, type, groupId, deliveryStatus, mediaUrl?, mediaType?, fileName?, fileSize? }` | New message broadcast |
| `message-history` | `[messages]` | Full message history response |
| `unread-counts` | `{ [groupId]: count }` | Per-group unread counts (sent on connect) |
| `group-added` | `{ group object }` | User was added to a new group |
| `group-removed` | `{ groupId }` | User was removed from a group |
| `removed-from-group` | `{ groupId }` | Attempted to send to a group user was removed from |
| `messages-seen` | `{ groupId, seenBy }` | Messages marked as seen (updates delivery ticks) |
| `user-typing` | `{ groupId, userId, email, username }` | Another user is typing |
| `user-stopped-typing` | `{ groupId, userId }` | User stopped typing |
| `online-users` | `[userIds]` | List of currently online users (sent on connect) |
| `user-online` | `{ userId, email }` | User came online |
| `user-offline` | `{ userId, lastSeen }` | User went offline |
| `incoming-call` | `{ from, fromEmail, fromUsername, fromAvatar, offer, callType }` | Incoming WebRTC call |
| `call-accepted` | `{ from, answer }` | Call was accepted |
| `call-rejected` | `{ from }` | Call was rejected |
| `ice-candidate` | `{ from, candidate }` | ICE candidate from peer |
| `call-ended` | `{ from }` | Call was ended |

---

## 🗄️ Database Models

### User
```javascript
{
  email:           String,      // unique, lowercase, validated regex
  password:        String,      // bcrypt hashed, select: false (optional for OAuth)
  username:        String,      // display name
  avatar:          String,      // base64 or URL
  bio:             String,      // max 200 chars
  status:          String,      // max 50 chars (e.g., "Hey there!")
  lastSeen:        Date,        // last activity timestamp
  googleId:        String,      // unique, sparse (for OAuth)
  authProvider:    String,      // 'google' | 'local'
  contacts:        [ObjectId],  // ref: User (accepted contacts)
  contactRequests: [{
    from:   ObjectId,           // ref: User
    status: String,             // 'pending' | 'accepted' | 'rejected'
    createdAt: Date
  }],
  publicKey:       String,      // for future X25519 key exchange
  createdAt:       Date,
  updatedAt:       Date
}
```

### Group
```javascript
{
  name:         String,      // unique, lowercase, trimmed
  admin:        [ObjectId],  // ref: User (multiple admins supported)
  members:      [ObjectId],  // ref: User
  isDirectChat: Boolean,     // true for 1-on-1 DMs
  createdAt:    Date,
  updatedAt:    Date
}
```

### Chat (Messages)
```javascript
{
  group:    ObjectId,   // ref: Group (unique, indexed)
  messages: [{
    sender:         ObjectId,  // ref: User (null for system)
    message:        String,    // message text
    time:           Date,
    type:           String,    // 'message' | 'system' | 'image' | 'file'
    readBy:         [ObjectId], // tracks which users have read this message
    deliveredTo:    [ObjectId], // tracks delivery status
    deliveryStatus: String,    // 'sent' | 'delivered' | 'seen'
    mediaUrl:       String,    // Cloudinary URL for images/files
    mediaType:      String,    // MIME type
    fileName:       String,    // original filename
    fileSize:       Number     // bytes
  }]
}
```

---

## 🎯 Feature Comparison

| Feature | ChatVerse | Basic Chat App |
|---|---|---|
| **Voice/Video Calling** | ✅ WebRTC | ❌ None |
| **Contact Request System** | ✅ Privacy-first | ❌ Direct DM |
| **Typing Indicators** | ✅ Real-time | ❌ None |
| **Online/Offline Presence** | ✅ Live status | ❌ None |
| **Media Sharing** | ✅ Cloudinary | ❌ Text only |
| **Read Receipts** | ✅ WhatsApp-style | ❌ None |
| **Rate Limiting** | ✅ Multi-tier | ❌ None |
| **OAuth 2.0** | ✅ Google Sign-In | ❌ Email only |
| **Browser Notifications** | ✅ Desktop alerts | ❌ None |
| **Group Management** | ✅ Full RBAC | ❌ Basic |
| **Security Headers** | ✅ Helmet + CSP | ❌ None |

---

## 📄 License

ISC

---

**Built with ❤️, neon glow, and military-grade encryption**
