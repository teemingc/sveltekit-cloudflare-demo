/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { version } from '$app/env';

self.addEventListener('install', () => console.log('sw', version));
