import wexpect

cmd = 'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "tail -40 /home/ubuntu/AVRY/nextjs-console/Dockerfile"'
child = wexpect.spawn(cmd, timeout=600)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
