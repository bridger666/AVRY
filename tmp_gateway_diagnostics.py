import wexpect

remote_cmd = (
    "cd /home/ubuntu/AVRY && "
    "echo '--- CURL_LOCAL ---' && curl -sS -I -m 10 http://127.0.0.1:3000/ || true && "
    "echo '--- CURL_LOCAL_ROOT ---' && curl -sS -m 10 http://127.0.0.1:3000/ || true && "
    "echo '--- SOCKETS ---' && ss -ltnp | grep 3000 || true && "
    "echo '--- DOCKER_PS_TRAEFIK ---' && docker ps --format '{{.ID}} {{.Names}} {{.Image}} {{.Status}} {{.Ports}}' | grep -i traefik || true && "
    "echo '--- TRAEFIK_LOGS (last 200 lines) ---' && docker logs --tail 200 traefik || true && "
    "echo '--- COMPOSE_PS ---' && docker compose -f docker-compose.dashboard.yml ps -a || true && "
    "echo '--- INSPECT_NETWORKS ---' && docker inspect aivory-dashboard --format '{{json .NetworkSettings}}' || true"
)
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=300)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
