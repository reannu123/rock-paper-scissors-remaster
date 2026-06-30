import { io, Socket } from "socket.io-client";

const configuredServerUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

export const SERVER_URL =
  configuredServerUrl === undefined ? "http://localhost:4000" : configuredServerUrl;

export type User = {
  id: string;
  username: string;
  email: string | null;
  isGuest: boolean;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
};

// fetch wrapper that always sends the session cookie.
export async function api<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return data as T;
}

// Lazily-created singleton socket. Connect only after the user is signed in.
let socket: Socket | null = null;
export function getSocket(): Socket {
  if (!socket) {
    socket = SERVER_URL
      ? io(SERVER_URL, { withCredentials: true, autoConnect: true })
      : io({ withCredentials: true, autoConnect: true });
  }
  return socket;
}
export function dropSocket() {
  socket?.disconnect();
  socket = null;
}
