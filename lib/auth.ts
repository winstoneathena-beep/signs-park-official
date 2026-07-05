"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Supabase-backed auth store — the real sign-in that replaces the old
 * "type any name + email" localStorage session. Identity (name + email)
 * now comes from a verified Supabase Auth session on the shared Parkwell
 * instance; sign-up is invite-gated by the portal's handle_new_user()
 * trigger, so only invited @goparkwell.com people can create accounts.
 *
 * Same useSyncExternalStore pattern as lib/orders.ts: a module-level
 * snapshot cache + event fan-out, hydrated lazily on first subscribe so
 * nothing touches supabase-js during SSR.
 */

export type AuthUser = { name: string; email: string };

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: AuthUser };

const LOADING: AuthState = { status: "loading", user: null };
const SIGNED_OUT: AuthState = { status: "signed-out", user: null };

let state: AuthState = LOADING;
let started = false;
const listeners = new Set<() => void>();

function toState(session: Session | null): AuthState {
  const user = session?.user;
  if (!user) return SIGNED_OUT;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  return { status: "signed-in", user: { name, email: user.email ?? "" } };
}

function setState(next: AuthState) {
  state = next;
  for (const cb of listeners) cb();
}

/** Idempotent — the first subscriber kicks off session hydration. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => {
    setState(toState(data.session));
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    setState(toState(session));
  });
}

export function useAuth(): AuthState {
  const subscribe = useCallback((cb: () => void) => {
    start();
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}

/** Returns a user-facing error message, or null on success. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (!error) return null;
  if (/invalid login credentials/i.test(error.message)) {
    return "Wrong email or password.";
  }
  return error.message;
}

/** Returns a user-facing error message, or null on success. */
export async function signUpWithPassword(
  name: string,
  email: string,
  password: string,
): Promise<string | null> {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { display_name: name.trim() } },
  });
  if (!error) return null;
  const msg = error.message ?? "";
  // The invite gate raises inside the signup trigger; GoTrue surfaces
  // that as a 500 whose message supabase-js sometimes reduces to "{}".
  // Status is the reliable signal — a 500 on signup here means the
  // invite check fired (the only raise in handle_new_user).
  if (error.status === 500 || /database error|invite/i.test(msg)) {
    return "No invite found for this email. Ask an admin to invite you first.";
  }
  if (/already registered/i.test(msg)) {
    return "This email already has an account — sign in instead.";
  }
  return msg && msg !== "{}" ? msg : "Sign-up failed. Please try again.";
}

export async function supabaseSignOut(): Promise<void> {
  await supabase.auth.signOut();
}
