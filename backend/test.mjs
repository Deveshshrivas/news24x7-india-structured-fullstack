import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
config({ path: '../.env' });
config({ path: '.env' });
(async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DATABASE || 'news24x7');
  const users = await db.collection('users').find({role: 'reporter'}).toArray();
  for (const u of users) {
    console.log(`User: ${u.email}, Active: ${u.active}, Type: ${typeof u.active}`);
  }
  process.exit(0);
})();
