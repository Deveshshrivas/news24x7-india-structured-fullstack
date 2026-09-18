import {syncMediaLibrary,catalogState} from '../src/media-library.ts';
import {client} from '../src/database.ts';
const progress=setInterval(()=>console.log(`Indexed ${catalogState.indexed} media files`),5000);
try{await syncMediaLibrary();if(catalogState.error)throw Error(catalogState.error);console.log(`Media scan finished: ${catalogState.indexed} files indexed`)}finally{clearInterval(progress);await client.close()}
