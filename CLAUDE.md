@AGENTS.md

# Forge — Frontend Web

App de gestion de projets. Frontend web de l'API backend NestJS (port 4000).

---

## Stack

- **Framework** : Next.js 15, App Router, TypeScript
- **UI** :Tailwind CSS (pas shadcn) utilise le plugin frontend-design@claude-plugins-official  et le marketplace GitHub: anthropics/claude-code
- **State serveur** : TanStack Query v5
- **State client** : Zustand (auth, UI globale)
- **Formulaires** : React Hook Form + Zod
- **WebSocket** : socket.io-client (chat/notifications temps réel)
- **HTTP** : Axios avec interceptors JWT

---

## Backend (API NestJS)

- URL : `http://localhost:4000`
- Swagger : `http://localhost:4000/swagger`
- Auth : JWT (durée 30 jours), stocké en localStorage via Zustand
- Rôles : `ADMIN`, `PROJECT_MANAGER`, `EMPLOYEE`
- WebSocket : socket.io, authentifié avec le JWT

### Enums (à reproduire côté frontend)
```ts
enum Priority { LOW, MEDIUM, HIGH, CRITICAL }
enum Role { ADMIN, PROJECT_MANAGER, EMPLOYEE }
```

### Routes API complètes (avec DTOs)

#### AUTH `/auth`
```
POST /auth/register
  body: { firstName, lastName, email, password(min8), role: Role, department: Department, jobTitle?, avatar? }
  res:  { user, token }

POST /auth/login
  body: { email, password }
  res:  { user, token }

GET  /auth/profile                           🔒 JWT
  res: User

GET  /auth/users                             🔒 ADMIN
  res: User[]

DELETE /auth/:id                             🔒 ADMIN
  params: id

POST /auth/request-reset-password
  body: { email }
  res:  { message, token }

GET  /auth/verify-reset-password-token
  query: token
  res:  { valid: boolean }

POST /auth/reset-password
  body: { token, password(min8) }
```

#### PROJECTS `/projects`
```
POST   /projects                             🔒 JWT (ADMIN | PROJECT_MANAGER)
  body: { name, description?, objectives?, priority: Priority, status?: ProjectStatus, startDate, endDate? }
  res:  Project

GET    /projects/my-projects                 🔒 JWT
  res: Project[]

GET    /projects/:id                         🔒 JWT
  res: Project (full details)

PATCH  /projects/:id                         🔒 JWT
  body: { name?, description?, objectives?, priority?, status?, startDate?, endDate? }
  res:  Project

POST   /projects/:id/members                 🔒 JWT
  body: { userId }

DELETE /projects/:id/members                 🔒 JWT
  body: { userId }

POST   /projects/join/code                   🔒 JWT
  body: { projectCode }

POST   /projects/join/token                  🔒 JWT
  body: { inviteToken }

PATCH  /projects/:id/regenerate-token        🔒 JWT
  res:  Project (nouveau token)

DELETE /projects/:id                         🔒 JWT (soft delete)
```

#### TASKS `/tasks`
```
POST   /tasks                                🔒 JWT
  body: {
    title, description?, priority: Priority, deadline?, projectId,
    startDate?, endDate?,                        // Gantt
    optimisticDays?, probableDays?, pessimisticDays?,  // PERT
    storyPoints?,                                // Burndown
    parentId?, assignedUserIds?: string[]
  }
  res: Task

GET    /tasks/project/:projectId             🔒 JWT
  res: Task[] (Kanban)

GET    /tasks/my-tasks                       🔒 JWT
  res: Task[]

GET    /tasks/:id                            🔒 JWT
  res: Task (full)

PATCH  /tasks/:id                            🔒 JWT
  body: (même champs que POST, tous optionnels)
  res:  Task

DELETE /tasks/:id                            🔒 JWT

PATCH  /tasks/:id/status                     🔒 JWT
  body: { status: TaskStatus }   // TODO | DOING | DONE
  res:  Task

POST   /tasks/:id/assign                     🔒 JWT
  body: { userIds: string[] }
  res:  Task

DELETE /tasks/:id/assign/:userId             🔒 JWT

POST   /tasks/:id/dependencies               🔒 JWT
  body: { blockedTaskId }        // :id bloque blockedTaskId

DELETE /tasks/:id/dependencies/:blockedTaskId 🔒 JWT

POST   /tasks/:id/comments                   🔒 JWT
  body: { content, mentions?: string[] }
  res:  Comment

DELETE /tasks/comments/:commentId            🔒 JWT
```

