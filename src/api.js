// API client para comunicação com o backend
const API_BASE = '/api';

export const api = {
  // Groups
  async createGroup(id, name) {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    if (!res.ok) throw new Error('Failed to create group');
    return res.json();
  },

  async getGroup(id) {
    const res = await fetch(`${API_BASE}/groups/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch group');
    }
    return res.json();
  },

  // Users
  async getUsers(groupId) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async createUser(groupId, name, password) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return res.json();
  },

  async verifyPassword(groupId, userName, password) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users/${encodeURIComponent(userName)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Failed to verify password');
    const data = await res.json();
    return data.valid;
  },

  async deleteUser(groupId, userName) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users/${encodeURIComponent(userName)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  // Stickers
  async addSticker(groupId, userName, stickerCode, type) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users/${encodeURIComponent(userName)}/stickers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sticker_code: stickerCode, type })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add sticker');
    }
    return res.json();
  },

  async removeSticker(groupId, userName, stickerCode, type) {
    const res = await fetch(
      `${API_BASE}/groups/${groupId}/users/${encodeURIComponent(userName)}/stickers/${encodeURIComponent(stickerCode)}/${type}`,
      { method: 'DELETE' }
    );
    if (!res.ok) throw new Error('Failed to remove sticker');
    return res.json();
  },

  async clearStickers(groupId, userName) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/users/${encodeURIComponent(userName)}/stickers`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear stickers');
    return res.json();
  }
};
