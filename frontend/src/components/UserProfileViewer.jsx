import './ProfileModal.css';

function formatLastSeen(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UserProfileViewer({ user, isOnline, onClose }) {
  if (!user) return null;

  const displayName = user.username || user.email || 'Unknown';
  const initial = displayName[0].toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal viewer" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>User Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-avatar-preview">
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="avatar-img-large" />
          ) : (
            <div className="avatar-placeholder-large">{initial}</div>
          )}
          {isOnline && <span className="online-badge-large" />}
        </div>

        <div className="profile-viewer-info">
          <h3 className="viewer-name">{displayName}</h3>
          <span className="viewer-email">{user.email}</span>

          <div className="viewer-field">
            <span className="viewer-label">Status</span>
            <span className="viewer-value">{user.status || 'Hey there!'}</span>
          </div>

          {user.bio && (
            <div className="viewer-field">
              <span className="viewer-label">Bio</span>
              <span className="viewer-value">{user.bio}</span>
            </div>
          )}

          <div className="viewer-field">
            <span className="viewer-label">{isOnline ? 'Status' : 'Last Seen'}</span>
            <span className={`viewer-value ${isOnline ? 'online-text' : ''}`}>
              {isOnline ? '● Online' : formatLastSeen(user.lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
