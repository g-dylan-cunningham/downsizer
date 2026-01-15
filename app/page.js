/**
 * Purpose: Root page that redirects to login.
 * Exports: default Home component.
 * Invariants:
 * - Redirects unauthenticated users to /login.
 * - Redirects authenticated users to /app/projects (handled by middleware).
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
