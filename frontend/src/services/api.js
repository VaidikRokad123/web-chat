const BASE_URL = '/api';

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
