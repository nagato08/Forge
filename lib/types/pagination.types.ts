/**
 * Réponse paginée renvoyée par l'API.
 *
 * Contrat unique côté serveur — journal d'audit, notifications, messages —
 * pour qu'un écran qui sait consommer l'un sache consommer les autres.
 */
export interface Paginated<T> {
  items: T[];
  /** Total sans pagination, pour afficher « 50 sur 1 240 ». */
  total: number;
  skip: number;
  take: number;
}
