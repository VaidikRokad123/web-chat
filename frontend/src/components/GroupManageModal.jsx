import { useState, useEffect } from 'react';
import { addAdmin, removeAdmin, removeMember, addMemberToGroup, fetchAllUsers, deleteGroup } from '../services/api';
import './GroupManageModal.css';

const TABS = ['Admins', 'Members'];

export default function GroupManageModal({ group, onClose, onUpdated, onDeleted }) {
  const [activeTab, setActiveTab] = useState('Admins');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // All registered users (emails), fetched once on mount
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');

  // Local state so the list updates instantly after each action
  const [admins, setAdmins] = useState(() =>
    (group?.adminEmails || []).filter(Boolean)
  );
  const [members, setMembers] = useState(() =>
    (group?.memberEmails || []).filter(Boolean)
  );

  const groupName = group?.name || '';

  // Fetch all users once
  useEffect(() => {
    fetchAllUsers().then(setAllUsers).catch(() => {});
  }, []);

  // Reset search when switching tabs
  function switchTab(tab) {
    setActiveTab(tab);
    setSearch('');
    setFeedback({ type: '', msg: '' });
  }

  function setMsg(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  }

  // Compute which users are eligible
  function eligibleUsers() {
    if (activeTab === 'Members') {
      return allUsers.filter(e => !members.includes(e));
    } else {
      return members.filter(e => !admins.includes(e));
    }
  }

  // Filter by search query
  const suggestions = eligibleUsers().filter(e =>
    e.toLowerCase().includes(search.toLowerCase())
  );

  // ── Admin actions ──
  async function handleAddAdmin(email) {
    if (!members.includes(email)) {
      setMsg('error', 'User must be a member of the group first.');
      return;
    }
    if (admins.includes(email)) {
      setMsg('error', 'User is already an admin.');
      return;
    }
    setLoading(true);
    try {
      const result = await addAdmin(groupName, email);
      setAdmins(prev => [...prev, email]);
      setSearch('');
      setMsg('success', 'Admin added successfully!');
      onUpdated?.(result.group);
    } catch (err) {
      setMsg('error', err.message || 'Failed to add admin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveAdmin(targetEmail) {
    setLoading(true);
    try {
      const result = await removeAdmin(groupName, targetEmail);
      setAdmins(prev => prev.filter(e => e !== targetEmail));
      setMsg('success', 'Admin removed.');
      onUpdated?.(result.group);
    } catch (err) {
      setMsg('error', err.message || 'Failed to remove admin.');
    } finally {
      setLoading(false);
    }
  }

  // ── Member actions ──
  async function handleAddMember(email) {
    if (members.includes(email)) {
      setMsg('error', 'User is already a member.');
      return;
    }
    setLoading(true);
    try {
      const result = await addMemberToGroup(groupName, [email]);
      setMembers(prev => [...prev, email]);
      setSearch('');
      setMsg('success', 'Member added!');
      onUpdated?.(result.group);
    } catch (err) {
      setMsg('error', err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(targetEmail) {
    setLoading(true);
    try {
      const result = await removeMember(groupName, targetEmail);
      setMembers(prev => prev.filter(e => e !== targetEmail));
      setAdmins(prev => prev.filter(e => e !== targetEmail));
      setMsg('success', 'Member removed.');
      onUpdated?.(result.group);
    } catch (err) {
      setMsg('error', err.message || 'Failed to remove member.');
    } finally {
      setLoading(false);
    }
  }

  function handleInlineSelect(email) {
    if (activeTab === 'Admins') {
      handleAddAdmin(email);
    } else {
      handleAddMember(email);
    }
  }

  return (
    <div className="gm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gm-card" role="dialog" aria-modal="true" aria-labelledby="gm-title">

        {/* Header */}
        <div className="gm-header">
          <div>
            <h2 className="gm-title" id="gm-title">Manage Group</h2>
            <p className="gm-subtitle" style={{ textTransform: 'capitalize' }}>{groupName}</p>
          </div>
          <button className="gm-close-btn" onClick={onClose} aria-label="Close" id="close-manage-modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="gm-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`gm-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => switchTab(tab)}
              id={`tab-${tab.toLowerCase()}`}
            >
              {tab} ({tab === 'Admins' ? admins.length : members.length})
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback.msg && (
          feedback.type === 'error' ? (
            <div className="gm-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {feedback.msg}
            </div>
          ) : (
            <div className="gm-success" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feedback.msg}
            </div>
          )
        )}

        {/* ── Search + Inline user list for ADD action ── */}
        <div className="gm-action-row" style={{ flexDirection: 'column', gap: '6px' }}>
          <input
            id={activeTab === 'Admins' ? 'admin-email-input' : 'member-manage-email-input'}
            type="text"
            placeholder={
              activeTab === 'Admins'
                ? 'Search member to promote…'
                : 'Search user to add…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="gm-inline-search"
          />

          {/* Inline clickable user list */}
          <div className="gm-inline-user-list">
            {suggestions.length === 0 && search.trim() && (
              <div className="gm-inline-no-users">No matching users</div>
            )}
            {suggestions.map(email => (
              <div
                key={email}
                className="gm-inline-user-item"
                onClick={() => handleInlineSelect(email)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gm-user-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{email}</span>
                <span className="gm-add-label">+ {activeTab === 'Admins' ? 'PROMOTE' : 'ADD'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ADMINS LIST ── */}
        {activeTab === 'Admins' && (
          <>
            <p className="gm-list-label">Current Admins ({admins.length})</p>
            <div className="gm-user-list">
              {admins.length === 0 && <p className="gm-empty">No admins listed.</p>}
              {admins.map((adminEmail) => (
                <div key={adminEmail} className="gm-user-row">
                  <span className="gm-user-email">{adminEmail}</span>
                  <span className="gm-badge">Admin</span>
                  <button
                    className="gm-remove-btn"
                    onClick={() => handleRemoveAdmin(adminEmail)}
                    disabled={loading || admins.length <= 1}
                    title={admins.length <= 1 ? 'Cannot remove the last admin' : 'Remove admin'}
                    aria-label={`Remove admin ${adminEmail}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MEMBERS LIST ── */}
        {activeTab === 'Members' && (
          <>
            <p className="gm-list-label">Current Members ({members.length})</p>
            <div className="gm-user-list">
              {members.length === 0 && <p className="gm-empty">No members listed.</p>}
              {members.map((memberEmail) => (
                <div key={memberEmail} className="gm-user-row">
                  <span className="gm-user-email">{memberEmail}</span>
                  {admins.includes(memberEmail) && <span className="gm-badge">Admin</span>}
                  <button
                    className="gm-remove-btn"
                    onClick={() => handleRemoveMember(memberEmail)}
                    disabled={loading}
                    aria-label={`Remove member ${memberEmail}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Delete Group Danger Zone ── */}
        <div className="gm-danger-zone">
          {!confirmDelete ? (
            <button
              className="gm-delete-btn"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              id="delete-group-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete Group
            </button>
          ) : (
            <div className="gm-confirm-delete">
              <p>Are you sure? This cannot be undone.</p>
              <div className="gm-confirm-actions">
                <button
                  className="gm-delete-btn confirm"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await deleteGroup(groupName);
                      onDeleted?.();
                      onClose();
                    } catch (err) {
                      setMsg('error', err.message || 'Failed to delete group.');
                      setConfirmDelete(false);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  id="confirm-delete-group-btn"
                >
                  {loading ? '…' : 'Yes, Delete'}
                </button>
                <button
                  className="gm-cancel-btn"
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
