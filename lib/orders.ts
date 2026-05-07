"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FieldValues } from "@/components/sign/SignPreview";

export type OrderStatus = "draft" | "pending" | "approved" | "ordered" | "rejected";

export type Order = {
  id: string;
  templateId: string;
  status: OrderStatus;
  /** Editable field values. */
  values: FieldValues;
  /** Vendor specs */
  specs: {
    widthIn: number;
    heightIn: number;
    quantity: number;
    material: string;
    notes?: string;
  };
  /** Location label (free-form) for filter/search. */
  location: string;
  /** Manager who created the order. */
  createdBy: { name: string; email: string; role: Role };
  createdAt: number;
  updatedAt: number;
  /** Approver decision metadata. */
  approval?: {
    decidedBy: string;
    decidedAt: number;
    notes?: string;
    revisionRequested?: boolean;
  };
};

export type Role = "requester" | "approver";

const ORDERS_KEY = "parkwell.orders.v1";
const SESSION_KEY = "parkwell.session.v1";
const ONBOARDED_KEY = "parkwell.onboarded.v1";

type Session = {
  name: string;
  email: string;
  role: Role;
};

const DEFAULT_SESSION: Session = {
  name: "Sam Manager",
  email: "sam@goparkwell.com",
  role: "requester",
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-2026-0184",
    templateId: "standard-rate",
    status: "pending",
    values: {
      locationName: "250 COLUMBINE",
      rateTable: [
        {
          label: "WEEKDAYS",
          sub: "5am-4pm",
          rates: ["$10 first 2 hours", "$5 hourly thereafter", "$25 maximum"],
        },
        { label: "WEEKNIGHTS", sub: "4pm-5am", rates: ["$15 flat rate"] },
        { label: "WEEKENDS", sub: "5am-5am", rates: ["$15 flat rate"] },
      ],
      additional:
        "$35 lost ticket fee.\nNew day starts at 5am.\nEvent rates may apply.",
    },
    specs: { widthIn: 24, heightIn: 36, quantity: 4, material: "Aluminium" },
    location: "250 Columbine — Denver",
    createdBy: { name: "Andre Gurule", email: "andre@goparkwell.com", role: "requester" },
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: "ORD-2026-0181",
    templateId: "directional-windmaster",
    status: "approved",
    values: { locationName: "RIVERVIEW PLAZA" },
    specs: { widthIn: 24, heightIn: 36, quantity: 2, material: "Coroplast" },
    location: "Riverview Plaza — Boulder",
    createdBy: { name: "Shannon Snow", email: "shannon@goparkwell.com", role: "requester" },
    createdAt: Date.now() - 1000 * 60 * 60 * 80,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    approval: {
      decidedBy: "Michael Miller",
      decidedAt: Date.now() - 1000 * 60 * 60 * 12,
      notes: "Looks great. Cleared for vendor.",
    },
  },
  {
    id: "ORD-2026-0179",
    templateId: "scan-to-pay-standard",
    status: "ordered",
    values: {},
    specs: { widthIn: 18, heightIn: 27, quantity: 6, material: "Vinyl" },
    location: "Sunset Row — Los Angeles",
    createdBy: { name: "Travis Bruce", email: "travis@goparkwell.com", role: "requester" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    approval: {
      decidedBy: "Michael Miller",
      decidedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
  },
  {
    id: "ORD-2026-0175",
    templateId: "valet-podium-rate",
    status: "approved",
    values: { propertyName: "LIMELIGHT" },
    specs: { widthIn: 18, heightIn: 24, quantity: 2, material: "Dibond" },
    location: "Limelight — Denver",
    createdBy: { name: "Roman Khaimov", email: "roman@goparkwell.com", role: "requester" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1.5,
    approval: {
      decidedBy: "Michael Miller",
      decidedAt: Date.now() - 1000 * 60 * 60 * 24 * 1.5,
    },
  },
  {
    id: "ORD-2026-0173",
    templateId: "limit-of-liability",
    status: "ordered",
    values: {},
    specs: { widthIn: 18, heightIn: 24, quantity: 12, material: "Aluminium" },
    location: "Multi-site — Denver Metro",
    createdBy: { name: "Ryan Whitehurst", email: "ryan@goparkwell.com", role: "requester" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
    approval: {
      decidedBy: "Michael Miller",
      decidedAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
    },
  },
];

/**
 * Snapshot caching is REQUIRED here — useSyncExternalStore loops if getSnapshot
 * returns a fresh reference every call. We key the cache off the raw localStorage
 * string so it invalidates exactly when the data changes.
 */
let ordersRawCache: string | null = null;
let ordersCache: Order[] = SAMPLE_ORDERS;
let sessionRawCache: string | null = null;
let sessionCache: Session = DEFAULT_SESSION;

function readOrders(): Order[] {
  if (typeof window === "undefined") return SAMPLE_ORDERS;
  try {
    let raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      raw = JSON.stringify(SAMPLE_ORDERS);
      window.localStorage.setItem(ORDERS_KEY, raw);
    }
    if (raw === ordersRawCache) return ordersCache;
    ordersRawCache = raw;
    ordersCache = JSON.parse(raw) as Order[];
    return ordersCache;
  } catch {
    return ordersCache;
  }
}

function writeOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(orders);
  window.localStorage.setItem(ORDERS_KEY, raw);
  ordersRawCache = raw;
  ordersCache = orders;
  window.dispatchEvent(new Event("parkwell:orders"));
}

function readSession(): Session {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  try {
    let raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      raw = JSON.stringify(DEFAULT_SESSION);
      window.localStorage.setItem(SESSION_KEY, raw);
    }
    if (raw === sessionRawCache) return sessionCache;
    sessionRawCache = raw;
    sessionCache = JSON.parse(raw) as Session;
    return sessionCache;
  } catch {
    return sessionCache;
  }
}

