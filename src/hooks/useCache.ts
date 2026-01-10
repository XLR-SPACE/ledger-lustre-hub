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

// Period selection persistence
const PERIOD_TYPE_KEY = "period_type_selection";
const PERIOD_CUSTOM_START_KEY = "period_custom_start";
const PERIOD_CUSTOM_END_KEY = "period_custom_end";

export type PeriodType = "all" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export interface PersistedPeriod {
  periodType: PeriodType;
  customStartDate?: string;
  customEndDate?: string;
}

export function getPersistedPeriod(): PersistedPeriod {
  try {
    const periodType = (localStorage.getItem(PERIOD_TYPE_KEY) as PeriodType) || "monthly";
    const customStartDate = localStorage.getItem(PERIOD_CUSTOM_START_KEY) || undefined;
    const customEndDate = localStorage.getItem(PERIOD_CUSTOM_END_KEY) || undefined;
    return { periodType, customStartDate, customEndDate };
  } catch {
    return { periodType: "monthly" };
  }
}

export function setPersistedPeriod(period: PersistedPeriod): void {
  try {
    localStorage.setItem(PERIOD_TYPE_KEY, period.periodType);
    if (period.customStartDate) {
      localStorage.setItem(PERIOD_CUSTOM_START_KEY, period.customStartDate);
    } else {
      localStorage.removeItem(PERIOD_CUSTOM_START_KEY);
    }
    if (period.customEndDate) {
      localStorage.setItem(PERIOD_CUSTOM_END_KEY, period.customEndDate);
    } else {
      localStorage.removeItem(PERIOD_CUSTOM_END_KEY);
    }
  } catch (error) {
    console.error("Failed to save period selection:", error);
  }
}

// Category cache helpers
const CATEGORY_CACHE_KEY_PREFIX = "category_cache_";

export function getCachedCategories<T>(walletId: number): T | null {
  try {
    const key = `${CATEGORY_CACHE_KEY_PREFIX}${walletId}_${CACHE_VERSION}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      if (entry.version === CACHE_VERSION) {
        return entry.data;
      }
    }
  } catch (e) {
    console.error("Category cache read error:", e);
  }
  return null;
}

export function setCachedCategories<T>(walletId: number, data: T): void {
  try {
    const key = `${CATEGORY_CACHE_KEY_PREFIX}${walletId}_${CACHE_VERSION}`;
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.error("Category cache write error:", e);
  }
}

export function invalidateCategoryCache(walletId: number): void {
  try {
    const key = `${CATEGORY_CACHE_KEY_PREFIX}${walletId}_${CACHE_VERSION}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Category cache invalidate error:", e);
  }
}

// Default wallet persistence
const DEFAULT_WALLET_KEY = "default_wallet_id";

export function getDefaultWalletId(): number | null {
  try {
    const id = localStorage.getItem(DEFAULT_WALLET_KEY);
    return id ? parseInt(id, 10) : null;
  } catch {
    return null;
  }
}

export function setDefaultWalletId(walletId: number): void {
  try {
    localStorage.setItem(DEFAULT_WALLET_KEY, walletId.toString());
  } catch (error) {
    console.error("Failed to save default wallet:", error);
  }
}
