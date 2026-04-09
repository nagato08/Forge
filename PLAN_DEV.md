# 📋 Plan de Développement Détaillé — Forge Frontend

> **Note** : 2 thèmes = clair (`#F8FAFC` bg) + sombre (`#0D1117` bg)
> Stocké dans `useUIStore.theme` (localStorage)

---

## 🏗️ Phase 1 : Fondations & Setup

### 1.1 Configuration de base
- [ ] **package.json** : ajouter dépendances (axios, react-hook-form, zod, zustand, @tanstack/react-query, socket.io-client)
- [ ] **tsconfig.json** : activer strict mode, path aliases (`@/*` → `./`)
- [ ] **next.config.ts** : config Next.js 15 (API proxy si local)
- [ ] **postcss.config.mjs** + **tailwind.config.ts** : setup Tailwind + thème custom
- [ ] **.env.local** : `NEXT_PUBLIC_API_URL=http://localhost:4000`

### 1.2 Système de thèmes
- [ ] **lib/stores/ui.store.ts** : Zustand store pour `theme` (clair/sombre), `sidebarOpen`, etc.
  - Actions : `setTheme('light' | 'dark')`, `toggleSidebar()`, `setSidebarOpen(boolean)`
  - Persistance localStorage
- [ ] **app/globals.css** : variables CSS personnalisées par thème
  ```css
  :root[data-theme="light"] { --bg-primary: #F8FAFC; --text-primary: #0F172A; ... }
  :root[data-theme="dark"] { --bg-primary: #0D1117; --text-primary: #E6EDF3; ... }
  ```
- [ ] **app/layout.tsx** (root) : wrapper thème + hydration zustand

### 1.3 Client API & Interceptors
- [ ] **lib/api/client.ts** : instance Axios avec interceptors JWT (401 → logout)
- [ ] **lib/utils/api-error.ts** : fonction `getApiError()` pour extraction msgs erreur
- [ ] **lib/types/api-responses.ts** : types réponse standard backend

### 1.4 Store Auth
- [ ] **lib/stores/auth.store.ts** : Zustand
  - State : `user`, `token`, `role`, `isLoading`
  - Actions : `login()`, `logout()`, `setUser()`, `refreshToken()`
  - Persistance localStorage (`persist` middleware)

### 1.5 Types TS (miroir backend)
- [ ] **lib/types/user.types.ts** : `User`, `Role` enum
- [ ] **lib/types/project.types.ts** : `Project`, `ProjectStatus`
- [ ] **lib/types/task.types.ts** : `Task`, `TaskStatus`, `Priority` enum
- [ ] **lib/types/planning.types.ts** : `GanttData`, `PertNode`, etc.

---

## 🎨 Phase 2 : Composants UI réutilisables

### 2.1 Composants de base
> Dossier : `components/ui/`

- [ ] **Button.tsx** : bouton primaire/secondaire + loading state
  ```tsx
  // Props : variant, size, isLoading, disabled
  // États : default, hover (#1F6FEB), active (#1A5FCC), disabled
  ```
- [ ] **Input.tsx** : input avec label, error, placeholder
  - Focus : border primaire + léger ring
- [ ] **Textarea.tsx** : textarea avec label, error
- [ ] **Select.tsx** : select/dropdown customisé
- [ ] **Modal.tsx** : wrapper modal avec backdrop
- [ ] **Card.tsx** : card réutilisable
  - hover : surface-hover
  - selected : border primaire + léger tint
- [ ] **Alert.tsx** : info/warning/error/success
- [ ] **Badge.tsx** : badge status (priority, role, task status)
- [ ] **Spinner.tsx** : loader réutilisable
- [ ] **Tooltip.tsx** : tooltip accessible

### 2.2 Composants formulaires
- [ ] **Form.tsx** : wrapper React Hook Form + Context
- [ ] **FormField.tsx** : champ = label + input + error
- [ ] **FormError.tsx** : affichage erreur avec icon

### 2.3 Composants layout
> Dossier : `components/layout/`

- [ ] **Header.tsx** : header dashboard
  - Logo + titre page
  - Theme switcher (clair/sombre)
  - Breadcrumbs
- [ ] **Sidebar.tsx** : sidebar avec nav items
  - États actifs/hover selon `useUIStore` + route actuelle
  - Collapse sur mobile