#### PLANNING `/planning`
```
GET  /planning/projects/:projectId/gantt                   🔒 JWT
  res: tasks[] avec startDate/endDate

GET  /planning/projects/:projectId/pert                    🔒 JWT
  res: { nodes, edges, criticalPath }

GET  /planning/projects/:projectId/burndown                🔒 JWT
  query: startDate?, endDate?
  res:  { ideal[], actual[] }

GET  /planning/projects/:projectId/dashboard/status-donut  🔒 JWT
  res: { TODO, DOING, DONE }  (counts)

GET  /planning/projects/:projectId/dashboard/eisenhower    🔒 JWT
  res: { urgent_important[], urgent_not_important[], not_urgent_important[], not_urgent_not_important[] }

GET  /planning/workload                                    🔒 JWT
  query: startDate(req), endDate(req), projectId?, groupBy?: 'day'|'week'
  res:  workload par user/période
```

#### CHAT `/chat`
```
POST /chat/project/:projectId                🔒 JWT
  body: { content(min1) }
  res:  Message

GET  /chat/project/:projectId                🔒 JWT
  res: Message[]
```

#### MESSAGES `/messages`
```
POST   /messages/project/:projectId          🔒 JWT
  body: { content, mentions?: string[] }
  res:  Message

GET    /messages/project/:projectId          🔒 JWT
  res: Message[]

GET    /messages/:id                         🔒 JWT
  res: Message

DELETE /messages/:id                         🔒 JWT
```

#### DOCUMENTS `/documents`
```
POST   /documents                            🔒 JWT
  body: { name, projectId }
  res:  Document

POST   /documents/:id/versions               🔒 JWT
  body: multipart/form-data — file: File
  res:  Document (avec nouvelle version)

GET    /documents/project/:projectId         🔒 JWT
  res: Document[]

GET    /documents/my-documents               🔒 JWT
  res: Document[]

GET    /documents/:id                        🔒 JWT
  res: Document (avec versions)

PATCH  /documents/:id                        🔒 JWT
  body: { name? }
  res:  Document

DELETE /documents/:id                        🔒 JWT

GET    /documents/:id/versions               🔒 JWT
  res: Version[]

GET    /documents/:id/versions/:version      🔒 JWT
  params: version (integer)
  res: Version

POST   /documents/:id/comments               🔒 JWT
  body: { content }
  res:  DocumentComment

DELETE /documents/comments/:commentId        🔒 JWT
```

#### NOTIFICATIONS `/notifications`
```
POST   /notifications                        🔒 JWT
  body: { type: NotifType, content, userId }
  // NotifType: TASK_ASSIGNED | TASK_STATUS_CHANGED | TASK_COMMENT |
  //            DOCUMENT_UPLOADED | DOCUMENT_COMMENT | PROJECT_MESSAGE |
  //            PROJECT_MEMBER_ADDED | DEADLINE_APPROACHING | DEADLINE_PASSED
  res:  Notification

GET    /notifications                        🔒 JWT
  query: unreadOnly?: 'true'|'false'
  res:  Notification[]

GET    /notifications/unread-count           🔒 JWT
  res: { count: number }

PATCH  /notifications/:id/read              🔒 JWT
PATCH  /notifications/read-all             🔒 JWT
DELETE /notifications/:id                   🔒 JWT
```

#### NOTIFICATION SETTINGS `/notification-settings`
```
GET   /notification-settings                 🔒 JWT
  res: { email: boolean, realtime: boolean }

PATCH /notification-settings                 🔒 JWT
  body: { email?: boolean, realtime?: boolean }

GET   /notification-settings/:userId         🔒 ADMIN
```

