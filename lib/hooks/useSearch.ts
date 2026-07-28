'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search.api';

/** En dessous, le serveur renvoie un résultat vide de toute façon. */
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Recherche globale avec anti-rebond.
 *
 * On attend une pause dans la frappe avant d'interroger le serveur : sans
 * cela, chaque caractère déclencherait une requête qui serait périmée avant
 * même d'arriver.
 */
export function useGlobalSearch(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchApi.search(trimmed),
    enabled,
    staleTime: 30 * 1000,
  });

  return {
    ...result,
    /** Vrai dès la saisie, avant même que la requête ne parte. */
    isTyping: query.trim() !== trimmed,
    isTooShort: query.trim().length > 0 && !enabled,
  };
}
