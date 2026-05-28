import wexpect

remote_cmd = (
    'cd /home/ubuntu/AVRY && '
    'docker compose -f docker-compose.dashboard.yml build aivory-dashboard && '
    'docker compose -f docker-compose.dashboard.yml up -d aivory-dashboard && '
    'docker compose -f docker-compose.dashboard.yml ps && '
    'docker logs --tail 40 aivory-dashboard'
)
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=1800)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
