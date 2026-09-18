import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProductionConfig} from './production-config.js';
const good={development:false,jwtSecret:'a'.repeat(64),cookieSecure:true,frontendUrl:'https://example.com',backendUrl:'http://127.0.0.1:8000',allowedOrigins:['https://example.com'],databaseEngine:'mysql',mysql:{user:'news_app',password:'test-only'},googleClientId:'',googleClientSecret:''};
test('production rejects weak secrets, insecure cookies, origins and root database accounts',()=>{
 assert.doesNotThrow(()=>validateProductionConfig(good));
 for(const values of [{jwtSecret:'dev-only-change-me'},{jwtSecret:'replace-with-a-random-64-character-secret'},{cookieSecure:false},{frontendUrl:'http://example.com'},{allowedOrigins:['https://example.com/path']},{mysql:{user:'root',password:'test'}},{mysql:{user:'news_app',password:''}},{googleClientId:'missing-pair'}])assert.throws(()=>validateProductionConfig({...good,...values}));
 assert.doesNotThrow(()=>validateProductionConfig({...good,development:true,jwtSecret:''}));
});
