import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { firestoreLoadState, firestoreSaveState, firestoreClearState } from '../store';
import type { AppState } from '../store';

/* ---------- Types ---------- */

interface AuthContextValue {
  /** Firebase user (null if not logged in, undefined while loading) */
  user: User | null;
  /** True while Firebase auth is resolving the initial session */
  loading: boolean;
  /** Current app state (career data) — loaded from Firestore */
  appState: AppState;
  /** Merge partial state into appState and persist to Firestore */
  setAppState: (partial: Partial<AppState>) => void;
  /** Reset all career data for current user */
  clearAppState: () => void;
  /** Force reload state from Firestore */
  refreshState: () => Promise<void>;
}

const DEFAULT_STATE: AppState = {
  profile: null,
  alignedMatches: null,
  interestMatches: null,
  careerMatches: null,
  chosenCareer: null,
  isCareerAligned: true,
  roadmap: null,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  appState: DEFAULT_STATE,
  setAppState: () => {},
  clearAppState: () => {},
  refreshState: async () => {},
});

/* ---------- Provider ---------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppStateRaw] = useState<AppState>(DEFAULT_STATE);

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load state from Firestore when user logs in
        const state = await firestoreLoadState(firebaseUser.uid);
        setAppStateRaw(state);
      } else {
        setAppStateRaw(DEFAULT_STATE);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Merge partial state + persist to Firestore
  const setAppState = useCallback(
    (partial: Partial<AppState>) => {
      setAppStateRaw((prev) => {
        const merged = { ...prev, ...partial };
        if (user) {
          firestoreSaveState(user.uid, merged);
        }
        return merged;
      });
    },
    [user]
  );

  // Clear all career data
  const clearAppState = useCallback(() => {
    setAppStateRaw(DEFAULT_STATE);
    if (user) {
      firestoreClearState(user.uid);
    }
  }, [user]);

  // Force reload from Firestore
  const refreshState = useCallback(async () => {
    if (user) {
      const state = await firestoreLoadState(user.uid);
      setAppStateRaw(state);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, appState, setAppState, clearAppState, refreshState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ---------- Hooks ---------- */

export function useAuth() {
  return useContext(AuthContext);
}

export function useAppState() {
  const { appState, setAppState, clearAppState } = useContext(AuthContext);
  return { appState, setAppState, clearAppState };
}
