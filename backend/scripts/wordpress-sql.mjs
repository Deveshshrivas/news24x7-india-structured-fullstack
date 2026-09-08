import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';

// Parse data only. Never execute statements from a source SQL dump.
export async function readWordpressRows(file, wanted, visit) {
  let table=null, columns=[], row=[], token='', quoted=false, escaped=false, inRow=false, wasQuoted=false;
  const finish=()=>{row.push(wasQuoted?token:token.trim()==='NULL'?null:token.trim());token='';wasQuoted=false;};
  for await(const line of createInterface({input:createReadStream(file,{encoding:'utf8'}),crlfDelay:Infinity})) {
    if(!inRow) {
      const insert=line.match(/^INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*$/);
      if(insert){table=wanted.has(insert[1])?insert[1]:null;columns=[...insert[2].matchAll(/`([^`]+)`/g)].map(x=>x[1]);continue;}
      if(!table)continue;
    }
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(quoted){
        if(escaped){token+=({'0':'\0',n:'\n',r:'\r',t:'\t',b:'\b',Z:'\x1a'})[ch]??ch;escaped=false;}
        else if(ch==='\\')escaped=true;
        else if(ch==="'"){if(line[i+1]==="'"){token+="'";i++;}else quoted=false;}
        else token+=ch;
      }else if(inRow){
        if(ch==="'"){quoted=true;wasQuoted=true;token='';}
        else if(ch===',')finish();
        else if(ch===')'){finish();if(row.length!==columns.length)throw new Error(`Column mismatch in ${table}`);await visit(table,Object.fromEntries(columns.map((c,j)=>[c,row[j]])));row=[];inRow=false;}
        else token+=ch;
      }else if(ch==='('){inRow=true;token='';}
      else if(ch===';'){table=null;break;}
    }
    if(quoted)token+='\n';
  }
  if(inRow||quoted)throw new Error('Incomplete SQL row');
}
