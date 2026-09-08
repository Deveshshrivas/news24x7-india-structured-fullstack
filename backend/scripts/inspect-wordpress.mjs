import {readWordpressRows} from './wordpress-sql.mjs';
const report={tables:{},postTypes:{},newsStatuses:{},protectedNews:0,newsCharacters:0,attachments:0,categories:0,authors:0,thumbnailLinks:0,embeddedImages:0,earliest:null,latest:null,mediaHosts:{}};
await readWordpressRows(process.argv[2],new Set(['wp_posts','wp_terms','wp_term_taxonomy','wp_term_relationships','wp_users','wp_postmeta']),async(table,row)=>{
  report.tables[table]=(report.tables[table]||0)+1;
  if(table==='wp_posts'){
    report.postTypes[row.post_type]=(report.postTypes[row.post_type]||0)+1;
    if(row.post_type==='post'){
      report.newsStatuses[row.post_status]=(report.newsStatuses[row.post_status]||0)+1;
      if(row.post_password)report.protectedNews++;
      report.newsCharacters+=row.post_content.length;
      report.embeddedImages+=(row.post_content.match(/<img\b/gi)||[]).length;
      if(!report.earliest||row.post_date<report.earliest)report.earliest=row.post_date;
      if(!report.latest||row.post_date>report.latest)report.latest=row.post_date;
    }
    if(row.post_type==='attachment'){report.attachments++;try{const host=new URL(row.guid).hostname;report.mediaHosts[host]=(report.mediaHosts[host]||0)+1;}catch{}}
  }
  if(table==='wp_term_taxonomy'&&row.taxonomy==='category')report.categories++;
  if(table==='wp_users')report.authors++;
  if(table==='wp_postmeta'&&row.meta_key==='_thumbnail_id')report.thumbnailLinks++;
});
console.log(JSON.stringify(report,null,2));
