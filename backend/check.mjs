import { MongoClient } from 'mongodb';
async function check() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('news24x7');
  const ads = await db.collection('ads').find({}).toArray();
  console.log("Current ads in DB:", ads.length);
  ads.forEach(ad => console.log(ad.placement, ad.name, ad.link));
  
  // also check notifications for "Ad removed"
  const notifs = await db.collection('notifications').find({ message: /Ad removed/ }).sort({ created_at: -1 }).limit(5).toArray();
  console.log("\nRecent Ad deletions in notifications:");
  notifs.forEach(n => console.log(n.created_at, n.message));
  
  process.exit(0);
}
check();
