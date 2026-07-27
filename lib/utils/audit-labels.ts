import { AuditActionDescriptor, AuditLog } from '@/lib/types/audit.types';

/**
 * Traduction des verbes techniques en langage clair.
 *
 * Le journal stocke `project.member.role.update` ; un lecteur veut lire
 * « Changement de rôle d'un membre ». Cette table est le seul endroit où la
 * correspondance existe.
 */
interface ActionDescriptor {
  label: string;
  /** Explication d'une phrase, affichée dans le panneau de détail. */
  description: string;
  /** Gravité perçue : oriente la couleur et attire l'œil sur l'irréversible. */
  severity: 'critical' | 'warning' | 'info';
  category: string;
}

export const AUDIT_ACTIONS: Record<string, ActionDescriptor> = {
  'project.delete': {
    label: 'Suppression de projet',
    description:
      'Le projet a été supprimé. La suppression est logique : les données restent en base mais le projet disparaît de l’application.',
    severity: 'critical',
    category: 'Projet',
  },
  'project.update': {
    label: 'Modification de projet',
    description:
      'Les informations du projet ont été modifiées (nom, dates, priorité ou statut).',
    severity: 'info',
    category: 'Projet',
  },
  'project.transfer_ownership': {
    label: 'Transfert de propriété',
    description:
      'La propriété du projet a changé de main. L’ancien propriétaire a été rétrogradé administrateur.',
    severity: 'critical',
    category: 'Projet',
  },
  'project.member.add': {
    label: 'Ajout d’un membre',
    description: 'Un utilisateur a été ajouté au projet avec un rôle donné.',
    severity: 'info',
    category: 'Membres',
  },
  'project.member.remove': {
    label: 'Retrait d’un membre',
    description: 'Un utilisateur a été retiré du projet et perd tout accès.',
    severity: 'warning',
    category: 'Membres',
  },
  'project.invite.send': {
    label: 'Invitation envoyée',
    description:
      'Le lien d’invitation du projet a été envoyé par email à une adresse.',
    severity: 'info',
    category: 'Membres',
  },
  'project.member.join': {
    label: 'Adhésion au projet',
    description:
      'Un utilisateur a rejoint le projet lui-même, via un code ou un lien d’invitation.',
    severity: 'info',
    category: 'Membres',
  },
  'project.member.role.update': {
    label: 'Changement de rôle',
    description:
      'Le rôle d’un membre dans le projet a été modifié, ce qui change ses permissions.',
    severity: 'warning',
    category: 'Membres',
  },
  'task.create': {
    label: 'Création de tâche',
    description: 'Une tâche a été ajoutée au projet.',
    severity: 'info',
    category: 'Tâches',
  },
  'task.update': {
    label: 'Modification de tâche',
    description:
      'Le contenu d’une tâche a été modifié (titre, description, dates, estimations).',
    severity: 'info',
    category: 'Tâches',
  },
  'task.status.update': {
    label: 'Changement de statut',
    description:
      'Une tâche a changé d’étape sur le tableau (à faire, en cours, terminé).',
    severity: 'info',
    category: 'Tâches',
  },
  'task.delete': {
    label: 'Suppression de tâche',
    description: 'Une tâche a été supprimée du projet.',
    severity: 'warning',
    category: 'Tâches',
  },
  'task.assign': {
    label: 'Assignation de tâche',
    description:
      'Un ou plusieurs utilisateurs ont été assignés à une tâche, ce qui leur en donne la charge et le droit de la modifier.',
    severity: 'info',
    category: 'Tâches',
  },
  'task.unassign': {
    label: 'Désassignation de tâche',
    description:
      'Un utilisateur a été retiré des assignés : il perd le droit de modifier cette tâche.',
    severity: 'warning',
    category: 'Tâches',
  },
  'task.dependency.create': {
    label: 'Ajout de dépendance',
    description:
      'Un lien de blocage a été créé entre deux tâches : la tâche bloquée ne peut plus démarrer avant l’autre.',
    severity: 'info',
    category: 'Tâches',
  },
  'task.dependency.delete': {
    label: 'Suppression de dépendance',
    description:
      'Un lien de blocage entre deux tâches a été retiré, ce qui débloque le planning.',
    severity: 'warning',
    category: 'Tâches',
  },
  'document.create': {
    label: 'Création de document',
    description: 'Un document a été créé dans le projet.',
    severity: 'info',
    category: 'Documents',
  },
  'document.version.upload': {
    label: 'Dépôt de version',
    description:
      'Un fichier a été déposé comme nouvelle version d’un document existant.',
    severity: 'info',
    category: 'Documents',
  },
  'document.update': {
    label: 'Modification de document',
    description: 'Les métadonnées d’un document ont été modifiées.',
    severity: 'info',
    category: 'Documents',
  },
  'document.delete': {
    label: 'Suppression de document',
    description:
      'Un document et son historique de versions ont été supprimés du projet.',
    severity: 'warning',
    category: 'Documents',
  },
  'user.delete': {
    label: 'Suppression de compte',
    description:
      'Un compte utilisateur a été supprimé. Ses actions passées restent tracées dans ce journal.',
    severity: 'critical',
    category: 'Comptes',
  },
  'user.create_by_admin': {
    label: 'Création de compte',
    description:
      'Un administrateur a créé un compte. Le mot de passe a été généré et envoyé par email.',
    severity: 'info',
    category: 'Comptes',
  },
};

