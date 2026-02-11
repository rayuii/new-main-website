import { sveltekit } from '@sveltejs/kit/vite';
import * as dotenv from 'dotenv';

dotenv.config();

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['kuroshiro', 'kuroshiro-analyzer-kuromoji', 'kuromoji']
	}
};

export default config;