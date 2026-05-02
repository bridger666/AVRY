with open('/tmp/n8n-as-code-index-new.js', 'r') as f:
    content = f.read()

# Fix the corrupted lines by removing the prefix
lines = content.split('\n')
fixed_lines = []
for line in lines:
    if line.startswith('id: `cred_${step.id || `step_${i + 1}``'):
        # Remove the prefix
        fixed_line = line[len('id: `cred_${step.id || `step_${i + 1}``'):]
        fixed_lines.append(fixed_line)
    else:
        fixed_lines.append(line)

fixed_content = '\n'.join(fixed_lines)

# Write the fixed content back
with open('/tmp/n8n-as-code-index-new.js', 'w') as f:
    f.write(fixed_content)

print('Fixed the file')
