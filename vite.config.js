import { sveltekit } from '@sveltejs/kit/vite';
import * as dotenv from 'dotenv';

dotenv.config();

const config = {
	plugins: [sveltekit()],
	ssr: {
		external: ['kuroshiro', 'kuroshiro-analyzer-kuromoji', 'kuromoji']
	}
};

export default config;