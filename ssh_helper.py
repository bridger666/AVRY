import sys
import wexpect

def run_ssh():
    cmd = """ssh -o StrictHostKeyChecking=no ubuntu@43.156.108.96 "cd /home/ubuntu/AVRY && bash deploy-dashboard.sh" """
    
    print("Spawning SSH process to deploy dashboard...")
    child = wexpect.spawn(cmd, timeout=300)
    
    idx = child.expect([r"password:", r"Password:"])
    if idx >= 0:
        print("Sending password...")
        child.sendline("mT4-wye-9Dn-hYK")
    
    child.expect(wexpect.EOF)
    print("OUTPUT:")
    output_text = child.before
    if isinstance(output_text, str):
        print(output_text.encode('ascii', errors='replace').decode('ascii'))
    else:
        print(output_text)

if __name__ == '__main__':
    run_ssh()
