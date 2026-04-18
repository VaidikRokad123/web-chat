import { useState, useRef } from 'react';
import { updateProfile } from '../services/api';
import './ProfileModal.css';

export default function ProfileModal({ user, onClose, onUpdated }) {
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleAvatarFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await updateProfile({ username, avatar, bio, status });
      onUpdated(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-avatar-preview" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
          {avatar ? (
            <img src={avatar} alt="Avatar" className="avatar-img-large" />
          ) : (
            <div className="avatar-placeholder-large">
              {(username || user?.email || '?')[0].toUpperCase()}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFile}
            style={{ display: 'none' }}
          />
          <span className="avatar-edit-hint">Change</span>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
            />
          </div>

          <div className="profile-field">
            <label>Status</label>
            <input
              type="text"
              value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="What's your status?"
              maxLength={50}
            />
          </div>

          <div className="profile-field">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
            />
          </div>

          {error && <p className="profile-error">{error}</p>}

          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
