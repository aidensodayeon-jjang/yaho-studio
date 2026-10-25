#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ $EUID -eq 0 && $(hostname) == sodaserver ]] || exit 1
bundle=$(cd "$(dirname "$0")" && pwd)
revision=$(cat "$bundle/revision")
[[ $revision =~ ^[0-9a-f]{40}$ ]] || exit 1
[[ $(sha256sum "$bundle/source.tar.gz" | cut -d' ' -f1) == $(cat "$bundle/source.sha256") ]] || exit 1
cfg=/srv/soda/config/yaho-production
release=/srv/soda/releases/yaho/$revision
[[ ! -e $cfg/compose.yaml ]] || { echo 'Existing Yaho deployment found; refusing overwrite.';exit 1; }
backup=/srv/soda/backups/yaho-production/$(date +%Y%m%d-%H%M%S)
install -d -m 700 "$cfg" "$release" "$backup"
python3 - "$backup" <<'PY'
import sqlite3,sys,shutil
from pathlib import Path
root=Path('/srv/soda/data/proxy/data');c=sqlite3.connect('file:'+str(root/'database.sqlite')+'?mode=ro',uri=True)
r=c.execute('select forward_host,forward_port from proxy_host where id=9 and enabled=1 and is_deleted=0').fetchone();assert r==('192.168.0.11',6978),r
s=sqlite3.connect(Path(sys.argv[1])/'database.sqlite');c.backup(s);s.close();c.close()
shutil.copy2(root/'nginx/proxy_host/9.conf',Path(sys.argv[1])/'9.conf')
PY
cat > "$backup/rollback.sh" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail
backup=$(cd "$(dirname "$0")" && pwd)
python3 - <<'PY'
import sqlite3
c=sqlite3.connect('/srv/soda/data/proxy/data/database.sqlite');c.execute("update proxy_host set forward_host='192.168.0.11',forward_port=6978,forward_scheme='http',modified_on=datetime('now') where id=9");c.commit();c.close()
PY
cp "$backup/9.conf" /srv/soda/data/proxy/data/nginx/proxy_host/9.conf
docker exec soda-proxy-app-1 nginx -t
docker exec soda-proxy-app-1 nginx -s reload
echo 'Yaho route restored to original Mac.'
ROLLBACK
chmod 700 "$backup/rollback.sh"
tar -xzf "$bundle/source.tar.gz" -C "$release"
install -m 600 "$bundle/runtime.env" "$cfg/runtime.env"
docker build -t "soda-yaho:$revision" -f "$release/ops/soda/Dockerfile" "$release"
cat > "$cfg/compose.yaml" <<YAML
services:
  yaho:
    image: soda-yaho:$revision
    restart: unless-stopped
    init: true
    env_file: runtime.env
    environment:
      NODE_ENV: production
      PORT: "3500"
      YAHO_PREWARM: "false"
    ports:
      - "127.0.0.1:13097:3500"
    security_opt: ["no-new-privileges:true"]
    cap_drop: [ALL]
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
YAML
dc=(docker compose -p soda-yaho-production -f "$cfg/compose.yaml")
"${dc[@]}" up -d
ready=false
for i in {1..60};do
 if curl -fsS --max-time 2 http://127.0.0.1:13097/api/health -o /dev/null;then ready=true;break;fi
 sleep 2
done
[[ $ready == true ]] || { "${dc[@]}" logs --tail 30;"${dc[@]}" stop;exit 1; }
"${dc[@]}" exec -T yaho node --input-type=module - <<'JS'
import fs from 'node:fs';
for(const k of ['TOUR_API_KEY','OPENAI_API_KEY','GEMINI_API_KEY','YOUTUBE_API_KEY','NAVER_CLIENT_ID','NAVER_CLIENT_SECRET'])if(!process.env[k])throw Error('Missing setting: '+k);
for(const f of fs.readdirSync('/app/dist/assets').filter(f=>f.endsWith('.js'))){const s=fs.readFileSync('/app/dist/assets/'+f,'utf8');for(const k of ['TOUR_API_KEY','OPENAI_API_KEY','GEMINI_API_KEY','YOUTUBE_API_KEY','NAVER_CLIENT_SECRET'])if(s.includes(process.env[k]))throw Error('Credential found in browser bundle');}
const base='http://127.0.0.1:3500';
for(const p of ['/','/api/health'])if((await fetch(base+p)).status!==200)throw Error('Readiness failed');
if((await fetch(base+'/api/keyword-studio',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status!==400)throw Error('Invalid request check failed');
if((await fetch(base+'/api/tourapi/arbitrary/admin')).status!==404)throw Error('Upstream allowlist failed');
console.log('UI/API/configuration verified. No external AI generation requested. No credentials in browser JS.');
JS
trap 'bash "$backup/rollback.sh"; exit 1' ERR INT TERM
docker exec -i -w /app soda-proxy-app-1 node --input-type=module < "$release/ops/soda/proxy.mjs"
docker exec soda-proxy-app-1 nginx -t
# Nginx reload is asynchronous: wait until the new upstream is serving.
ready=false
for i in {1..20};do
 if curl --noproxy '*' -fsS --max-time 5 --resolve yaho.sodayeon.co.kr:443:127.0.0.1 https://yaho.sodayeon.co.kr/api/health | grep -q '"ok":true';then ready=true;break;fi
 sleep 1
done
[[ $ready == true ]]
curl --noproxy '*' -fsS --max-time 20 --resolve yaho.sodayeon.co.kr:443:127.0.0.1 -o /dev/null -w 'Yaho HTTPS %{http_code}\n' https://yaho.sodayeon.co.kr/
"${dc[@]}" ps
echo "Git commit: $revision"
echo "Rollback: sudo bash $backup/rollback.sh"
echo 'Yaho now runs on Soda server. Existing browser-saved plans remain on the same domain. Original Mac service retained for rollback.'
trap - ERR INT TERM
