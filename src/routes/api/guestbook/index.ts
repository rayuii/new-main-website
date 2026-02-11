import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: '+00:00'
});
export async function GET() {
	try {
		const [rows] = await pool.query('SELECT * FROM guestbook ORDER BY created_at DESC');
		return new Response(JSON.stringify(rows), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Failed to fetch guestbook:', error);
		return new Response(JSON.stringify([]), {
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

export async function POST({ request }: any) {
	try {
		const { name, message } = await request.json();
		if (!name || !message) {
			return new Response(JSON.stringify({ error: 'Name and message required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		if (name.length > 50) {
			return new Response(JSON.stringify({ error: 'Name too long (max 50 chars)' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		if (message.length > 500) {
			return new Response(JSON.stringify({ error: 'Message too long (max 500 chars)' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Sanitize: strip HTML tags
		const cleanName = name.replace(/<[^>]*>/g, '').trim();
		const cleanMessage = message.replace(/<[^>]*>/g, '').trim();

		if (!cleanName || !cleanMessage) {
			return new Response(JSON.stringify({ error: 'Invalid input' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Simple rate limiting: max 1 entry per name per 5 minutes
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const [recentRows] = await pool.query(
			'SELECT * FROM guestbook WHERE name = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1',
			[cleanName, fiveMinutesAgo]
		);
		if (recentRows.length > 0) {
			return new Response(JSON.stringify({ error: 'Please wait a few minutes before posting again' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const id = uuidv4();
		const createdAt = new Date();
		await pool.query(
			'INSERT INTO guestbook (id, name, message, created_at) VALUES (?, ?, ?, ?)',
			[id, cleanName, cleanMessage, createdAt]
		);
		const [rows] = await pool.query('SELECT * FROM guestbook WHERE id = ?', [id]);
		const newEntry = rows[0];

		return new Response(JSON.stringify(newEntry), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Failed to post guestbook entry:', error);
		return new Response(JSON.stringify({ error: 'Failed to post entry' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
