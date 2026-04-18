import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupManageModal from '../components/GroupManageModal';
import StartChatModal from '../components/StartChatModal';
import ProfileModal from '../components/ProfileModal';
import UserProfileViewer from '../components/UserProfileViewer';
import ContactRequestModal from '../components/ContactRequestModal';
import CallModal from '../components/CallModal';
import { fetchGroups, fetchProfile, uploadFile } from '../services/api';
import './Chat.css';

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = ['#00ffa9', '#00e5ff', '#ff00aa', '#ffe600', '#ff3860', '#7c4dff', '#00bcd4', '#ff6d00'];
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
  const socket = useSocket();
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [groupToast, setGroupToast] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [managedGroup, setManagedGroup] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [removedGroups, setRemovedGroups] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [callState, setCallState] = useState(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Keep a ref to activeChat so socket callbacks can read current value
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Load user profile on mount
  useEffect(() => {
    fetchProfile().then(data => setUserProfile(data.user)).catch(() => {});
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for removal from group
  useEffect(() => {
    if (!socket) return;
    function onRemovedFromGroup({ groupId }) {
      setRemovedGroups(prev => new Set([...prev, groupId]));
    }
    socket.on('removed-from-group', onRemovedFromGroup);
    return () => socket.off('removed-from-group', onRemovedFromGroup);
  }, [socket]);

  // ── Online/Offline presence ──
  useEffect(() => {
    if (!socket) return;
    function onOnlineUsers(ids) {
      setOnlineUsers(new Set(ids));
    }
    function onUserOnline({ userId }) {
      setOnlineUsers(prev => new Set([...prev, userId]));
    }
    function onUserOffline({ userId }) {
      setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
    socket.on('online-users', onOnlineUsers);
    socket.on('user-online', onUserOnline);
    socket.on('user-offline', onUserOffline);
    return () => {
      socket.off('online-users', onOnlineUsers);
      socket.off('user-online', onUserOnline);
      socket.off('user-offline', onUserOffline);
    };
  }, [socket]);

  // ── Messages-seen event (update delivery ticks) ──
  useEffect(() => {
    if (!socket) return;
    function onMessagesSeen({ groupId }) {
      if (activeChatRef.current?._id === groupId) {
        setMessages(prev => prev.map(m => ({ ...m, deliveryStatus: 'seen' })));
      }
    }
    socket.on('messages-seen', onMessagesSeen);
    return () => socket.off('messages-seen', onMessagesSeen);
  }, [socket]);

  // Helper: for DMs show the OTHER person's name/email, for groups show group name
  function getDisplayName(group) {
    if (!group.isDirectChat) return group.name;
    // Try to find the other member's username first, fall back to email from name
    const otherMember = (group.members || []).find(m => (typeof m === 'object' ? m.email : m) !== userEmail);
    if (otherMember && typeof otherMember === 'object' && otherMember.username) return otherMember.username;
    const emails = group.name.split('-');
    return emails.find(e => e !== userEmail) || group.name;
  }

  // Helper: get avatar URL for sidebar. For DMs, return other user's avatar.
  function getGroupAvatar(group) {
    if (!group.isDirectChat) return null;
    const otherMember = (group.members || []).find(m => (typeof m === 'object' ? m.email : m) !== userEmail);
    if (otherMember && typeof otherMember === 'object' && otherMember.avatar) return otherMember.avatar;
    return null;
  }

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

  // ── Socket: join room + load history when activeChat changes ──
  useEffect(() => {
    if (!socket || !activeChat) return;

    const groupId = activeChat._id;
    socket.emit('join-group', groupId);
    socket.emit('load-messages', groupId);

    // Clear unread for this group
    setUnreadCounts(prev => ({ ...prev, [groupId]: 0 }));

    function onMessageHistory(history) {
      setMessages(history);
    }

    socket.on('message-history', onMessageHistory);
    return () => socket.off('message-history', onMessageHistory);
  }, [socket, activeChat]);

  // ── Socket: global receive-message handler (real-time, all groups) ──
  useEffect(() => {
    if (!socket) return;

    function onReceiveMessage(msg) {
      const msgGroupId = msg.groupId;
      const activeId = activeChatRef.current?._id;

      // 1. Update the message list if msg is for the active chat
      if (!msgGroupId || msgGroupId === activeId) {
        setMessages(prev => [...prev, msg]);
      } else {
        // 2. Increment unread badge for other groups
        setUnreadCounts(prev => ({
          ...prev,
          [msgGroupId]: (prev[msgGroupId] || 0) + 1
        }));

        // 3. Browser notification for background messages
        if ('Notification' in window && Notification.permission === 'granted' && msg.sender?.email) {
          const n = new Notification(msg.sender.username || msg.sender.email, {
            body: msg.message,
            icon: msg.sender.avatar || undefined,
            tag: msgGroupId
          });
          n.onclick = () => { window.focus(); };
        }
      }

      // 3. Update sidebar lastMessage + re-sort in real-time (for ALL groups)
      if (msgGroupId) {
        setGroups(prev => {
          const updated = prev.map(g => {
            if (g._id === msgGroupId || g._id?.toString() === msgGroupId) {
              return {
                ...g,
                lastMessage: {
                  message: msg.message,
                  time: msg.time,
                  type: msg.type || 'message'
                }
              };
            }
            return g;
          });
          // Re-sort: most recent first
          return [...updated].sort((a, b) => {
            const tA = a.lastMessage?.time || a.createdAt;
            const tB = b.lastMessage?.time || b.createdAt;
            return new Date(tB) - new Date(tA);
          });
        });
      }
    }

    socket.on('receive-message', onReceiveMessage);
    return () => socket.off('receive-message', onReceiveMessage);
  }, [socket]); // intentionally only depends on socket — reads activeChat via ref

  // ── Socket: real-time group list updates ──
  useEffect(() => {
    if (!socket) return;

    function onGroupAdded(group) {
      // Prepend the new group to the sidebar list
      setGroups(prev => {
        const already = prev.find(g => g._id === group._id || g._id?.toString() === group._id?.toString());
        if (already) return prev;
        return [group, ...prev];
      });
      // Join the group's socket room so we receive its messages immediately
      socket.emit('join-group', group._id);
    }

    function onGroupRemoved({ groupId }) {
      // Remove group from sidebar
      setGroups(prev => prev.filter(g => g._id !== groupId && g._id?.toString() !== groupId));
      // Mark user as removed if they're currently viewing that group
      if (activeChatRef.current?._id === groupId || activeChatRef.current?._id?.toString() === groupId) {
        setRemovedGroups(prev => new Set([...prev, groupId]));
      }
    }

    socket.on('group-added', onGroupAdded);
    socket.on('group-removed', onGroupRemoved);
    return () => {
      socket.off('group-added', onGroupAdded);
      socket.off('group-removed', onGroupRemoved);
    };
  }, [socket]);

  // ── Socket: get initial unread counts on connect ──
  useEffect(() => {
    if (!socket) return;

    function onUnreadCounts(counts) {
      setUnreadCounts(counts);
    }

    socket.on('unread-counts', onUnreadCounts);
    return () => socket.off('unread-counts', onUnreadCounts);
  }, [socket]);

  // ── Typing indicators ──
  useEffect(() => {
    if (!socket) return;

    function onUserTyping({ groupId, username, email }) {
      setTypingUsers(prev => ({ ...prev, [groupId]: username || email }));
    }
    function onUserStoppedTyping({ groupId }) {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    }

    socket.on('user-typing', onUserTyping);
    socket.on('user-stopped-typing', onUserStoppedTyping);
    return () => {
      socket.off('user-typing', onUserTyping);
      socket.off('user-stopped-typing', onUserStoppedTyping);
    };
  }, [socket]);

  // ── Incoming call listener ──
  useEffect(() => {
    if (!socket) return;

    function onIncomingCall({ from, fromEmail, fromUsername, fromAvatar, offer, callType }) {
      setCallState({
        type: callType,
        direction: 'incoming',
        targetUserId: from,
        targetName: fromUsername || fromEmail,
        targetAvatar: fromAvatar,
        offer
      });
    }

    socket.on('incoming-call', onIncomingCall);
    return () => socket.off('incoming-call', onIncomingCall);
  }, [socket]);

  function emitTyping() {
    if (!socket || !activeChat) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing-start', { groupId: activeChat._id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing-stop', { groupId: activeChat._id });
    }, 2000);
  }

  function stopTyping() {
    if (!socket || !activeChat) return;
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing-stop', { groupId: activeChat._id });
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChat) return;
    stopTyping();
    socket.emit('send-message', {
      groupId: activeChat._id,
      text: newMessage.trim(),
    });
    setNewMessage('');
  }

  function handleGroupCreated(group) {
    setGroupToast(`Group "${group.name}" created!`);
    setTimeout(() => setGroupToast(''), 3000);
    loadGroups(); // refresh list
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !socket || !activeChat) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      socket.emit('send-message', {
        groupId: activeChat._id,
        text: '',
        mediaUrl: result.url,
        mediaType: result.mediaType,
        fileName: result.fileName,
        fileSize: result.fileSize,
      });
    } catch (err) {
      setGroupToast('Upload failed: ' + (err.message || 'Unknown error'));
      setTimeout(() => setGroupToast(''), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      {/* ── Icon Sidebar (expandable) ── */}
      <aside className={`icon-sidebar ${sidebarOpen ? 'expanded' : ''}`}>
        {/* Top actions */}
        <div className="icon-sidebar-top">
          <button
            className="sidebar-icon-btn expand-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={sidebarOpen ? '11 17 6 12 11 7' : '13 7 18 12 13 17'} />
              <line x1="6" y1="12" x2="18" y2="12" opacity="0.3" />
            </svg>
          </button>
          <button className="sidebar-icon-btn" onClick={() => setShowDMModal(true)} title="New Chat" id="new-chat-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="sidebar-icon-btn" onClick={() => setShowGroupModal(true)} title="New Group" id="new-group-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </button>
          <button className="sidebar-icon-btn" onClick={() => setShowContactsModal(true)} title="Contacts" id="contacts-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="icon-sidebar-sep" />

        {/* Group avatars */}
        <div className="icon-sidebar-groups">
          {groupsLoading && (
            <div className="loading-spinner" style={{ width: 20, height: 20, margin: '8px auto' }} />
          )}
          {filteredGroups.map(group => (
            <button
              key={group._id}
              className={`group-icon-btn ${activeChat?._id === group._id ? 'active' : ''}`}
              onClick={() => setActiveChat(group)}
              title={getDisplayName(group)}
            >
              <div className="group-icon-avatar" style={{ background: getGroupAvatar(group) ? 'transparent' : getAvatarColor(getDisplayName(group)), overflow: 'hidden' }}>
                {getGroupAvatar(group)
                  ? <img src={getGroupAvatar(group)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : getInitials(getDisplayName(group))
                }
              </div>
              {sidebarOpen && (
                <span className="group-icon-label" style={{ textTransform: 'capitalize' }}>
                  {getDisplayName(group)}
                </span>
              )}
              {unreadCounts[group._id] > 0 && (
                <span className="icon-unread-dot" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom — Profile + Logout */}
        <div className="icon-sidebar-bottom">
          <div className="icon-sidebar-sep" />
          <button className="sidebar-icon-btn" onClick={() => setShowProfileModal(true)} title="Edit Profile" id="profile-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button className="sidebar-icon-btn logout" onClick={logout} title="Logout" id="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <main className="chat-main">
        {/* Chat header */}
        <div className="chat-header">
          {activeChat && (
            <>
              <div className="chat-header-info" style={{ cursor: 'pointer' }} onClick={() => {
                if (activeChat.isDirectChat) {
                  // DM: show the other person's profile
                  const otherMember = (activeChat.members || []).find(m => (typeof m === 'object' ? m.email : m) !== userEmail);
                  if (otherMember && typeof otherMember === 'object') setViewingUser(otherMember);
                } else {
                  // Group: show members list
                  setShowMembersList(true);
                }
              }}>
                <div className="contact-avatar small" style={{ background: getGroupAvatar(activeChat) ? 'transparent' : getAvatarColor(getDisplayName(activeChat)), overflow: 'hidden' }}>
                  {getGroupAvatar(activeChat)
                    ? <img src={getGroupAvatar(activeChat)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : getInitials(getDisplayName(activeChat))
                  }
                </div>
                <div>
                  <span className="chat-header-name" style={{ textTransform: 'capitalize' }}>{getDisplayName(activeChat)}</span>
                  <span className="chat-header-status">
                    {typingUsers[activeChat._id]
                      ? <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{typingUsers[activeChat._id]} is typing…</span>
                      : activeChat.isDirectChat
                        ? (() => {
                            const otherMembers = (activeChat.members || []).filter(m => (typeof m === 'object' ? m.email : m) !== userEmail);
                            const otherId = otherMembers[0]?._id || otherMembers[0];
                            if (otherId && onlineUsers.has(otherId.toString())) return '● Online';
                            return 'Direct Message';
                          })()
                        : `${activeChat.members?.length ?? 0} members · Click to view`}
                  </span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {activeChat.isDirectChat && (
                  <>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        const otherMember = (activeChat.members || []).find(m => (typeof m === 'object' ? m.email : m) !== userEmail);
                        if (otherMember) {
                          setCallState({
                            type: 'voice',
                            direction: 'outgoing',
                            targetUserId: otherMember._id?.toString() || otherMember,
                            targetName: otherMember.username || otherMember.email,
                            targetAvatar: otherMember.avatar
                          });
                        }
                      }}
                      title="Voice Call"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        const otherMember = (activeChat.members || []).find(m => (typeof m === 'object' ? m.email : m) !== userEmail);
                        if (otherMember) {
                          setCallState({
                            type: 'video',
                            direction: 'outgoing',
                            targetUserId: otherMember._id?.toString() || otherMember,
                            targetName: otherMember.username || otherMember.email,
                            targetAvatar: otherMember.avatar
                          });
                        }
                      }}
                      title="Video Call"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </button>
                  </>
                )}
                {!activeChat.isDirectChat && (
                  <button
                    className="icon-btn"
                    onClick={() => openManage(activeChat)}
                    title="Manage Group"
                    id="manage-group-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                )}
              </div>
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
              messages.map((msg, idx) => {
                // System log messages (WhatsApp-style centered label)
                if (msg.type === 'system') {
                  return (
                    <div key={msg._id || idx} className="system-message">
                      {msg.message}
                    </div>
                  );
                }

                const isSent = msg.sender?._id === user?._id || msg.sender === user?._id;
                const timeStr = msg.time
                  ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={msg._id || idx} className={`message ${isSent ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                      {!isSent && !activeChat?.isDirectChat && (msg.sender?.username || msg.sender?.email) && (
                        <span className="message-sender">{msg.sender.username || msg.sender.email}</span>
                      )}
                      {msg.mediaUrl && msg.mediaType?.startsWith('image/') ? (
                        <img
                          src={msg.mediaUrl}
                          alt={msg.fileName || 'Image'}
                          style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 4, marginBottom: 4, cursor: 'pointer' }}
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
                        />
                      ) : msg.mediaUrl ? (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', padding: '6px 0' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {msg.fileName || 'Download File'}
                          {msg.fileSize ? ` (${(msg.fileSize / 1024).toFixed(1)}KB)` : ''}
                        </a>
                      ) : null}
                      {msg.message && <p>{msg.message}</p>}
                      <span className="message-time">
                        {timeStr}
                        {isSent && (
                          <span className={`delivery-tick ${msg.deliveryStatus || 'sent'}`}>
                            {msg.deliveryStatus === 'seen' ? ' ✓✓' : msg.deliveryStatus === 'delivered' ? ' ✓✓' : ' ✓'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar — show removal notice if user was removed from this group */}
        {activeChat && removedGroups.has(activeChat._id) ? (
          <div className="removed-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            You were removed from this group and can no longer send messages.
          </div>
        ) : (
          <form className="message-input-bar" onSubmit={handleSend}>
            <button type="button" className="icon-btn attach-btn" title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf"
              onChange={handleFileUpload}
            />
            <input
              type="text"
              placeholder={activeChat ? `Message ${activeChat.name}...` : 'Select a group first...'}
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); emitTyping(); }}
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
        )}
      </main>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {/* DM Creation Modal */}
      {showDMModal && (
        <StartChatModal
          onClose={() => setShowDMModal(false)}
          currentUserEmail={userEmail}
          onCreated={(group) => {
            loadGroups();
            setActiveChat(group);
            setShowDMModal(false);
          }}
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
          onDeleted={() => {
            setActiveChat(null);
            setShowManageModal(false);
            loadGroups();
            setGroupToast('Group deleted successfully.');
            setTimeout(() => setGroupToast(''), 3000);
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={userProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdated={(updated) => setUserProfile(updated)}
        />
      )}

      {/* Contact Request Modal */}
      {showContactsModal && (
        <ContactRequestModal
          onClose={() => setShowContactsModal(false)}
          onContactAdded={() => loadGroups()}
        />
      )}

      {/* View another user's profile */}
      {viewingUser && (
        <UserProfileViewer
          user={viewingUser}
          isOnline={onlineUsers.has(viewingUser._id?.toString())}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Group Members List Modal */}
      {showMembersList && activeChat && !activeChat.isDirectChat && (
        <div className="modal-overlay" onClick={() => setShowMembersList(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="profile-modal-header">
              <h2>Members · {activeChat.members?.length || 0}</h2>
              <button className="modal-close-btn" onClick={() => setShowMembersList(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
              {[...(activeChat.admin || []), ...(activeChat.members || [])]
                .filter((m, i, arr) => typeof m === 'object' && arr.findIndex(a => (typeof a === 'object' ? a._id : a) === m._id) === i)
                .map(member => {
                  const memberId = member._id?.toString();
                  const isAdmin = (activeChat.admin || []).some(a => (typeof a === 'object' ? a._id : a)?.toString() === memberId);
                  const isOnline = onlineUsers.has(memberId);
                  return (
                    <div
                      key={memberId}
                      className="viewer-field"
                      style={{ cursor: 'pointer', flexDirection: 'row', alignItems: 'center', gap: '10px' }}
                      onClick={() => { setShowMembersList(false); setViewingUser(member); }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarColor(member.email || 'u'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#06080d', flexShrink: 0, position: 'relative', overflow: 'visible' }}>
                        {member.avatar
                          ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : getInitials(member.username || member.email || 'U')
                        }
                        {isOnline && <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#00e676', border: '2px solid rgba(8,10,16,0.85)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {member.username || member.email}{isAdmin && <span style={{ color: 'var(--accent)', fontSize: '0.55rem', marginLeft: 6 }}>ADMIN</span>}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{member.email}</div>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {groupToast && (
        <div className="toast show" style={{ background: 'var(--success)' }}>
          {groupToast}
        </div>
      )}

      {/* Call Modal */}
      {callState && (
        <CallModal
          socket={socket}
          callState={callState}
          onClose={() => setCallState(null)}
        />
      )}
    </div>
  );
}
