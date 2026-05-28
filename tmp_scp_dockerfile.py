import wexpect
import os

local = r'c:\Users\user\Documents\Software-Developer\Freelancer\aivery\nextjs-console\Dockerfile'
remote = 'ubuntu@43.156.108.96:/home/ubuntu/AVRY/nextjs-console/Dockerfile'
cmd = f'scp -o StrictHostKeyChecking=no "{local}" "{remote}"'
child = wexpect.spawn(cmd, timeout=600)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
