import { getSession } from "./auth";

export async function getAuthUser() {
  const session = await getSession();
  return session.user ?? null;
}