- [ ] **NotificationBell.tsx** : cloche notifications (socket.io)
- [ ] **UserMenu.tsx** : dropdown user (profile, logout)
- [ ] **DashboardLayout.tsx** : layout page dashboard (header + sidebar + children)

---

## 🔐 Phase 3 : Authentification

### 3.1 Pages auth
> Dossier : `app/(auth)/`

- [ ] **login/page.tsx**
  - Form : email, password
  - Validation Zod
  - Submit → API `/auth/login` → `useAuthStore.login()`
  - Redirection `/dashboard` si connecté
  - Link vers register + reset-password
- [ ] **reset-password/page.tsx**
  - Form : email
  - Submit → API `/auth/request-reset-password`
  - Message confirmation
- [ ] **reset-password/[token]/page.tsx**
  - Form : password(min8), confirm password
  - Submit → API `/auth/reset-password` → redirection login

### 3.2 Hooks auth
- [ ] **lib/hooks/useAuth.ts** : wrapper `useAuthStore` + queries
  - `useLogin()`, `useRegister()`, `useLogout()`, `useProfile()`
- [ ] **lib/hooks/useProtectedRoute.ts** : vérifier auth + rôle

### 3.3 Middleware & protection routes
- [ ] **middleware.ts** : Next.js middleware
  - Redirection login si pas tokens
  - Redirection par rôle : ADMIN → `/dashboard/admin`, etc.
  - Validation JWT (optionnel : jwtVerify côté serveur)

---

## 📊 Phase 4 : Dashboard & Navigation

### 4.1 Pages dashboard
> Dossier : `app/(dashboard)/`

- [ ] **layout.tsx** : Layout racine avec Sidebar + Header + NotificationBell
- [ ] **dashboard/page.tsx** : redirection vers vue rôle
- [ ] **dashboard/admin/page.tsx** : stats admin (users, projects, tasks)
- [ ] **dashboard/project-manager/page.tsx** : mes projets + tâches assignées
- [ ] **dashboard/employee/page.tsx** : mes tâches + temps passé

### 4.2 Socket.io & temps réel
- [ ] **lib/socket/socket.client.ts** : Singleton socket.io
  - Connexion après login : `socket.connect(token:`Bearer ${token}`)`
  - Listeners : `message:new`, `notification:new`, `task:updated`
  - Déconnexion au logout
- [ ] **lib/hooks/useSocket.ts** : hook pour écouter events

---

## 🗂️ Phase 5 : Projets

### 5.1 Pages
> Dossier : `app/(dashboard)/projects/`

- [ ] **page.tsx** : liste projets (TanStack Query)
  - Filtre par rôle (PROJECT_MANAGER crée, EMPLOYEE rejoint)
  - Bouton "Nouveau projet" → modal création
  - Lien vers projet détail
- [ ] **[id]/layout.tsx** : layout projet avec onglets (kanban, gantt, pert, burndown, workload, chat, documents)
- [ ] **[id]/kanban/page.tsx** (Phase 6)
- [ ] **[id]/gantt/page.tsx** (Phase 7)
- [ ] **[id]/pert/page.tsx** (Phase 7)
- [ ] **[id]/burndown/page.tsx** (Phase 7)
- [ ] **[id]/workload/page.tsx** (Phase 7)
- [ ] **[id]/chat/page.tsx** (Phase 8)
- [ ] **[id]/documents/page.tsx** (Phase 9)

### 5.2 Composants projets
> Dossier : `components/projects/`

- [ ] **ProjectCard.tsx** : card projet affichant nom, desc, statut, membres
  - États hover/selected
- [ ] **ProjectModal.tsx** : modal création/édition
  - Form : name, description, objectives, priority, startDate, endDate
  - Validation Zod
- [ ] **ProjectMemberList.tsx** : liste membres + bouton ajouter/retirer
- [ ] **JoinProjectModal.tsx** : modal rejoindre (code ou token)

### 5.3 API & Hooks
- [ ] **lib/api/projects.api.ts** : fonctions API CRUD
  - `getProjects()`, `getProjectById(id)`, `createProject()`, `updateProject()`, `deleteProject()`
  - `addProjectMember()`, `removeProjectMember()`, `joinByCode()`, `joinByToken()`
- [ ] **lib/hooks/useProjects.ts** :
  - `useProjects()` → TanStack Query
  - `useProjectById(id)` → TanStack Query + enabled
  - `useCreateProject()` → useMutation
  - etc.

---

## 📝 Phase 6 : Tâches & Kanban

