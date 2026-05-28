import wexpect

remote_cmd = (
    "cd /home/ubuntu/AVRY && "
    "docker ps -a --filter name=aivory-dashboard --format '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Command}}'"
)
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=300)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
lines = [line.strip() for line in out.splitlines() if line.strip()]
print('CONTAINERS:')
for line in lines:
    print(line)

stale_ids = []
for line in lines:
    parts = line.split('|', 4)
    if len(parts) >= 3:
        cid, name, status = parts[0], parts[1], parts[2]
        if not status.startswith('Up'):
            stale_ids.append((cid, name, status))

if not stale_ids:
    print('No stale aivory-dashboard container found to remove.')
else:
    for cid, name, status in stale_ids:
        print(f'Removing stale container {cid} ({name}) status={status}')
        child = wexpect.spawn(
            f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "cd /home/ubuntu/AVRY && docker rm -f {cid}"',
            timeout=300,
        )
        child.expect([r'password:', r'Password:'])
        child.sendline('mT4-wye-9Dn-hYK')
        child.expect(wexpect.EOF)
        result = child.before
        if isinstance(result, bytes):
            result = result.decode('utf-8', errors='replace')
        print(result)
