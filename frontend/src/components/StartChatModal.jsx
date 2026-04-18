import { useState, useEffect } from 'react';
import { createDirectChat, fetchAllUsers } from '../services/api';
import './CreateGroupModal.css'; // reuse same modal styles

export default function StartChatModal({ onClose, onCreated, currentUserEmail }) {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    console.log('🔍 Fetching all users for DM...');
    setLoadingUsers(true);
    fetchAllUsers()
      .then(users => {
        console.log('✅ Users loaded:', users);
        setAllUsers(users);
      })
      .catch(err => {
        console.error('❌ Failed to load users:', err);
        setError('Failed to load users. Please try again.');
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  // Exclude current user, filter by search
  const available = allUsers
    .filter(e => e !== currentUserEmail)
    .filter(e => e.toLowerCase().includes(search.toLowerCase()));

  async function handleSelect(email) {
    setLoading(true);
    setError('');
    try {
      const result = await createDirectChat(email);
      onCreated?.(result.group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create chat.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="modal-backdrop" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        className="modal-card" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dm-modal-title"
        style={{
          backgroundColor: 'rgba(12, 16, 24, 0.98)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '4px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.3)'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="dm-modal-title">New Chat</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="modal-field">
          <label htmlFor="dm-search-input">Select a user to chat with</label>
          <input
            id="dm-search-input"
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setError(''); }}
            autoComplete="off"
            autoFocus
            disabled={loadingUsers}
          />

          {/* Loading state */}
          {loadingUsers && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <div className="loading-spinner" style={{ width: 20, height: 20 }} />
            </div>
          )}

          {/* Available users — inline list */}
          {!loadingUsers && (
            <div className="inline-user-list">
              {available.length === 0 && search.trim() && (
                <div className="inline-no-users">No matching users found</div>
              )}
              {available.map(email => (
                <div
                  key={email}
                  className="inline-user-item"
                  onClick={() => handleSelect(email)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-user-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {email}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="modal-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <div className="loading-spinner" style={{ width: 24, height: 24 }} />
          </div>
        )}
      </div>
    </div>
  );
}
