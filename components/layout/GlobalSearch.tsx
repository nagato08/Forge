'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/lib/hooks/useSearch';
import {
  SearchResult,
  SearchResultType,
} from '@/lib/types/planning.types';
import {
  FileText,
  FolderOpen,
  CheckSquare,
  Search,
  User,
  X,
} from 'lucide-react';

const TYPE_LABELS: Record<SearchResultType, string> = {
  project: 'Projets',
  task: 'Tâches',
  document: 'Documents',
  user: 'Personnes',
};

const TYPE_ICONS: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  project: FolderOpen,
  task: CheckSquare,
  document: FileText,
  user: User,
};

/** Ordre d'affichage des groupes, du plus au moins probable. */
const TYPE_ORDER: SearchResultType[] = ['project', 'task', 'document', 'user'];

/**
 * Recherche transverse accessible depuis l'en-tête.
 *
 * Les résultats sont groupés par nature et navigables au clavier :
 * flèches pour parcourir, Entrée pour ouvrir, Échap pour fermer.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, isTooShort } = useGlobalSearch(query);

  // Les résultats sont regroupés mais parcourus comme une liste unique :
  // la navigation clavier doit ignorer les en-têtes de groupe.
  const flatResults: SearchResult[] = TYPE_ORDER.flatMap((type) =>
    (data?.results ?? []).filter((r) => r.type === type)
  );

  // Clic à l'extérieur : on referme.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourci global : Ctrl/Cmd + K place le curseur dans le champ.
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const goTo = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(
        (i) => (i - 1 + flatResults.length) % flatResults.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatResults[highlighted];
      if (target) goTo(target);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher…  (Ctrl+K)"
          aria-label="Recherche globale"
          className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-bg-surface text-text-primary placeholder-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-bg-surface border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isTooShort ? (
            <p className="p-3 text-sm text-text-secondary">
              Saisissez au moins 2 caractères.
            </p>
          ) : isFetching && !data ? (
            <p className="p-3 text-sm text-text-secondary">Recherche…</p>
          ) : flatResults.length === 0 ? (
            <p className="p-3 text-sm text-text-secondary">
              Aucun résultat pour «&nbsp;{query.trim()}&nbsp;»
            </p>
          ) : (
            TYPE_ORDER.map((type) => {
              const group = (data?.results ?? []).filter((r) => r.type === type);
              if (group.length === 0) return null;

              const Icon = TYPE_ICONS[type];

              return (
                <div key={type}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-weak">
                    {TYPE_LABELS[type]}
                  </p>
                  {group.map((result) => {
                    const index = flatResults.indexOf(result);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => goTo(result)}
                        onMouseEnter={() => setHighlighted(index)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                          index === highlighted
                            ? 'bg-primary/10'
                            : 'hover:bg-bg-surface-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-text-secondary shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm text-text-primary truncate">
                            {result.title}
                          </span>
                          {result.subtitle && (
                            <span className="block text-xs text-text-secondary truncate">
                              {result.subtitle}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
