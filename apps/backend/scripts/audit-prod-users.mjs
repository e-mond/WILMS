import '../src/config/load-env.js';
import { getDb } from '../src/db/client.js';
import { users } from '../src/db/schema/users.js';

const db = getDb();
const rows = await db.select({ email: users.email, role: users.role, status: users.status }).from(users);
console.log(JSON.stringify(rows, null, 2));
