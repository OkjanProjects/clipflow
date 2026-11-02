import { useCallback, useEffect, useRef, useState } from 'react';

import { getFeed } from '@/lib/api';
import type { Template } from '@/lib/types';

/**
 * Feed com paginação por cursor — o mesmo contrato do
 * `POST /lv/v2/replicate/get_collection_templates` ({ cursor, has_more }).
 */
export function useFeed(params: { collectionId?: string; query?: string }) {
  const { collectionId, query } = params;
  const key = `${collectionId ?? ''}|${query ?? ''}`;

  const [items, setItems] = useState<Template[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const busy = useRef(false);

  const load = useCallback(
    async (mode: 'reset' | 'more') => {
      if (busy.current && mode === 'more') return;
      busy.current = true;

      const id = ++requestId.current;
      if (mode === 'reset') {
        setLoading(true);
        setError(null);
      }

      try {
        const page = await getFeed({
          collectionId,
          query,
          cursor: mode === 'reset' ? null : cursor,
        });
        if (id !== requestId.current) return;

        setItems((prev) => (mode === 'reset' ? page.items : [...prev, ...page.items]));
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Não foi possível carregar o feed');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
        busy.current = false;
      }
    },
    // `cursor` de propósito fora das deps: quem chama `loadMore` já está no
    // estado atual, e recriar a função a cada página causaria loop no efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collectionId, query]
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    void load('reset');
  }, [key, load]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || busy.current) return;
    void load('more');
  }, [hasMore, loading, load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setCursor(null);
    void load('reset');
  }, [load]);

  return { items, loading, refreshing, hasMore, error, loadMore, refresh, reload: () => load('reset') };
}
