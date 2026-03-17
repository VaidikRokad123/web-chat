import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import CreateGroupModal from '../components/CreateGroupModal';
import './Chat.css';

// Placeholder conversations for demo
const PLACEHOLDER_CONTACTS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', lastMsg: 'Hey! How are you doing?', time: '2:34 PM', unread: 2, online: true },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', lastMsg: 'That sounds great 🎉', time: '1:12 PM', unread: 0, online: true },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', lastMsg: 'See you tomorrow!', time: '12:45 PM', unread: 0, online: false },
  { id: 4, name: 'David Brown', email: 'david@example.com', lastMsg: 'Thanks for sharing', time: 'Yesterday', unread: 0, online: false },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', lastMsg: 'Let me check and get back to you', time: 'Yesterday', unread: 1, online: true },
  { id: 6, name: 'Frank Lee', email: 'frank@example.com', lastMsg: 'Good morning!', time: 'Monday', unread: 0, online: false },
];

const PLACEHOLDER_MESSAGES = [
  { id: 1, text: 'Hey! How are you doing?', sent: false, time: '2:30 PM' },
  { id: 2, text: 'I\'m great! Just finished working on the new project.', sent: true, time: '2:31 PM' },
  { id: 3, text: 'That\'s awesome! What kind of project?', sent: false, time: '2:32 PM' },
  { id: 4, text: 'A real-time chat application with some cool animations ✨', sent: true, time: '2:33 PM' },
  { id: 5, text: 'Hey! How are you doing?', sent: false, time: '2:34 PM' },
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#00cec9', '#a29bfe'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Chat() {
  const { user, logout } = useAuth();
  const [activeChat, setActiveChat] = useState(PLACEHOLDER_CONTACTS[0]);
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupToast, setGroupToast] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: newMessage.trim(),
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMessage('');
  }

  function handleGroupCreated(group) {
    setGroupToast(`Group "${group.name}" created!`);
    setTimeout(() => setGroupToast(''), 3000);
  }

  const filteredContacts = PLACEHOLDER_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userEmail = user?.email || 'user@email.com';
  const userInitial = userEmail[0].toUpperCase();

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: 'var(--accent-gradient)' }}>
              {userInitial}
            </div>
            <div className="user-info">
              <span className="user-name">ChatVerse</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button
              className="icon-btn"
              onClick={() => setShowGroupModal(true)}
              title="New Group"
              id="new-group-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>
            <ThemeToggle />
            <button className="icon-btn" onClick={logout} title="Logout" id="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-conversations"
          />
        </div>

        <div className="conversation-list">
          {filteredContacts.map(contact => (
            <button
              key={contact.id}
              className={`conversation-item ${activeChat?.id === contact.id ? 'active' : ''}`}
              onClick={() => { setActiveChat(contact); setSidebarOpen(false); }}
            >
              <div className="contact-avatar" style={{ background: getAvatarColor(contact.name) }}>
                {getInitials(contact.name)}
                {contact.online && <span className="online-dot" />}
              </div>
              <div className="contact-info">
                <div className="contact-top">
                  <span className="contact-name">{contact.name}</span>
                  <span className="contact-time">{contact.time}</span>
                </div>
                <div className="contact-bottom">
                  <span className="contact-last-msg">{contact.lastMsg}</span>
                  {contact.unread > 0 && (
                    <span className="unread-badge">{contact.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <main className="chat-main">
        {/* Chat header */}
        <div className="chat-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {activeChat && (
            <div className="chat-header-info">
              <div className="contact-avatar small" style={{ background: getAvatarColor(activeChat.name) }}>
                {getInitials(activeChat.name)}
                {activeChat.online && <span className="online-dot" />}
              </div>
              <div>
                <span className="chat-header-name">{activeChat.name}</span>
                <span className="chat-header-status">{activeChat.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="messages-area">
          <div className="messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sent ? 'sent' : 'received'}`}>
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <span className="message-time">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <form className="message-input-bar" onSubmit={handleSend}>
          <button type="button" className="icon-btn attach-btn" title="Attach file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            id="message-input"
          />
          <button
            type="submit"
            className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
            disabled={!newMessage.trim()}
            id="send-message-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </main>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {/* Success toast */}
      {groupToast && (
        <div className="toast show" style={{ background: 'var(--success)' }}>
          {groupToast}
        </div>
      )}
    </div>
  );
}
