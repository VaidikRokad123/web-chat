import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ContactRequestModal.css';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = ['#00ffa9', '#00e5ff', '#ff00aa', '#ffe600', '#ff3860', '#7c4dff', '#00bcd4', '#ff6d00'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ContactRequestModal({ onClose, onContactAdded }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'contacts', 'send'
  const [requests, setRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadRequests();
    loadContacts();
    loadAllUsers();
  }, []);

  async function loadRequests() {
    try {
      const res = await api.get('/user/contact/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load contact requests:', err);
    }
  }

  async function loadContacts() {
    try {
      const res = await api.get('/user/contacts');
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }

  async function loadAllUsers() {
    try {
      const res = await api.get('/user/all');
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  async function handleSendRequest() {
    if (!sendEmail.trim()) return;
    setLoading(true);
    try {
      await api.post('/user/contact/request', { targetEmail: sendEmail.trim() });
      showToast('Contact request sent!');
      setSendEmail('');
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(requestId) {
    setLoading(true);
    try {
      await api.post('/user/contact/accept', { requestId });
      showToast('Contact request accepted!');
      loadRequests();
      loadContacts();
      if (onContactAdded) onContactAdded();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to accept request');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(requestId) {
    setLoading(true);
    try {
      await api.post('/user/contact/reject', { requestId });
      showToast('Contact request rejected');
      loadRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const filteredUsers = allUsers.filter(u =>
    u.email !== user?.email &&
    (u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredContacts = contacts.filter(c =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="contact-request-modal" onClick={e => e.stopPropagation()}>
          <div className="contact-request-header">
            <h2>Contacts</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="contact-request-tabs">
            <button
              className={`contact-tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Requests
              {requests.length > 0 && <span className="contact-tab-badge">{requests.length}</span>}
            </button>
            <button
              className={`contact-tab ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              My Contacts
            </button>
            <button
              className={`contact-tab ${activeTab === 'send' ? 'active' : ''}`}
              onClick={() => setActiveTab('send')}
            >
              Add Contact
            </button>
          </div>

          <div className="contact-request-content">
            {activeTab === 'requests' && (
              <>
                {requests.length === 0 ? (
                  <div className="contact-empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p>No pending contact requests</p>
                  </div>
                ) : (
                  <div className="contact-request-list">
                    {requests.map(req => (
                      <div key={req._id} className="contact-request-item">
                        <div
                          className="contact-request-avatar"
                          style={{
                            background: req.from?.avatar ? 'transparent' : getAvatarColor(req.from?.username || req.from?.email)
                          }}
                        >
                          {req.from?.avatar ? (
                            <img src={req.from.avatar} alt="" />
                          ) : (
                            getInitials(req.from?.username || req.from?.email)
                          )}
                        </div>
                        <div className="contact-request-info">
                          <div className="contact-request-name">
                            {req.from?.username || req.from?.email?.split('@')[0]}
                          </div>
                          <div className="contact-request-email">{req.from?.email}</div>
                        </div>
                        <div className="contact-request-actions">
                          <button
                            className="contact-action-btn accept"
                            onClick={() => handleAccept(req._id)}
                            disabled={loading}
                          >
                            ✓ Accept
                          </button>
                          <button
                            className="contact-action-btn reject"
                            onClick={() => handleReject(req._id)}
                            disabled={loading}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'contacts' && (
              <>
                <div className="contact-search-box">
                  <input
                    type="text"
                    className="contact-search-input"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {filteredContacts.length === 0 ? (
                  <div className="contact-empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p>{searchQuery ? 'No contacts found' : 'No contacts yet'}</p>
                  </div>
                ) : (
                  <div className="contact-request-list">
                    {filteredContacts.map(contact => (
                      <div key={contact._id} className="contact-request-item">
                        <div
                          className="contact-request-avatar"
                          style={{
                            background: contact.avatar ? 'transparent' : getAvatarColor(contact.username || contact.email)
                          }}
                        >
                          {contact.avatar ? (
                            <img src={contact.avatar} alt="" />
                          ) : (
                            getInitials(contact.username || contact.email)
                          )}
                        </div>
                        <div className="contact-request-info">
                          <div className="contact-request-name">
                            {contact.username || contact.email?.split('@')[0]}
                          </div>
                          <div className="contact-request-email">{contact.email}</div>
                        </div>
                        <div className="contact-request-actions">
                          <button className="contact-action-btn message">
                            💬 Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'send' && (
              <>
                <div className="contact-send-request">
                  <input
                    type="email"
                    className="contact-send-input"
                    placeholder="Enter email address..."
                    value={sendEmail}
                    onChange={e => setSendEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                  />
                  <button
                    className="contact-send-btn"
                    onClick={handleSendRequest}
                    disabled={loading || !sendEmail.trim()}
                  >
                    Send
                  </button>
                </div>
                <div className="contact-search-box">
                  <input
                    type="text"
                    className="contact-search-input"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="contact-request-list">
                  {filteredUsers.slice(0, 20).map(u => (
                    <div key={u._id} className="contact-request-item">
                      <div
                        className="contact-request-avatar"
                        style={{
                          background: u.avatar ? 'transparent' : getAvatarColor(u.username || u.email)
                        }}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt="" />
                        ) : (
                          getInitials(u.username || u.email)
                        )}
                      </div>
                      <div className="contact-request-info">
                        <div className="contact-request-name">
                          {u.username || u.email?.split('@')[0]}
                        </div>
                        <div className="contact-request-email">{u.email}</div>
                      </div>
                      <div className="contact-request-actions">
                        <button
                          className="contact-action-btn accept"
                          onClick={() => {
                            setSendEmail(u.email);
                            handleSendRequest();
                          }}
                          disabled={loading}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="contact-toast">{toast}</div>}
    </>
  );
}
