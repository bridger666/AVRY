import urllib.request
from urllib.error import HTTPError, URLError
for url in ['https://app.aivory.id/console', 'https://app.aivory.id/console/dashboard', 'https://app.aivory.id/console/']:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(url, resp.status)
            print(resp.geturl())
            data = resp.read(500).decode('utf-8', errors='ignore')
            print(data[:300])
    except HTTPError as e:
        print(url, 'HTTPError', e.code, e.reason)
        if e.fp:
            print(e.fp.read(300).decode('utf-8', errors='ignore'))
    except URLError as e:
        print(url, 'URLError', e)
