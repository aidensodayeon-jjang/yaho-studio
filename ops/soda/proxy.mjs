import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
const db=new Database('/data/database.sqlite',{readonly:true});
const user=db.prepare('select id,roles from user where is_deleted=0 and is_disabled=0').all().find(u=>JSON.parse(u.roles).includes('admin'));db.close();
if(!user)throw Error('No proxy administrator');
const token=jwt.sign({iss:'api',attrs:{id:user.id},scope:['user']},JSON.parse(fs.readFileSync('/data/keys.json','utf8')).key,{algorithm:'RS256',expiresIn:'5m'});
async function api(method,path,body){const r=await fetch('http://127.0.0.1:81/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Proxy API status '+r.status);return r.json();}
const hosts=await api('GET','/nginx/proxy-hosts');
const host=hosts.find(h=>h.domain_names.includes('yaho.sodayeon.co.kr'));
if(!host||host.id!==9||host.forward_host!=='192.168.0.11'||Number(host.forward_port)!==6978)throw Error('Unexpected original Yaho route; refusing switch');
const result=await api('PUT','/nginx/proxy-hosts/'+host.id,{forward_host:'127.0.0.1',forward_port:13097,forward_scheme:'http'});
if(result.meta?.nginx_online===false)throw Error('Yaho nginx configuration rejected');
const after=await api('GET','/nginx/proxy-hosts');
for(const h of hosts.filter(h=>h.id!==host.id)){const a=after.find(x=>x.id===h.id);for(const k of ['forward_host','forward_port','certificate_id','ssl_forced','domain_names'])if(!a||JSON.stringify(a[k])!==JSON.stringify(h[k]))throw Error('Unrelated host changed');}
console.log('Only Yaho upstream switched; existing certificate and other domain routes retained.');