### 6.1 Pages
- [ ] **my-tasks/page.tsx** : mes tâches (TanStack Query)
  - Filtre status, priority
  - Lien vers tâche détail

### 6.2 Kanban
- [ ] **projects/[id]/kanban/page.tsx**
  - Board TODO | DOING | DONE
  - Drag-drop (react-beautiful-dnd ou dnd-kit)
  - Création tâche rapide
- [ ] **TaskCard.tsx** : card tâche affichant titre, priority, assignees, deadline
  - États hover/selected
  - Click → TaskDetailModal
- [ ] **TaskDetailModal.tsx** : modal détail tâche
  - Affichage complet + édition
  - Assignation userIds
  - Changement status
  - Commentaires
  - Dépendances (bloquée par)

### 6.3 Composants tâches
> Dossier : `components/tasks/`

- [ ] **TaskForm.tsx** : formulaire création/édition tâche
  - Fields : title, description, priority, deadline, projectId, startDate, endDate
  - PERT fields : optimisticDays, probableDays, pessimisticDays
  - Burndown field : storyPoints
  - Validation Zod
- [ ] **TaskCommentSection.tsx** : commentaires tâche
  - Liste commentaires
  - Formulaire ajout avec mentions
  - Suppression si proprio/ADMIN
- [ ] **TaskDependencies.tsx** : gestion dépendances
  - Visualisation bloqueurs
  - Ajout/suppression
- [ ] **AssigneeSelector.tsx** : sélecteur utilisateurs (multi-select)

### 6.4 API & Hooks
- [ ] **lib/api/tasks.api.ts** : fonctions API
- [ ] **lib/hooks/useTasks.ts** : `useTasks()`, `useTaskById()`, `useCreateTask()`, etc.

---

## 📈 Phase 7 : Planning (Gantt, PERT, Burndown)

### 7.1 Gantt
- [ ] **GanttChart.tsx** : chart Gantt (react-gantt-chart ou custom)
- [ ] **projects/[id]/gantt/page.tsx** : page Gantt
  - Fetch `/planning/projects/:projectId/gantt`
  - Timeline interactive
  - Édition dates inline

### 7.2 PERT
- [ ] **PertNetwork.tsx** : diagramme PERT (reactflow ou custom svg)
- [ ] **projects/[id]/pert/page.tsx** : page PERT
  - Fetch `/planning/projects/:projectId/pert`
  - Visualisation nodes/edges
  - Chemin critique en couleur critique

### 7.3 Burndown
- [ ] **BurndownChart.tsx** : chart brûlure (recharts ou chart.js)
- [ ] **projects/[id]/burndown/page.tsx** : page Burndown
  - Fetch `/planning/projects/:projectId/burndown`
  - Courbe idéale vs réelle
  - Sélecteur période

### 7.4 Workload
- [ ] **WorkloadChart.tsx** : chart charge utilisateurs
- [ ] **projects/[id]/workload/page.tsx**
  - Fetch `/planning/workload`
  - Groupement jour/semaine
  - Heatmap utilisateurs

### 7.5 API & Hooks
- [ ] **lib/api/planning.api.ts** : `getGantt()`, `getPert()`, `getBurndown()`, `getWorkload()`
- [ ] **lib/hooks/usePlanning.ts** : hooks TanStack Query

---

## 💬 Phase 8 : Chat & Messages

### 8.1 Pages & Composants
- [ ] **projects/[id]/chat/page.tsx** : page chat
- [ ] **ChatWindow.tsx** : zone messages
  - Fetch `/chat/project/:projectId`
  - Socket.io listener `message:new`
  - Auto-scroll dernier message
- [ ] **MessageInput.tsx** : input message + mentions
  - Form React Hook Form
  - Submit via API `/chat/project/:projectId`

### 8.2 API & Hooks
- [ ] **lib/api/chat.api.ts** : `getMessages()`, `sendMessage()`, `deleteMessage()`
- [ ] **lib/hooks/useChat.ts** : hooks + socket listeners

---

## 📄 Phase 9 : Documents

### 9.1 Pages & Composants
- [ ] **projects/[id]/documents/page.tsx** : page documents
- [ ] **DocumentList.tsx** : liste documents avec versions
  - Upload fichier (multipart)
  - Visualisation versions
  - Suppression
- [ ] **DocumentViewer.tsx** : viewer intégré (PDF, images)
- [ ] **DocumentCommentSection.tsx** : commentaires sur doc

