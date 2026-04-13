# Claude App Development Guidelines
## Best Practices & Standards for Building Applications with AI Assistance

*Reference document for developers building applications with Claude*

---

## TABLE OF CONTENTS

1. [Tech Stack Standards](#tech-stack-standards)
2. [Architecture](#architecture)
3. [Code Quality](#code-quality)
4. [Styling](#styling)
5. [Module Structure](#module-structure)
6. [Backend Integration](#backend-integration)
7. [Coding Standards](#coding-standards)
8. [Libraries & Dependencies](#libraries--dependencies)
9. [Completion Checklist](#completion-checklist)
10. [Quick Reference](#quick-reference)
11. [Documentation](#documentation)

---

## TECH STACK STANDARDS

### Core Framework

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.9.5",
  "typescript": "^5.3.3"
}
```

### State Management

```json
{
  "zustand": "^4.4.7"
}
```

### Build Tool

```json
{
  "vite": "latest"
}
```

### Utilities

```json
{
  "date-fns": "^2.30.0"
}
```

---

## ARCHITECTURE

### Three-Layer Structure

```
module/
├── presentation/      # UI Layer - React components
│   ├── pages/         # Route-level components
│   └── components/    # Reusable UI components
│
├── domain/            # Business Logic Layer
│   ├── entities/      # TypeScript interfaces/types
│   └── services/      # Business logic & data operations
│
└── application/       # Application Layer
    ├── hooks/         # Custom React hooks
    └── stores/        # State management (Zustand)
```

---

## CODE QUALITY

### TypeScript Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

### Error Handling

```typescript
const [error, setError] = useState<Error | null>(null);
const [loading, setLoading] = useState(false);

try {
  setLoading(true);
  setError(null);
  const data = await fetchData();
  setData(data);
} catch (err) {
  console.error('Failed to fetch:', err);
  setError(err as Error);
} finally {
  setLoading(false);
}
```

### Loading & Empty States

```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (data.length === 0) return <EmptyState />;

return <DataDisplay data={data} />;
```

### Input Validation

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!email) newErrors.email = 'Email is required';
  if (email && !isValidEmail(email)) newErrors.email = 'Invalid email format';
  if (!password || password.length < 8) newErrors.password = 'Password must be 8+ characters';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;
  // Proceed with submission
};
```

### Responsive Design

```typescript
const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1200px',
  padding: isMobile ? '16px' : '24px',
  margin: '0 auto'
};
```

---

## STYLING

### Inline Styles with TypeScript

```typescript
const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  } as React.CSSProperties,

  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px'
  } as React.CSSProperties
};

export function MyComponent() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Title</h1>
    </div>
  );
}
```

### CSS Modules for Complex Components

```typescript
import './MyComplexComponent.css';

export function MyComplexComponent() {
  return (
    <div className="complex-container">
      <div className="complex-header">...</div>
    </div>
  );
}
```

---

## MODULE STRUCTURE

### Entry Point: `index.tsx`

```typescript
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';

export default function ModuleIndex() {
  return (
    <Routes>
      {routes.map(route => (
        <Route key={route.path} {...route} />
      ))}
    </Routes>
  );
}
```

### Routes: `routes.tsx`

```typescript
import { RouteObject } from 'react-router-dom';
import DashboardPage from './presentation/pages/DashboardPage';
import DetailPage from './presentation/pages/DetailPage';

export const routes: RouteObject[] = [
  { path: '/', element: <DashboardPage /> },
  { path: '/items', element: <ItemsList /> },
  { path: '/items/:id', element: <DetailPage /> }
];
```

### Navigation: `navigation.tsx`

```typescript
export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: '📊'
  },
  {
    label: 'Items',
    path: '/items',
    icon: '📦'
  }
];
```

---

## BACKEND INTEGRATION

### Mock Data Approach

```typescript
// src/data/mockData.ts
export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
];
```

### Service Layer with Integration Points

```typescript
// src/domain/services/UserService.ts
export class UserService {
  /**
   * TODO: [BACKEND] Replace with actual API call
   * Endpoint: GET /api/users
   * Headers: Authorization: Bearer {token}
   * Response: { users: User[], total: number }
   */
  static async getAllUsers(): Promise<User[]> {
    return Promise.resolve(mockUsers);
  }

  /**
   * TODO: [BACKEND] Implement user creation
   * Endpoint: POST /api/users
   * Body: { name: string, email: string }
   * Response: { user: User }
   */
  static async createUser(userData: CreateUserDto): Promise<User> {
    const newUser = { id: Date.now().toString(), ...userData };
    mockUsers.push(newUser);
    return Promise.resolve(newUser);
  }
}
```

---

## CODING STANDARDS

### File Naming

```
UserCard.tsx          (PascalCase for components)
UserService.ts        (PascalCase for classes/services)
userStore.ts          (camelCase for stores)
useUsers.ts           (camelCase for hooks)
mockData.ts           (camelCase for utilities)
User.ts               (PascalCase for types/interfaces)
```

### Import Organization

```typescript
// 1. External imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal imports (ALWAYS RELATIVE)
import { UserService } from '../../domain/services/UserService';
import { User } from '../../domain/entities/User';
import { UserCard } from '../components/UserCard';

// 3. Styles
import './UsersList.css';
```

### Component Structure

```typescript
// 1. Imports

// 2. Types/Interfaces
interface UsersListProps {
  filter?: string;
  onSelect?: (user: User) => void;
}

// 3. Component definition
export function UsersList({ filter, onSelect }: UsersListProps) {
  // 4. Hooks (at top of component)
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 5. Effects
  useEffect(() => {
    loadUsers();
  }, [filter]);

  // 6. Handlers
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (onSelect) {
      onSelect(user);
    } else {
      navigate(`/users/${user.id}`);
    }
  };

  // 7. Render conditions
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (users.length === 0) return <EmptyState message="No users found" />;

  // 8. Main render
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onClick={() => handleUserClick(user)}
        />
      ))}
    </div>
  );
}
```

### Naming Conventions

```typescript
// Components: PascalCase
export function UserCard() {}
export function UsersList() {}

// Functions: camelCase
function loadUsers() {}
function handleClick() {}

// Constants: SCREAMING_SNAKE_CASE
const API_BASE_URL = '/api';
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces/Types: PascalCase
interface User {}
type UserStatus = 'active' | 'inactive';

// Boolean variables: is/has/should prefix
const isLoading = true;
const hasError = false;
const shouldShowModal = true;

// Event handlers: handle prefix
const handleSubmit = () => {};
const handleChange = () => {};
const handleDelete = () => {};

// Async functions: descriptive names
async function loadUsers() {}
async function saveUser() {}
async function deleteUser() {}
```

### JSDoc Comments

```typescript
/**
 * Validates user email address
 *
 * @param email - Email address to validate
 * @returns Error message if invalid, null if valid
 *
 * @example
 * validateEmail('user@example.com') // Returns: null
 * validateEmail('invalid') // Returns: 'Invalid email format'
 */
export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
}
```

### State Management with Zustand

```typescript
import { create } from 'zustand';

interface UserStore {
  users: User[];
  loading: boolean;
  error: Error | null;

  loadUsers: () => Promise<void>;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  loadUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await UserService.getAll();
      set({ users, loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
    }
  },

  addUser: (user) => set(state => ({
    users: [...state.users, user]
  })),

  updateUser: (id, updates) => set(state => ({
    users: state.users.map(user =>
      user.id === id ? { ...user, ...updates } : user
    )
  })),

  deleteItem: (id) => set(state => ({
    users: state.users.filter(user => user.id !== id)
  })),

  reset: () => set({ users: [], loading: false, error: null })
}));
```

---

## LIBRARIES & DEPENDENCIES

### Standard Stack

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.9.5",
  "zustand": "^4.4.7",
  "typescript": "^5.3.3",
  "date-fns": "^2.30.0"
}
```

### Additional Libraries (When Needed)

```json
{
  "zod": "^3.22.4",
  "dompurify": "^3.3.0",
  "react-dropzone": "^14.2.3",
  "qrcode": "^1.5.3",
  "xlsx": "^0.18.5",
  "pdf-lib": "^1.17.1"
}
```

### Component Pattern

```typescript
// Function components
export function UserCard() {
  return <div>...</div>;
}

// React DOM
import { createRoot } from 'react-dom/client';
```

---

## COMPLETION CHECKLIST

### Structure
- [ ] Clean folder structure (presentation/domain/application)
- [ ] All imports are relative (no @/ or ~/)
- [ ] README.md with setup instructions
- [ ] Mock data separated into data/ folder

### Code Quality
- [ ] All components use TypeScript with proper types
- [ ] No `any` types used
- [ ] Error handling on all async operations
- [ ] Loading states on all data fetches
- [ ] Empty states when no data available
- [ ] Input validation on all forms
- [ ] No hardcoded values (URLs, IDs, secrets)

### User Experience
- [ ] Responsive design (tested mobile + desktop)
- [ ] Loading indicators for async operations
- [ ] Error messages are user-friendly
- [ ] Success feedback on actions
- [ ] Confirmation dialogs for destructive actions

### Documentation
- [ ] JSDoc comments on functions
- [ ] TODO comments for future backend integration
- [ ] Mock data clearly labeled
- [ ] Component usage examples

---

## QUICK REFERENCE

### Imports & Routing
- Use relative imports: `'./components/Button'`
- Use relative routes: `path: '/'`

### TypeScript
- Full TypeScript types everywhere
- No `any` types
- Interfaces for all data structures

### Error Handling
- Try/catch on all async operations
- Loading states for all data fetches
- Error states for all operations
- Empty states when no data

### Code Organization
- Clean folder structure (presentation/domain/application)
- Separate mock data files
- JSDoc comments on functions
- TODO comments for backend integration

### Design
- Responsive design (mobile-first)
- Inline styles for simple components
- CSS files for complex components

### Libraries
- React 18+ with function components
- Zustand for state management
- date-fns for date manipulation
- React Router v7+ for routing

---

## DOCUMENTATION

### README.md

```markdown
# Feature Name

## Setup
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`

## Features
- Feature description

## Project Structure
- Overview of key files and folders

## Mock Data
- Location: `src/data/mockData.ts`
- How to modify for testing
```

### Inline TODO Comments

```typescript
// TODO: [BACKEND] Replace with actual API call to GET /api/users
// Expected response: { users: User[], total: number }
const users = await UserService.getAllUsers();
```

### API Documentation: `docs/API_SPEC.md`

```markdown
# API Endpoints

## GET /api/users
**Description:** Retrieves all users

**Response:**
```json
{
  "users": User[],
  "total": number
}
```
```

### Component Documentation

```typescript
/**
 * UserCard Component
 *
 * Displays user information in a card layout
 *
 * @param user - User object to display
 * @param onEdit - Callback when edit is clicked
 * @param onDelete - Callback when delete is clicked
 *
 * @example
 * <UserCard
 *   user={user}
 *   onEdit={() => handleEdit(user.id)}
 *   onDelete={() => handleDelete(user.id)}
 * />
 */
export function UserCard({ user, onEdit, onDelete }) {
  // Implementation
}
```

---

**Last Updated:** December 2024
**Status:** Production Ready ✅
