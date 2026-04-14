// functions/api/utils/types.ts

export interface Env {
  DB: any; // Cloudflare D1 Binding type (D1Database)
}

export interface GoogleAuthData {
  email?: string;
  name?: string;
}

export interface UserRecord {
  email: string;
  name: string;
  country: string;
  recent_pages?: string | any[];
}

export interface HistoryItem {
  url: string;
  title: string;
}

export interface LoginRequest {
  token: string;
}

export interface RegisterRequest {
  token: string;
  country: string;
}

export interface SyncHistoryRequest {
  url: string;
  title: string;
}