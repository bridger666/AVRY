import urllib.request
import re
url = 'https://app.aivory.id/dashboard'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
print('OK')
for match in re.findall(r'(?:script src="|link href="|img src="|source src=")(.*?)"', html):
    print(match)
