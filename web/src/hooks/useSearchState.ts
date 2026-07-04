import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * 将筛选状态同步到 URL query string，刷新/分享不丢失搜索条件。
 * Usage: const [params, setParams] = useSearchState();
 *        setParams({ keyword: '张三', status: 'ACTIVE' });
 */
export function useSearchState<T extends Record<string, string | undefined>>(): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = Object.fromEntries(searchParams.entries()) as unknown as T;

  const update = useCallback((updates: Partial<T>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value as string);
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return [state, update];
}
