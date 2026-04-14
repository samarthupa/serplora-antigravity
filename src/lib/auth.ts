// src/lib/auth.ts
const USER_KEY = 'serplora_user';
const HISTORY_KEY = 'serplora_recent_pages';

export function getLocalUser() {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export function saveLocalUser(userData: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(HISTORY_KEY);
  document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/';
}