import { read } from '$app/server';
import file from './hello.txt?url';

export function GET() {
	return read(file);
}
