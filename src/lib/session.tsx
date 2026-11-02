import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { SessionUser } from '@/lib/types';

/**
 * Sessão "visitante primeiro".
 *
 * É o padrão do CapCut: `POST /passport/user/device_login/` cria um device id e
 * uma conta visitante; `bind_visitor_account` faz o upgrade depois. Aqui o
 * contrato é o mesmo, mas a persistência é local (SecureStore no device).
 */
const STORAGE_KEY = 'clipflow.session.v1';

const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createGuest(): SessionUser {
  return {
    uid: randomId('guest'),
    name: 'Visitante',
    avatarUrl: 'https://picsum.photos/seed/clipflow_guest/160/160',
    kind: 'guest',
    region: 'BR',
  };
}

function createMember(): SessionUser {
  return {
    uid: randomId('uid'),
    name: 'Você',
    avatarUrl: 'https://picsum.photos/seed/clipflow_me/160/160',
    kind: 'member',
    region: 'BR',
  };
}

type SessionContextValue = {
  ready: boolean;
  user: SessionUser | null;
  isGuest: boolean;
  /** `device_login`: entra sem conta. */
  continueAsGuest: () => Promise<void>;
  /** `bind_visitor_account`: promove o visitante a membro. */
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await storage.get(STORAGE_KEY);
        if (alive && raw) setUser(JSON.parse(raw) as SessionUser);
      } catch {
        // Sessão corrompida: recomeça como visitante.
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (next: SessionUser | null) => {
    setUser(next);
    if (next) await storage.set(STORAGE_KEY, JSON.stringify(next));
    else await storage.remove(STORAGE_KEY);
  }, []);

  const continueAsGuest = useCallback(async () => {
    await persist(createGuest());
  }, [persist]);

  const signIn = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await persist(createMember());
  }, [persist]);

  const signOut = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      user,
      isGuest: user?.kind === 'guest',
      continueAsGuest,
      signIn,
      signOut,
    }),
    [ready, user, continueAsGuest, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return ctx;
}
