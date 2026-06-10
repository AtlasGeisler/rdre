import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  user: { name: string } | null;
}

export const sessionOptions = {
  password: "rdre-secret-key-united-endodontics-2026-secure-long-password",
  cookieName: "rdre_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
