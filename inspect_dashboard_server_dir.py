import wexpect

cmd = ('ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "'
       'docker run --rm --entrypoint sh avry-aivory-dashboard -c \'ls -la /app/.next/server && ls -la /app/.next/server/pages 2>/dev/null\'"')
child = wexpect.spawn(cmd, timeout=600)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
