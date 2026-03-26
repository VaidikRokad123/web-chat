import { useState, useEffect } from 'react';
import { createGroup, fetchAllUsers } from '../services/api';
import './CreateGroupModal.css';

export default function CreateGroupModal({ onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // All registered users (emails)
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  // Users not yet added as members, filtered by search
  const available = allUsers
    .filter(e => !members.includes(e))
    .filter(e => e.toLowerCase().includes(search.toLowerCase()));

  function handleSelect(email) {
    setMembers(prev => [...prev, email]);
    setSearch('');
    setError('');
  }

  function removeMember(email) {
    setMembers(prev => prev.filter(m => m !== email));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (members.length === 0) {
      setError('Add at least one member.');
      return;
    }

    setLoading(true);
    try {
      const result = await createGroup(groupName.trim(), members);
      onCreated?.(result.group);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">Create New Group</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" id="close-group-modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit} id="create-group-form">
          {/* Group Name */}
          <div className="modal-field">
            <label htmlFor="group-name-input">Group Name</label>
            <input
              id="group-name-input"
              type="text"
              placeholder="e.g. Design Team"
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setError(''); }}
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Add Members — inline list with search filter */}
          <div className="modal-field">
            <label htmlFor="member-email-input">Add Members</label>
            <input
              id="member-email-input"
              type="text"
              placeholder="Search users to add…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setError(''); }}
              autoComplete="off"
            />

            {/* Selected members (pills) */}
            {members.length > 0 && (
              <div className="member-pills">
                {members.map((email) => (
                  <span key={email} className="member-pill">
                    {email}
                    <button
                      type="button"
                      className="pill-remove"
                      onClick={() => removeMember(email)}
                      aria-label={`Remove ${email}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available users — inline list (not dropdown) */}
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

          {/* Submit */}
          <button
            type="submit"
            className={`modal-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
            id="create-group-submit-btn"
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
