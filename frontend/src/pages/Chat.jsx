import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupManageModal from '../components/GroupManageModal';
import ParticleBackground from '../components/ParticleBackground';
import { fetchGroups } from '../services/api';
import './Chat.css';

const PLACEHOLDER_MESSAGES = [
  { id: 1, text: 'Welcome to the group! Start chatting.', sent: false, time: '' },
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

function formatGroupTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Chat() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupToast, setGroupToast] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [managedGroup, setManagedGroup] = useState(null);
  const messagesEndRef = useRef(null);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const data = await fetchGroups();
      setGroups(data.groups || []);
      if (data.groups?.length > 0 && !activeChat) {
        setActiveChat(data.groups[0]);
      }
    } catch (err) {
      setGroupsError('Failed to load groups.');
    } finally {
      setGroupsLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
    loadGroups(); // refresh list
  }

  function openManage(group) {
    setManagedGroup({
      _id: group._id,
      name: group.name,
      // admin/members can be populated objects {_id, email} or raw ObjectId strings
      adminEmails: (group.admin || []).map(a => (typeof a === 'object' ? a.email : a)).filter(Boolean),
      memberEmails: (group.members || []).map(m => (typeof m === 'object' ? m.email : m)).filter(Boolean),
    });
    setShowManageModal(true);
  }

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userEmail = user?.email || 'user@email.com';
  const userInitial = userEmail[0].toUpperCase();

  return (
    <div className="chat-layout">
      <ParticleBackground />
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
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-conversations"
          />
        </div>

        <div className="conversation-list">
          {groupsLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div className="loading-spinner" style={{ width: 28, height: 28 }} />
            </div>
          )}
          {!groupsLoading && groupsError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 16px' }}>
              {groupsError}
            </p>
          )}
          {!groupsLoading && !groupsError && filteredGroups.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textAlign: 'center', padding: '32px 16px' }}>
              No groups yet. Create one!
            </p>
          )}
          {filteredGroups.map(group => (
            <button
              key={group._id}
              className={`conversation-item ${activeChat?._id === group._id ? 'active' : ''}`}
              onClick={() => { setActiveChat(group); setSidebarOpen(false); }}
            >
              <div className="contact-avatar" style={{ background: getAvatarColor(group.name) }}>
                {getInitials(group.name)}
              </div>
              <div className="contact-info">
                <div className="contact-top">
                  <span className="contact-name" style={{ textTransform: 'capitalize' }}>{group.name}</span>
                  <span className="contact-time">{formatGroupTime(group.createdAt)}</span>
                </div>
                <div className="contact-bottom">
                  <span className="contact-last-msg">
                    {group.members?.length ?? 0} member{group.members?.length !== 1 ? 's' : ''}
                  </span>
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
            <>
              <div className="chat-header-info">
                <div className="contact-avatar small" style={{ background: getAvatarColor(activeChat.name) }}>
                  {getInitials(activeChat.name)}
                </div>
                <div>
                  <span className="chat-header-name" style={{ textTransform: 'capitalize' }}>{activeChat.name}</span>
                  <span className="chat-header-status">{activeChat.members?.length ?? 0} members</span>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => openManage(activeChat)}
                title="Manage Group"
                id="manage-group-btn"
                style={{ marginLeft: 'auto' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="messages-area">
          <div className="messages-container">
            {!activeChat ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', gap: 12, paddingTop: 80 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ fontSize: '0.9rem' }}>Select a group to start chatting</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sent ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    {msg.time && <span className="message-time">{msg.time}</span>}
                  </div>
                </div>
              ))
            )}
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
            placeholder={activeChat ? `Message ${activeChat.name}...` : 'Select a group first...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!activeChat}
            id="message-input"
          />
          <button
            type="submit"
            className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
            disabled={!newMessage.trim() || !activeChat}
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

      {/* Group Manage Modal */}
      {showManageModal && managedGroup && (
        <GroupManageModal
          group={managedGroup}
          onClose={() => setShowManageModal(false)}
          onUpdated={(updatedGroup) => {
            if (updatedGroup) setManagedGroup(prev => ({ ...prev, ...updatedGroup }));
            loadGroups(); // refresh sidebar
          }}
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