#### TIME ENTRIES `/time-entries`
```
POST /time-entries/start                     🔒 JWT
  body: { taskId }
  res:  TimeEntry (active)

POST /time-entries/stop                      🔒 JWT
  res: TimeEntry (arrêté)

GET  /time-entries/active                    🔒 JWT
  res: TimeEntry | null

POST /time-entries/manual                    🔒 JWT
  body: { taskId, startTime, endTime?, duration?(minutes) }
  res:  TimeEntry

GET  /time-entries/my-entries               🔒 JWT
  query: taskId?, projectId?
  res:  TimeEntry[]

GET  /time-entries/my-stats                 🔒 JWT
  query: projectId?
  res:  { totalMinutes, byTask[], byProject[] }

GET  /time-entries/project/:projectId/stats 🔒 JWT
  res: stats projet

DELETE /time-entries/:id                     🔒 JWT
```

#### COMPANY SETTINGS `/company-settings`
```
GET   /company-settings                      🔒 JWT
PATCH /company-settings                      🔒 ADMIN
  body: { companyName?, logoUrl?, primaryColor?(hex) }
```

#### AI `/ai`  ⚡ Rate limit: 5 req/60s
```
POST /ai/interpret                           🔒 JWT
  body: { projectId, message(3-2000 chars) }
  res:  action suggérée (sans exécution)

POST /ai/execute                             🔒 JWT
  body: { projectId, action: 'create_task'|'assign_task', params }
  // create_task params: { title, description?, priority, assigneeId? }
  // assign_task params: { taskId, userId }
  res:  objet créé/modifié

POST /ai/act                                 🔒 JWT
  body: { projectId, message(3-2000 chars) }
  res:  interpret + execute en une fois

GET  /ai/analyze/gantt/:projectId            🔒 JWT
  res: { analysis: string }

GET  /ai/analyze/pert/:projectId             🔒 JWT
  res: { analysis: string }

GET  /ai/analyze/delays/:projectId           🔒 JWT
  res: { prediction: string }
```

---

## Structure complète du projet

```
forge/
├── app/                                  # App Router Next.js (pas de dossier src/)
│   ├── (auth)/                           # Groupe sans layout dashboard
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   │       └── [token]/
│   ├── (dashboard)/                      # Layout avec sidebar + header
│   │   ├── layout.tsx                    # Layout commun dashboard
│   │   ├── dashboard/
│   │   │   ├── admin/                    # Vue ADMIN
│   │   │   ├── project-manager/          # Vue PROJECT_MANAGER
│   │   │   └── employee/                 # Vue EMPLOYEE
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Liste des projets
│   │   │   └── [id]/
│   │   │       ├── layout.tsx            # Navbar projet (onglets vues)
│   │   │       ├── kanban/
│   │   │       ├── gantt/
│   │   │       ├── pert/
│   │   │       ├── burndown/
│   │   │       ├── workload/
│   │   │       ├── chat/
│   │   │       └── documents/
│   │   ├── my-tasks/                     # Tâches assignées à l'utilisateur connecté
│   │   ├── time-tracking/
│   │   └── settings/
│   │       ├── profile/
│   │       ├── notifications/
│   │       └── company/                  # ADMIN seulement
│   ├── layout.tsx                        # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                               # Composants DaisyUI réutilisables
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── NotificationBell.tsx
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskDetailModal.tsx
│   ├── planning/
│   │   ├── GanttChart.tsx
│   │   ├── PertNetwork.tsx
│   │   └── BurndownChart.tsx
│   ├── chat/
│   └── documents/
│
├── lib/
│   ├── api/
│   │   ├── client.ts                     # Instance Axios + interceptors JWT (401 → logout)
│   │   ├── auth.api.ts
│   │   ├── projects.api.ts
│   │   ├── tasks.api.ts
│   │   ├── planning.api.ts
│   │   ├── chat.api.ts
│   │   └── documents.api.ts
│   ├── hooks/                            # TanStack Query hooks (useProjects, useTasks…)
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── usePlanning.ts
│   │   └── useNotifications.ts
│   ├── stores/                           # Zustand
│   │   ├── auth.store.ts                 # { user, token, role } persisté localStorage
│   │   └── ui.store.ts                   # sidebar open, theme…
│   ├── socket/
│   │   └── socket.client.ts              # Singleton socket.io-client connecté avec JWT
│   ├── types/                            # Types TS miroir du backend — AGNOSTIQUES REACT
│   │   ├── user.types.ts
│   │   ├── project.types.ts
│   │   ├── task.types.ts
│   │   └── planning.types.ts
│   └── utils/
│       ├── date.ts
│       └── priority.ts                   # Labels et couleurs DaisyUI par valeur Priority
│
├── middleware.ts                         # Protection routes + redirection par rôle JWT
├── CLAUDE.md
└── package.json
```

