# ChatVerse — Real-Time Chat Application

A full-stack real-time chat platform with a **cyberpunk gaming HUD** aesthetic. Features falling binary rain backgrounds, neon glow effects, and a custom animated cursor — all behind semi-transparent glass panels.

---

## ✨ Features

### 🔐 Authentication & Security
- **User Registration** — Email + password with server-side validation (`express-validator`)
- **User Login** — Email/password authentication with bcrypt password comparison
- **Password Hashing** — bcrypt with 10 salt rounds, password field excluded from queries by default (`select: false`)
- **JWT Tokens** — 24-hour expiry, sent via both cookies and Bearer headers
- **Token Blacklisting** — Redis-backed logout; blacklisted tokens expire after 24 hours
- **Socket Authentication** — Socket.IO middleware verifies JWT + checks Redis blacklist before allowing connections
- **CORS** — Configured with credentials support, origin restricted to frontend URL

### 💬 Real-Time Messaging
- **Instant Messaging** — Socket.IO bidirectional communication
- **Message Persistence** — All messages stored in MongoDB (`Chat` collection linked to groups)
- **Message Types** — `message` (user) and `system` (automated logs like "user was added")
- **Message History** — Full chat history loaded via `load-messages` event with sender email populated
- **Read Tracking** — Each message has a `readBy` array; messages marked as read when user opens the group
- **Unread Counts** — Computed per-group on connect and emitted to the client; excludes own messages and already-read messages
- **Auto Room Joining** — On connect, user automatically joins ALL their group rooms + a personal room (userId) for targeted events
- **Membership Validation** — Before sending a message, server checks if user is still a member/admin of the group; if removed, emits `removed-from-group`

### 👥 Group Management
- **Create Group** — Name + member emails; creator becomes admin; duplicate names prevented (unique constraint)
- **Delete Group** — Admin-only; removes group document from database
- **Add Members** — Admin-only; bulk add by email array; duplicate membership check; system message logged
- **Remove Members** — Admin-only; also auto-demotes if the removed user was an admin; system message logged
- **Add Admin** — Admin-only; target must already be a member; system message logged
- **Remove Admin** — Admin-only; cannot remove the last admin (safety check); system message logged
- **System Messages** — Every group action (add/remove member, promote/demote admin) creates an audit trail in the chat
- **Direct Chat Protection** — All group management endpoints (add/remove member, add/remove admin, delete) reject requests for `isDirectChat: true` groups
- **Last Message Preview** — Groups sorted by most recent activity; each group includes last message text, time, and type
- **Admin Email Resolution** — Group data populated with admin and member emails for display

### 📩 Direct Messaging
- **Create DM** — 1-on-1 private chat between two users
- **Deterministic Naming** — DM name = sorted emails joined by `-` (e.g., `alice@x.com-bob@x.com`), ensuring uniqueness
- **Duplicate Prevention** — If DM already exists, returns the existing group instead of creating a new one
- **Self-Chat Prevention** — Server rejects attempts to create a DM with yourself
- **Protected DMs** — Cannot add/remove members or admins from direct chats

### 🔔 Real-Time Events
- **`receive-message`** — Broadcast to all group members when a message is sent (includes `groupId` for sidebar updates)
- **`group-added`** — Emitted to a user's personal room when they are added to a group; includes full populated group data
- **`group-removed`** — Emitted to a user's personal room when they are removed from a group
- **`removed-from-group`** — Emitted to sender when they try to send to a group they've been removed from
- **`unread-counts`** — Emitted on connect with per-group unread message counts
- **Dynamic Room Join** — When a user is added to a group, their active socket(s) are fetched and joined to the new room immediately

### 🎨 Frontend UI
- **Gaming HUD Theme** — Dark neon aesthetic with cyan/magenta accents
- **Binary Rain Background** — Full-screen canvas with falling `0` and `1` digits (visible on all pages)
- **Semi-Transparent Panels** — All UI elements at ~50% opacity with backdrop blur
- **Custom Animated Cursor** — 4-corner bracket ring that rotates continuously, pulses magenta on click, speeds up green on hover
- **Discord-Style Sidebar** — 64px icon strip expandable to 220px with smooth spring animation
- **Circular Avatars** — Color-coded with initials, morph to rounded-square when active
- **Unread Badges** — Green dot indicators on sidebar avatars
- **Inline User Lists** — User selection in modals uses scrollable inline lists instead of dropdowns
- **Typography** — Rajdhani (headings) + Share Tech Mono (timestamps, labels, monospace)
- **Responsive Design** — Adapts to mobile with smaller sidebar and touch-friendly targets

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express 5** | REST API server |
| **Socket.IO 4** | Real-time bidirectional messaging |
| **MongoDB** + **Mongoose 9** | Database & ODM |
| **Redis 5** | JWT token blacklisting |
| **bcrypt** | Password hashing (10 rounds) |
| **jsonwebtoken** | Authentication (24h tokens) |
| **express-validator** | Input validation |
| **morgan** | HTTP request logging |
| **cookie-parser** | Cookie-based auth support |
| **cors** | Cross-origin configuration |
| **dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Socket.IO Client 4** | Real-time communication |
| **Vanilla CSS** | Custom gaming HUD styling |
| **Canvas API** | Binary rain background animation |

