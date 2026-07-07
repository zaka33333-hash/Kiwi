// /auth/logout — clear the session cookie and return to the gate.
import { clearSessionCookie } from './_lib.js';

export async function onRequest() {
  return new Response(null, {
    status: 303,
    headers: { Location: '/', 'Set-Cookie': clearSessionCookie() },
  });
}
