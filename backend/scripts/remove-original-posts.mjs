import assert from 'node:assert/strict';
import {client,db} from '../src/database.ts';

const source='wordpress:news24x7india.com';
try {
  await client.connect();
  const articles=db.collection('articles');
  const imported=await articles.countDocuments({migration_source:source});
  const originals=await articles.find({migration_source:{$exists:false}}).toArray();
  assert.equal(imported,20501,'Imported article count changed; stopping');
  assert.equal(originals.length,28,'Original article count changed; stopping');
  assert.equal(await articles.countDocuments({migration_source:{$ne:source}}),28,'Unexpected migration records; stopping');
  console.log(JSON.stringify({mode:process.argv.includes('--apply')?'APPLY':'DRY RUN',importedKept:imported,targets:originals.map(a=>({id:String(a._id),slug:a.slug}))}));
  if(process.argv.includes('--apply')) {
    const backupName=`article_recovery_originals_${new Date().toISOString().replace(/[^0-9]/g,'')}`;
    await db.createCollection(backupName);
    const backup=db.collection(backupName);
    await backup.insertMany(originals,{ordered:true});
    assert.equal(await backup.countDocuments({}),28,'Backup incomplete; stopping');
    const ids=originals.map(a=>a._id);
    const removed=await articles.deleteMany({_id:{$in:ids},migration_source:{$exists:false}});
    assert.equal(removed.deletedCount,28);
    assert.equal(await articles.countDocuments({migration_source:source}),20501);
    console.log(JSON.stringify({deleted:removed.deletedCount,remainingArticles:await articles.countDocuments({}),backupCollection:backupName,mediaFiles:'retained for recovery'}));
  }
} finally {await client.close();}
