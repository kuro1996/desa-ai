// DesaAI — drafts library.
// Firestore (anonymous auth) when Firebase is connected; localStorage
// fallback in demo mode or when auth is unavailable. Never throws —
// saving a draft must never break the drafting flow.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { FirebaseServices } from "./firebase";

export interface Draft {
  id: string;
  kind: "letter" | "summary" | "qa";
  title: string;
  content: string;
  createdAt: number;
  source: "firestore" | "local";
}

const LOCAL_KEY = "desaai-drafts-v1";

function loadLocal(): Draft[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Draft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(drafts: Draft[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(drafts));
  } catch {
    // Storage full or unavailable — draft is still on screen.
  }
}

/** Count locally saved drafts (sync — used by the quick-stats strip). */
export function countLocalDrafts(kind?: Draft["kind"]): number {
  const all = loadLocal();
  return kind ? all.filter((d) => d.kind === kind).length : all.length;
}

function firestoreReady(svc: FirebaseServices): svc is FirebaseServices & {
  db: Firestore;
  uid: string;
} {
  return svc.status === "ready" && !!svc.db && !!svc.uid;
}

export async function saveDraft(
  svc: FirebaseServices,
  kind: Draft["kind"],
  title: string,
  content: string,
): Promise<Draft> {
  const draft: Draft = {
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    title,
    content,
    createdAt: Date.now(),
    source: "local",
  };
  if (firestoreReady(svc)) {
    try {
      const ref = await addDoc(collection(svc.db, "users", svc.uid, "drafts"), {
        kind,
        title,
        content,
        createdAt: serverTimestamp(),
      });
      return { ...draft, id: ref.id, source: "firestore" };
    } catch (e) {
      console.warn("DesaAI: Firestore save failed, keeping draft locally.", e);
    }
  }
  const all = loadLocal();
  all.unshift(draft);
  saveLocal(all);
  return draft;
}

export async function listDrafts(svc: FirebaseServices | null): Promise<Draft[]> {
  const local = loadLocal();
  if (!svc || !firestoreReady(svc)) return local;
  try {
    const q = query(
      collection(svc.db, "users", svc.uid, "drafts"),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    const remote: Draft[] = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt;
      const createdAt =
        ts && typeof ts.toMillis === "function" ? ts.toMillis() : Date.now();
      return {
        id: d.id,
        kind: (data.kind as Draft["kind"]) || "letter",
        title: String(data.title || "Untitled"),
        content: String(data.content || ""),
        createdAt,
        source: "firestore" as const,
      };
    });
    // Local drafts are kept too (created while offline / in demo mode).
    return [...remote, ...local].sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.warn("DesaAI: Firestore read failed, showing local drafts.", e);
    return local;
  }
}

export async function deleteDraft(
  svc: FirebaseServices | null,
  draft: Draft,
): Promise<void> {
  if (draft.source === "firestore" && svc && firestoreReady(svc)) {
    try {
      await deleteDoc(doc(svc.db, "users", svc.uid, "drafts", draft.id));
      return;
    } catch (e) {
      console.warn("DesaAI: Firestore delete failed.", e);
    }
  }
  saveLocal(loadLocal().filter((d) => d.id !== draft.id));
}