### 9.2 API & Hooks
- [ ] **lib/api/documents.api.ts** : CRUD documents + versions + commentaires
- [ ] **lib/hooks/useDocuments.ts** : hooks TanStack Query

---

## ⏲️ Phase 10 : Time Tracking

### 10.1 Pages
- [ ] **time-tracking/page.tsx**
  - Bouton start/stop chrono
  - Historique entrées temps
  - Stats par projet/tâche
  - Entrée manuelle

### 10.2 Composants
- [ ] **TimeTracker.tsx** : affichage chrono actif
- [ ] **TimeEntryForm.tsx** : formulaire entrée manuelle (taskId, startTime, endTime)
- [ ] **TimeStats.tsx** : visualisation stats temps passé

### 10.3 API & Hooks
- [ ] **lib/api/time-entries.api.ts** : `startTimer()`, `stopTimer()`, `addManualEntry()`, `getStats()`
- [ ] **lib/hooks/useTimeTracking.ts**

---

## 🔔 Phase 11 : Notifications & Settings

### 11.1 Pages Settings
- [ ] **settings/profile/page.tsx**
  - Form édition profil (firstName, lastName, email, jobTitle, avatar)
  - Change password
- [ ] **settings/notifications/page.tsx**
  - Toggle email/realtime notifications
- [ ] **settings/company/page.tsx** (ADMIN seulement)
  - Edit companyName, logoUrl, primaryColor

### 11.2 Composants Notifications
- [ ] **NotificationCenter.tsx** : page notifications
  - Fetch `/notifications`
  - Filtre unread
  - Mark read / delete
  - Socket.io listener `notification:new`
- [ ] **NotificationBell.tsx** : cloche (badge unread count)

### 11.3 API & Hooks
- [ ] **lib/api/notifications.api.ts**
- [ ] **lib/api/auth.api.ts** : profile, settings
- [ ] **lib/hooks/useNotifications.ts** : + socket listeners

---

## 🤖 Phase 12 : IA (optionnel mais important)

### 12.1 Composants IA
- [ ] **AIAssistant.tsx** : chat IA (bouton coin bas droit ?)
  - Input message
  - Fetch `/ai/interpret` → suggestions
  - Bouton "Exécuter action"
- [ ] **AIActionWidget.tsx** : widget suggestion rapide

### 12.2 API & Hooks
- [ ] **lib/api/ai.api.ts** : `interpretMessage()`, `executeAction()`, `act()`, `analyze*()`
- [ ] **lib/hooks/useAI.ts**

---

## 🎨 Phase 13 : Deux thèmes (intégration complète)

### 13.1 Vérification globale
- [ ] Tester toutes les pages en clair et sombre
- [ ] Vérifier contraste texte/fond
- [ ] Tester transitions thème (localStorage persistence)
- [ ] Vérifier couleurs fonctionnelles (critique, succès, warning, info)

### 13.2 CSS Variables
- [ ] Remplacer couleurs hardcoded par variables CSS
- [ ] Assurer cohérence dans globals.css

---

## 🧪 Phase 14 : Polissage & Tests

- [ ] Animations transitions (theme switch, page navigation)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Accessibilité (a11y) : ARIA labels, focus states, keyboard nav
- [ ] Error boundaries
- [ ] Loading states partout
- [ ] Tests E2E (Cypress, Playwright)

---

## 🚀 Phase 15 : Déploiement & Optimisation

- [ ] Build production
- [ ] Env vars déploiement
- [ ] SEO basique
- [ ] Performance audit (Lighthouse)
- [ ] Monitoring erreurs (Sentry optionnel)

---

## 📌 Dépendances à installer (package.json)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "axios": "^1.6.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.22.0",
    "socket.io-client": "^4.7.0",
    "tailwindcss": "^3.4.0",
    "heroicons": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 📝 Notes de développement

- **Ordre recommandé** : Phase 1-3 (fondations) → Phase 4-5 (navigation) → Phase 6-7 (fonctionnalités) → Phase 8-12 (features avancées) → Phase 13-15 (finition)
- **Pair development** : une personne API client, une autre composants UI
- **TanStack Query** : `staleTime: 5min`, `gcTime: 10min` (ex: projects)
- **Zustand stores** : persistence localStorage → `persist` middleware
- **Socket.io** : authentification JWT dans événement connect, reconnect auto en cas déconnexion
- **Thème** : switch → rechargement de la page OU useEffect pour appliquer `data-theme` sur `<html>`