---

## 📁 Project Structure

```
chat-ai/
├── backend/
│   ├── server.js                          # HTTP server + Socket.IO init
│   ├── app.js                             # Express app (CORS, routes, middleware)
│   ├── .env                               # Environment variables
│   └── src/
│       ├── controllers/
│       │   ├── user.controller.js         # Register, login, logout, profile, list users
│       │   └── group.controller.js        # CRUD groups, add/remove members/admins, DMs
│       ├── db/
│       │   └── db.js                      # MongoDB connection
│       ├── middleware/
│       │   └── auth.middleware.js          # JWT verification + Redis blacklist check
│       ├── models/
│       │   ├── user.model.js              # User schema (email, password, JWT methods)
│       │   ├── group.model.js             # Group schema (name, admins, members, isDirectChat)
│       │   └── message.model.js           # Chat schema (messages array with readBy tracking)
│       ├── routes/
│       │   ├── user.routes.js             # /user endpoints
│       │   └── group.routes.js            # /group endpoints
│       ├── services/
│       │   ├── user.services.js           # User creation with password hashing
│       │   ├── group.services.js          # Group CRUD, RBAC, last-message sorting
│       │   └── redis.services.js          # Redis client connection
│       └── socket.js                      # Socket.IO auth, rooms, messaging, unread tracking
│
└── frontend/
    └── src/
        ├── App.jsx                        # Root: BinaryRain + CustomCursor + Routes
        ├── index.css                      # CSS variables (all semi-transparent)
        ├── main.jsx                       # React DOM entry
        ├── components/
        │   ├── BinaryRain.jsx             # Canvas animation (falling 0s and 1s)
        │   ├── CustomCursor.jsx           # Animated corner-bracket cursor
        │   ├── CustomCursor.css
        │   ├── CreateGroupModal.jsx       # Group creation with inline user list
        │   ├── CreateGroupModal.css
        │   ├── StartChatModal.jsx         # DM creation with inline user search
        │   ├── GroupManageModal.jsx        # Add/remove members/admins, delete group
        │   ├── GroupManageModal.css
        │   └── ProtectedRoute.jsx         # Auth guard for routes
        ├── context/
        │   ├── AuthContext.jsx            # JWT token state, login/logout/register
        │   └── SocketContext.jsx          # Socket.IO connection provider
        ├── pages/
        │   ├── Chat.jsx                   # Main chat page with icon sidebar
        │   ├── Chat.css
        │   ├── Login.jsx                  # Login form
        │   ├── Register.jsx               # Registration form
        │   └── Auth.css                   # Auth page styles (transparent card)
        └── services/
            └── api.js                     # Axios-like fetch helpers for all API calls
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (local or [Redis Cloud](https://redis.com/try-free/))

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
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatverse
JWT_SECRET=your_super_secret_jwt_key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=
FRONTEND_URL=http://localhost:5173
```

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

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4. Open in Browser

Navigate to **http://localhost:5173** — register an account and start chatting!

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
| `POST` | `/user/register` | ❌ | `{ email, password }` | Register new user (min 6 char password) |
| `POST` | `/user/login` | ❌ | `{ email, password }` | Login and receive JWT token |
| `GET` | `/user/profile` | ✅ | — | Get current user profile |
| `POST` | `/user/logout` | ✅ | — | Blacklist current token in Redis |
| `GET` | `/user/all` | ✅ | — | List all registered user emails |

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

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-group` | `groupId` | User opened this chat; marks messages as read |
| `load-messages` | `groupId` | Request full message history for a group |
| `send-message` | `{ groupId, text }` | Send a message (validates membership) |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `receive-message` | `{ _id, sender, message, time, type, groupId }` | New message broadcast to all group members |
| `message-history` | `[messages]` | Full message history response |
| `unread-counts` | `{ [groupId]: count }` | Per-group unread counts (sent on connect) |
| `group-added` | `{ group object }` | User was added to a new group |
| `group-removed` | `{ groupId }` | User was removed from a group |
| `removed-from-group` | `{ groupId }` | Attempted to send to a group user was removed from |

---

## 🗄️ Database Models

### User
```javascript
{
  email:     String,    // unique, lowercase, validated regex
  password:  String,    // bcrypt hashed, select: false
  createdAt: Date,
  updatedAt: Date
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
    sender:  ObjectId,  // ref: User (null for system)
    message: String,
    time:    Date,
    type:    'message' | 'system',
    readBy:  [ObjectId] // tracks which users have read this message
  }]
}
```

---

## 📄 License

ISC

---

**Built with ❤️ and neon glow**
