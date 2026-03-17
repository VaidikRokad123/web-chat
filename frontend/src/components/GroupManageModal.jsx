import { useState } from 'react';
import { addAdmin, removeAdmin, removeMember, addMemberToGroup } from '../services/api';
import './GroupManageModal.css';

const TABS = ['Admins', 'Members'];

export default function GroupManageModal({ group, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('Admins');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Local state so the list updates instantly after each action
  const [admins, setAdmins] = useState(() =>
    (group?.adminEmails || []).filter(Boolean)
  );
  const [members, setMembers] = useState(() =>
    (group?.memberEmails || []).filter(Boolean)
  );

  const groupName = group?.name || '';

  function setMsg(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  }

  // ── Admin actions ──────────────────────────────────────

  async function handleAddAdmin() {
    const target = email.trim().toLowerCase();
    if (!target) return;
    if (!members.includes(target)) {
      setMsg('error', 'User must be a member of the group first.');
      return;
    }
    if (admins.includes(target)) {
      setMsg('error', 'User is already an admin.');
      return;
    }
    setLoading(true);
    try {
      const result = await addAdmin(groupName, target);
      setAdmins(prev => [...prev, target]);
      setEmail('');
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

  // ── Member actions ─────────────────────────────────────

  async function handleAddMember() {
    const target = email.trim().toLowerCase();
    if (!target) return;
    if (members.includes(target)) {
      setMsg('error', 'User is already a member.');
      return;
    }
    setLoading(true);
    try {
      const result = await addMemberToGroup(groupName, [target]);
      setMembers(prev => [...prev, target]);
      setEmail('');
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
      // also remove from admins if they were one
      setAdmins(prev => prev.filter(e => e !== targetEmail));
      setMsg('success', 'Member removed.');
      onUpdated?.(result.group);
    } catch (err) {
      setMsg('error', err.message || 'Failed to remove member.');
    } finally {
      setLoading(false);
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
              onClick={() => { setActiveTab(tab); setEmail(''); setFeedback({ type: '', msg: '' }); }}
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

        {/* ── ADMINS TAB ── */}
        {activeTab === 'Admins' && (
          <>
            <div className="gm-action-row">
              <input
                id="admin-email-input"
                type="text"
                placeholder="Member email to promote..."
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFeedback({ type: '', msg: '' }); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                autoComplete="off"
              />
              <button
                className="gm-action-btn"
                onClick={handleAddAdmin}
                disabled={loading || !email.trim()}
                id="add-admin-btn"
              >
                {loading ? '...' : '+ Add Admin'}
              </button>
            </div>

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

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'Members' && (
          <>
            <div className="gm-action-row">
              <input
                id="member-manage-email-input"
                type="text"
                placeholder="Email to add as member..."
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFeedback({ type: '', msg: '' }); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                autoComplete="off"
              />
              <button
                className="gm-action-btn"
                onClick={handleAddMember}
                disabled={loading || !email.trim()}
                id="add-member-manage-btn"
              >
                {loading ? '...' : '+ Add'}
              </button>
            </div>

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

      </div>
    </div>
  );
}
