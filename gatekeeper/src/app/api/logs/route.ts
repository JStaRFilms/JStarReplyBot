import { getStats } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
    const stats = getStats();
    return Response.json(stats);
}
