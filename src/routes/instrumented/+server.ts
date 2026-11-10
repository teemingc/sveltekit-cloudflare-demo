export function GET() {
	return new Response(String(globalThis.__demo_instrumentation));
}
