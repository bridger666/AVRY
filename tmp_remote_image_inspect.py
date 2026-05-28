import wexpect

remote_cmd = 'cd /home/ubuntu/AVRY && docker image inspect avry-aivory-dashboard:latest --format "{{.Config.Cmd}}\n{{.Config.Entrypoint}}\n{{.ContainerConfig.Cmd}}\n{{.ContainerConfig.Entrypoint}}" || true && echo "---" && docker ps -a --filter "name=aivory-dashboard" --format "{{.ID}} {{.Names}} {{.Image}} {{.Status}} {{.Command}}"'
cmd = f'ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "{remote_cmd}"'
child = wexpect.spawn(cmd, timeout=300)
child.expect([r'password:', r'Password:'])
child.sendline('mT4-wye-9Dn-hYK')
child.expect(wexpect.EOF)
out = child.before
if isinstance(out, bytes):
    out = out.decode('utf-8', errors='replace')
print(out)
