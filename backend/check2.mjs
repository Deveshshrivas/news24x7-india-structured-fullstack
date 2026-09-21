import { MongoClient } from 'mongodb';
async function check() {
  const uri = "mongodb+srv://deveshshrivas060:Gq7mmeGubT8twoD8@cluster0.w8nmlpu.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('news24x7');
  
  const notifs = await db.collection('notifications').find({ message: /Ad removed/ }).sort({ created_at: -1 }).limit(5).toArray();
  console.log("\nRecent Ad deletions:");
  notifs.forEach(n => console.log(n.created_at, n.message));
  
  await client.close();
  process.exit(0);
}
check();
