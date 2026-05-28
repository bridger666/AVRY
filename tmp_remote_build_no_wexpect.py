import subprocess

cmd = [
    'ssh',
    '-o', 'StrictHostKeyChecking=no',
    'ubuntu@43.156.108.96',
    'cd /home/ubuntu/AVRY && docker compose -f docker-compose.dashboard.yml build aivory-dashboard && docker compose -f docker-compose.dashboard.yml up -d aivory-dashboard'
]
proc = subprocess.run(cmd, input='mT4-wye-9Dn-hYK\n', text=True, capture_output=True, timeout=1800)
print('STDOUT:')
print(proc.stdout)
print('STDERR:')
print(proc.stderr)
print('RETURN CODE:', proc.returncode)
