const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6969';

function getToken() {
  return localStorage.getItem('token');
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

export async function post(path, body, auth = true) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(auth),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: headers(true),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: headers(true),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export async function createGroup(groupName, members) {
  return post('/group/create', { groupName, members });
}

export async function fetchGroups() {
  return get('/group/all');
}

export async function addMemberToGroup(groupName, members) {
  return post('/group/add-user', { groupName, targetEmail: members });
}

export async function addAdmin(groupName, targetEmail) {
  return post('/group/add-admin', { groupName, targetEmail });
}

export async function removeAdmin(groupName, targetEmail) {
  return post('/group/remove-admin', { groupName, targetEmail });
}

export async function removeMember(groupName, targetEmail) {
  return post('/group/remove-user', { groupName, targetEmail });
}

export async function deleteGroup(groupName) {
  return post('/group/delete', { groupName });
}

export async function createDirectChat(targetEmail) {
  return post('/group/direct', { targetEmail });
}

export async function fetchAllUsers() {
  const data = await get('/user/all');
  // Backend returns user objects {_id, email, username, ...}
  // Modal components expect an array of email strings
  return (data.users || []).map(u => (typeof u === 'object' ? u.email : u));
}

export async function updateProfile(profileData) {
  return put('/user/profile', profileData);
}

export async function fetchProfile() {
  return get('/user/profile');
}

export async function searchMessages(groupId, query) {
  return get(`/group/search?groupId=${groupId}&q=${encodeURIComponent(query)}`);
}

export async function uploadFile(file) {
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6969';
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/group/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// Default export for convenience
export default {
  get,
  post,
  put,
  createGroup,
  fetchGroups,
  addMemberToGroup,
  addAdmin,
  removeAdmin,
  removeMember,
  deleteGroup,
  createDirectChat,
  fetchAllUsers,
  updateProfile,
  fetchProfile,
  searchMessages,
  uploadFile,
};
