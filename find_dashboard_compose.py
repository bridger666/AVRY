import wexpect
remote_cmd = "cd /home/ubuntu 2>/dev/null; find . -maxdepth 3 -type f \( -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' \) | sort | head -20"
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=300)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
