import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { Summary, MonthlySnapshot } from '@/lib/api';

export default async function DashboardPage() {
  const token = cookies().get('token')?.value;
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Cookie'] = `token=${token}`;

    const [resSum, resSnaps] = await Promise.all([
      fetch(`${url}/summary`, { headers, cache: 'no-store' }),
      fetch(`${url}/snapshots`, { headers, cache: 'no-store' })
    ]);

    const initialSummary: Summary | null = resSum.ok ? await resSum.json() : null;
    const initialSnapshots: MonthlySnapshot[] = resSnaps.ok ? await resSnaps.json() : [];

    return <DashboardClient initialSummary={initialSummary} initialSnapshots={initialSnapshots} />;
  } catch (err) {
    // Falback gracefully to client side fetching if Network dies
    return <DashboardClient initialSummary={null} initialSnapshots={[]} />;
  }
}
