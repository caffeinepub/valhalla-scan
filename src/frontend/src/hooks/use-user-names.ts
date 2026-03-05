import { getUser } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

// Module-level cache so it persists across re-renders and component mounts
const userNameCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

async function fetchUserName(userId: string): Promise<string> {
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId)!;
  }
  if (pendingFetches.has(userId)) {
    return pendingFetches.get(userId)!;
  }

  const promise = getUser(userId)
    .then((profile) => {
      const name =
        profile.username ||
        profile.name ||
        `${userId.slice(0, 6)}...${userId.slice(-4)}`;
      userNameCache.set(userId, name);
      return name;
    })
    .catch(() => {
      // On error, cache truncated ID so we don't retry endlessly
      const fallback = `${userId.slice(0, 6)}...${userId.slice(-4)}`;
      userNameCache.set(userId, fallback);
      return fallback;
    })
    .finally(() => {
      pendingFetches.delete(userId);
    });

  pendingFetches.set(userId, promise);
  return promise;
}

/**
 * Batch-fetch and cache usernames for a list of user IDs.
 * Returns a Map<userId, displayName>.
 */
export function useUserNames(userIds: string[]): Map<string, string> {
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const fetchedRef = useRef<Set<string>>(new Set());

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional join-based key to avoid array reference instability
  useEffect(() => {
    const unique = [...new Set(userIds.filter(Boolean))];
    const toFetch = unique.filter((id) => !userNameCache.has(id));

    if (toFetch.length === 0) {
      // All already cached — just hydrate state
      const result = new Map<string, string>();
      for (const id of unique) {
        const cached = userNameCache.get(id);
        if (cached) result.set(id, cached);
      }
      setNames(result);
      return;
    }

    // Mark as being fetched so we don't re-trigger
    const newlyFetching = toFetch.filter((id) => !fetchedRef.current.has(id));
    for (const id of newlyFetching) fetchedRef.current.add(id);

    Promise.all(
      unique.map(async (id) => {
        const name = await fetchUserName(id);
        return [id, name] as [string, string];
      }),
    ).then((entries) => {
      setNames(new Map(entries));
    });
  }, [userIds.join(",")]);

  return names;
}
