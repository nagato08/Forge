# Forge — Plateforme de gestion de projets

> Application web full-stack de gestion de projets d'entreprise : planification, collaboration temps réel et pilotage visuel, réunis dans un seul outil.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)

Ce dépôt contient le **frontend web**. Il consomme une API **NestJS** séparée (authentification JWT, WebSocket, base PostgreSQL).

---

## Aperçu

<!-- Remplacez ces liens par vos captures réelles dans docs/screenshots/ -->
<!--
![Tableau de bord](docs/screenshots/dashboard.png)
![Kanban](docs/screenshots/kanban.png)
![Diagramme de Gantt](docs/screenshots/gantt.png)
-->

> _Captures d'écran à ajouter dans `docs/screenshots/`._

---

## Fonctionnalités

### Gestion de projets & tâches
- Projets avec rôles (Administrateur, Chef de projet, Employé) et interfaces adaptées par rôle
- Adhésion à un projet par **code** ou **lien d'invitation**
- Tableau **Kanban** en glisser-déposer (`@dnd-kit`)
- Tâches détaillées : sous-tâches, dépendances, assignations multiples, commentaires, `@mentions`, priorités

### Planification & pilotage
- **Diagramme de Gantt** (planning dans le temps)
- **Réseau PERT** avec calcul du **chemin critique** (`@xyflow/react`)
- **Burndown chart** de suivi de rythme (`recharts`)
- Vue de **charge de travail** par membre et par période
- Tableaux de bord avec statistiques (donut de statuts, matrice d'Eisenhower)

### Collaboration
- **Messagerie temps réel** par projet (Socket.IO)
- **Notifications** en temps réel (cloche + WebSocket) avec préférences configurables
- **Gestion documentaire versionnée** (historique de versions, commentaires, upload)

### Productivité
- **Suivi du temps** (chronomètre start/stop ou saisie manuelle) avec statistiques par tâche et par projet
- **Assistant IA** : création et assignation de tâches en langage naturel, analyse de planning
- **Export** des données en **Excel** (`exceljs`) et **PDF** (`jspdf`)

---

## Stack technique

| Domaine | Technologie |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styles | Tailwind CSS v4 (CSS-first, tokens de design) |
| Icônes | lucide-react |
| État serveur | TanStack Query v5 |
| État client | Zustand (auth, UI) |
| Formulaires | React Hook Form + Zod |
| Temps réel | socket.io-client |
| HTTP | Axios (intercepteurs JWT) |
| Graphiques | Recharts, @xyflow/react (PERT) |
| Observabilité | Sentry |
| Déploiement | Docker (build standalone) + CI/CD GitHub Actions |

**Backend** : API REST NestJS + PostgreSQL, authentification JWT, passerelle WebSocket _(dépôt séparé)_.

---

## Architecture

```
app/                     # App Router (routes)
  (auth)/                # Login, register, reset password
  (dashboard)/           # Espace applicatif (sidebar + header)
    dashboard/           # Vues par rôle (admin / manager / employé)
    projects/[id]/       # Kanban, Gantt, PERT, Burndown, Workload, Chat, Documents
    my-tasks/  time-tracking/  settings/  ai/
components/              # UI réutilisable, layout, features
lib/
  api/                   # Clients API (agnostiques React)
  hooks/                 # Hooks TanStack Query
  stores/                # Zustand
  socket/                # Singleton Socket.IO
  types/                 # Types miroir du backend (agnostiques React)
  utils/                 # Helpers (auth, erreurs, dates)
proxy.ts                 # Protection de routes selon le rôle (convention Next 16)
```

**Choix d'architecture notables :**
- `lib/types/` et `lib/api/` sont **agnostiques de React** — pensés pour être extraits en package partagé lors d'un futur portage mobile.
- Séparation stricte logique métier (`lib/`) / présentation (`components/`, `app/`).
- Protection des routes et redirection par rôle centralisées dans `proxy.ts`.

---

## Démarrage

**Prérequis :** Node.js 20+, une instance de l'API backend NestJS accessible.

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local   # puis renseigner l'URL de l'API
```

`.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
# 3. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Analyse ESLint |
| `npm run typecheck` | Vérification des types (`tsc --noEmit`) |

---

## Déploiement

Le projet est conteneurisé (`Dockerfile`, build Next.js `standalone`) et déployé via un pipeline GitHub Actions. Un endpoint de _health check_ est exposé sur `/api/health`.

---

## Limitations connues & axes d'évolution

Ce projet est un **MVP fonctionnel de bout en bout**. Les éléments suivants sont volontairement hors périmètre à ce stade et constituent la feuille de route vers un produit d'entreprise :

- **Sécurité** : refresh tokens rotatifs, authentification à deux facteurs (MFA), SSO (SAML/OIDC)
- **Multi-tenant** : isolation par organisation/workspace (actuellement mono-entreprise)
- **Permissions** : rôles granulaires par projet, journal d'audit
- **Qualité** : couverture de tests (unitaires, intégration, e2e)
- **Internationalisation** (i18n)

_Ce découpage assumé illustre la distinction entre une application « qui fonctionne » et une application « prête pour la production d'entreprise »._

---

## À propos

Projet personnel réalisé pour démontrer la conception d'une application full-stack complète : architecture, temps réel, visualisation de données et intégration IA.
