import { useState, useEffect, useCallback, useRef } from "react";

const CACHE_VERSION = "v1";
const SYNC_INTERVAL = 60000; // 1 minute

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

function getCacheKey(key: string, walletId?: number): string {
  return walletId ? `cache_${key}_${walletId}_${CACHE_VERSION}` : `cache_${key}_${CACHE_VERSION}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      if (entry.version === CACHE_VERSION) {
        return entry.data;
      }
    }
  } catch (error) {
    console.error("Cache read error:", error);
  }
  return null;
}

function setToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  walletId?: number,
  autoSync = true
) {
  const cacheKey = getCacheKey(key, walletId);
  const [data, setData] = useState<T | null>(() => getFromCache<T>(cacheKey));
  const [isLoading, setIsLoading] = useState(!data);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      throw error;
    }
  }, [cacheKey, fetchFn, key]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!data) {
      load();
    }

    if (autoSync) {
      syncIntervalRef.current = setInterval(refresh, SYNC_INTERVAL);
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [cacheKey, autoSync, load, refresh, data]);

  const invalidate = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setData(null);
  }, [cacheKey]);

  return { data, isLoading, refresh, invalidate };
}

// Last transaction datetime helper
const LAST_TRANSACTION_TIME_KEY = "last_transaction_time";

export function getLastTransactionTime(): string {
  try {
    return localStorage.getItem(LAST_TRANSACTION_TIME_KEY) || "";
  } catch {
    return "";
  }
}

export function setLastTransactionTime(time: string): void {
  try {
    localStorage.setItem(LAST_TRANSACTION_TIME_KEY, time);
  } catch (error) {
    console.error("Failed to save last transaction time:", error);
  }
}
