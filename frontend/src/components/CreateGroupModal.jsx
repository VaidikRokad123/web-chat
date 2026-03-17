import { useState } from 'react';
import { createGroup } from '../services/api';
import './CreateGroupModal.css';

export default function CreateGroupModal({ onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addMember() {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    if (members.includes(email)) {
      setError('This email is already added.');
      return;
    }
    setMembers(prev => [...prev, email]);
    setMemberEmail('');
    setError('');
  }

  function removeMember(email) {
    setMembers(prev => prev.filter(m => m !== email));
  }

  function handleMemberKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
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

          {/* Add Members */}
          <div className="modal-field">
            <label htmlFor="member-email-input">Add Members</label>
            <div className="member-input-row">
              <input
                id="member-email-input"
                type="text"
                placeholder="Enter member email..."
                value={memberEmail}
                onChange={(e) => { setMemberEmail(e.target.value); setError(''); }}
                onKeyDown={handleMemberKeyDown}
                autoComplete="off"
              />
              <button type="button" className="add-member-btn" onClick={addMember} id="add-member-btn">
                + Add
              </button>
            </div>

            {/* Pills */}
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
