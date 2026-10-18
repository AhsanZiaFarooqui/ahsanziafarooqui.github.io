"""Check live same-origin case links and content against this checkout. Stdlib only.

Run only against a deployed checkout: a branch not yet deployed should fail byte
comparisons. External GitHub source pages are inspected separately, not fetched here.
"""
import concurrent.futures
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://ahsanziafarooqui.github.io/'

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('a', 'link', 'script', 'img'):
            self.urls.extend(attrs[key] for key in ('href', 'src') if key in attrs)

def main():
    urls = {BASE, urljoin(BASE, 'portfolio/'), urljoin(BASE, 'portfolio/cases/')}
    for path in (ROOT / 'portfolio/cases').glob('*.html'):
        page = urljoin(BASE, path.relative_to(ROOT).as_posix())
        urls.add(page)
        parser = Links()
        parser.feed(path.read_text())
        for link in parser.urls:
            url = urljoin(page, link).split('#')[0]
            if urlparse(url).netloc == urlparse(BASE).netloc:
                urls.add(url)
    def fetch(url):
        result = {'url': url}
        try:
            with urlopen(url, timeout=30) as response:
                data = response.read()
                local = ROOT / unquote(urlparse(url).path).lstrip('/')
                if local.is_dir():
                    local = local / 'index.html'
                result.update(status=response.status, bytes=len(data),
                              sha256=hashlib.sha256(data).hexdigest(),
                              matches_checkout=local.is_file() and data == local.read_bytes())
        except Exception as error:
            result['error'] = str(error)
        return result
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(fetch, sorted(urls)))
    print(json.dumps(results, indent=2))
    if any(result.get('status') != 200 or not result.get('matches_checkout') for result in results):
        raise SystemExit('Delivery failed or deployed content differs from this checkout')

if __name__ == '__main__':
    main()
