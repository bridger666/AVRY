import wexpect

remote_cmd = 'cd /home/ubuntu/AVRY && docker compose -f docker-compose.dashboard.yml ps -a && echo "---" && docker inspect --format="{{.Config.Cmd}}" aivory-dashboard || true && echo "---" && docker inspect --format="{{.Config.Entrypoint}}" aivory-dashboard || true && echo "---" && docker images --filter=reference="*avry-aivory-dashboard*" --format="{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}"'
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=300)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