### Patterns d'implémentation clés

**Axios client (lib/api/client.ts)**
```ts
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
  }
  return Promise.reject(error)
})
```

**Auth store (lib/stores/auth.store.ts)**
```ts
// { user, token, role } — persisté dans localStorage
// actions : login(token, user), logout()
```

**Socket (lib/socket/socket.client.ts)**
```ts
// Singleton initialisé après login avec le JWT
// Événements : message:new, notification:new
```

---

## Design System

### Palette de couleurs

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| Background | `#F8FAFC` | `#0D1117` | Fond principal (`bg-base-200`) |
| Surface | `#FFFFFF` | `#161B22` | Cartes, sidebar (`bg-base-100`) |
| Surface hover | `#F1F5F9` | `#21262D` | Hover cards |
| Bordure | `#E2E8F0` | `#30363D` | Séparateurs |
| Texte principal | `#0F172A` | `#E6EDF3` | Texte principal |
| Texte secondaire | `#64748B` | `#8B949E` | Texte secondaire |
| Texte faible | `#94A3B8` | `#6E7681` | Métadonnées |

### Couleur primaire

| Rôle | Clair | Sombre |
|---|---|---|
| Primaire | `#2F81F7` | `#58A6FF` |

### Pourquoi

- lisible
- contraste correct
- direction claire pour l’utilisateur

### Couleurs fonctionnelles

| Fonction | Hex | Usage |
|---|---|---|
| Critique | `#F85149` | tâches bloquées / PERT critique |
| Succès | `#3FB950` | DONE |
| Warning | `#D29922` | retard |
| Info | `#58A6FF` | docs / commentaires |

### IA

| Fonction | Hex | Règle |
|---|---|---|
| IA | `#A371F7` | usage très limité |

> Important :
>
> pas partout
> seulement :
> suggestions
> actions automatiques
>
> Sinon → gadget inutile

### RÈGLES DESIGN

Radius
- `rounded-lg` → standard
- `rounded-xl` → éléments importants (modals, cards clés)

Ombres
- `shadow-sm` → cartes normales
- `shadow-md` → hover / focus
- `shadow-lg` → modals uniquement

Espacement
- garde tes règles → elles sont bonnes
- rien à corriger ici

Typographie
- `text-xs` → metadata
- `text-sm` → contenu secondaire
- `text-base` → contenu principal
- `text-lg` → titres sections
- `text-xl` → titres pages

### États interactifs (OBLIGATOIRE)

Bouton primaire
- default : bleu
- hover : `#1F6FEB`
- active : `#1A5FCC`
- disabled : gris désaturé

Cards
- default : surface
- hover : surface-hover
- selected :
  - `border` : primaire
  - `background` : léger tint

Sidebar item
- default : texte secondaire
- hover : texte principal + bg hover
- active :
  - texte blanc
  - bg primaire faible (`rgba(47,129,247,0.15)`)

Inputs
- border normal : gris
- focus :
  - border primaire
  - ring léger

### Ne jamais dupliquer
- `ROLE_ROUTES` → `lib/utils/auth-routes.ts`
- Extraction d'erreur Axios → `getApiError()` dans `lib/utils/api-error.ts`

---

## Règles

- Toujours **DaisyUI** pour les composants UI, jamais shadcn
- Aucune logique métier dans les composants — tout dans `lib/`
- `lib/types/` et `lib/api/` restent **agnostiques React** (pas de hooks dedans) pour extraction future vers Flutter
- Le middleware Next.js gère la redirection selon le rôle JWT

---

## Mobile (futur)

Flutter — pas React Native. `lib/types/` et `lib/api/` seront extraits en package partagé (monorepo Turborepo) quand le mobile sera développé.