function writeSession(s: Session) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(s);
  window.localStorage.setItem(SESSION_KEY, raw);
  sessionRawCache = raw;
  sessionCache = s;
  window.dispatchEvent(new Event("parkwell:session"));
}

export function useOrders(): Order[] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("parkwell:orders", cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener("parkwell:orders", cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, readOrders, () => SAMPLE_ORDERS);
}

export function useSession(): {
  session: Session;
  setRole: (role: Role) => void;
  setSession: (s: Session) => void;
} {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("parkwell:session", cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener("parkwell:session", cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  const session = useSyncExternalStore(subscribe, readSession, () => DEFAULT_SESSION);
  return {
    session,
    setRole: (role) => writeSession({ ...readSession(), role }),
    setSession: writeSession,
  };
}

export function nextOrderId(): string {
  const orders = readOrders();
  const year = new Date().getFullYear();
  let max = 0;
  for (const o of orders) {
    const m = /ORD-(\d{4})-(\d{4})/.exec(o.id);
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `ORD-${year}-${String(max + 1).padStart(4, "0")}`;
}

export function saveOrder(order: Order) {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) orders[idx] = order;
  else orders.unshift(order);
  writeOrders(orders);
}

export function deleteOrder(id: string) {
  writeOrders(readOrders().filter((o) => o.id !== id));
}

export function statusLabel(s: OrderStatus): string {
  return {
    draft: "Draft",
    pending: "Pending Approval",
    approved: "Approved",
    ordered: "Ordered",
    rejected: "Rejected",
  }[s];
}

/* ---------------------------------- Onboarding gate ---------------------------------- */

function readOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDED_KEY) === "true";
}

export function setOnboarded(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDED_KEY, value ? "true" : "false");
  window.dispatchEvent(new Event("parkwell:onboarded"));
}

export function chooseRole(role: Role) {
  const current = readSession();
  writeSession({ ...current, role });
  setOnboarded(true);
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDED_KEY);
  window.dispatchEvent(new Event("parkwell:onboarded"));
}

export function useOnboarded(): boolean {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("parkwell:onboarded", cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener("parkwell:onboarded", cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, readOnboarded, () => false);
}
