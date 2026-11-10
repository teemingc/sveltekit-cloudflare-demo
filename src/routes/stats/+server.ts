import { stats } from '#lib/stats.js';

export function GET() {
	return Response.json(stats);
}