/**
 * Catalogue transmis par le serveur, qui fait autorité.
 *
 * La table locale ci-dessus ne sert que de repli : tant que le catalogue n'est
 * pas chargé — ou pour une action que cette version du front ne connaît pas
 * encore — l'affichage reste correct au lieu de montrer du code brut.
 */
let serverCatalog: Map<string, AuditActionDescriptor> | null = null;

export function setAuditCatalog(catalog: AuditActionDescriptor[] | undefined) {
  if (!catalog?.length) return;
  serverCatalog = new Map(catalog.map((entry) => [entry.action, entry]));
}

/** Descripteur d'une action, avec repli lisible sur les verbes inconnus. */
export function describeAction(action: string): ActionDescriptor {
  const fromServer = serverCatalog?.get(action);
  if (fromServer) return fromServer;

  const known = AUDIT_ACTIONS[action];
  if (known) return known;

  // Repli : `domaine.sous_domaine.verbe` → « Domaine sous domaine verbe ».
  const readable = action.replace(/[._]/g, ' ');
  return {
    label: readable.charAt(0).toUpperCase() + readable.slice(1),
    description: 'Action enregistrée par le système.',
    severity: 'info',
    category: 'Autre',
  };
}

/** Nom affichable de l'auteur, robuste à la suppression du compte. */
export function actorName(log: AuditLog): string {
  if (log.user) return `${log.user.firstName} ${log.user.lastName}`;
  if (log.userEmail) return log.userEmail;
  return 'Compte supprimé';
}

/** Libellés lisibles des types de cible. */
const TARGET_TYPE_LABELS: Record<string, string> = {
  Project: 'Projet',
  Task: 'Tâche',
  User: 'Utilisateur',
  Document: 'Document',
};

export function targetTypeLabel(targetType: string | null): string {
  if (!targetType) return '—';
  return TARGET_TYPE_LABELS[targetType] ?? targetType;
}

/** Libellés des clés de métadonnées, pour un affichage en français. */
const METADATA_LABELS: Record<string, string> = {
  memberId: 'Membre concerné',
  newRole: 'Nouveau rôle',
  role: 'Rôle',
  newOwnerId: 'Nouveau propriétaire',
  status: 'Statut',
  fields: 'Champs modifiés',
  reassignTo: 'Réattribué à',
  email: 'Email',
  title: 'Titre',
  name: 'Nom',
  projectId: 'Projet',
  priority: 'Priorité',
  assignedUserIds: 'Utilisateurs assignés',
  blockedTaskId: 'Tâche bloquée',
  fileName: 'Nom du fichier',
  fileSize: 'Taille',
  mimeType: 'Type de fichier',
};

/** Formate une taille en octets de façon lisible. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function metadataLabel(key: string): string {
  return METADATA_LABELS[key] ?? key;
}

/** Rend une valeur de métadonnée lisible, quel que soit son type JSON. */
export function metadataValue(value: unknown, key?: string): string {
  if (value === null || value === undefined) return '—';
  // Les tailles de fichier sont stockées en octets bruts : illisibles telles quelles.
  if (key === 'fileSize' && typeof value === 'number') {
    return formatBytes(value);
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Condense un User-Agent en « Navigateur Version · Système ».
 *
 * La chaîne brute est illisible et n'apporte rien tel quel ; ce qui compte
 * dans une enquête est de distinguer un navigateur d'un mobile ou d'un
 * script. La chaîne complète reste consultable au survol.
 */
export function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) return '—';

  const browsers: [RegExp, string][] = [
    // Edge et Opera doivent passer avant Chrome : leur UA contient « Chrome ».
    [/Edg\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Firefox\/(\d+)/, 'Firefox'],
    // Safari n'expose pas son numéro dans « Safari/… » : on lit « Version/… ».
    [/Version\/(\d+).*Safari/, 'Safari'],
  ];

  let browser = 'Navigateur inconnu';
  for (const [pattern, name] of browsers) {
    const match = userAgent.match(pattern);
    if (match) {
      browser = `${name} ${match[1]}`;
      break;
    }
  }

  const systems: [RegExp, string][] = [
    [/Windows NT 10/, 'Windows'],
    [/Windows/, 'Windows'],
    [/Android/, 'Android'],
    // iPhone/iPad avant « Mac OS X » : leur UA contient « like Mac OS X ».
    [/iPhone|iPad/, 'iOS'],
    [/Mac OS X/, 'macOS'],
    [/Linux/, 'Linux'],
  ];

  const system = systems.find(([pattern]) => pattern.test(userAgent))?.[1];

  return system ? `${browser} · ${system}` : browser;
}

/** Date complète en français, ex. « 27 juillet 2026 à 08:14:32 ». */
export function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Date courte pour le tableau, ex. « 27/07/2026 08:14 ». */
export function formatAuditDateShort(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ancienneté relative, ex. « il y a 3 h ». */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 31) return `il y a ${days} j`;

  return formatAuditDateShort(iso);
}
