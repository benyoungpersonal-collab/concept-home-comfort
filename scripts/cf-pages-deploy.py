#!/usr/bin/env python3
# Deploys a built preview folder to Cloudflare Pages through the direct-upload API.
#   python3 -I scripts/cf-pages-deploy.py previews/<slug> byw-<slug>
# Creates the Pages project (production branch main) if it does not exist yet.
# Why not only Wrangler: in a Claude Code cloud session the proxy injects the API token into every
# api.cloudflare.com request, which also overwrites Wrangler's short-lived upload token, so
# `wrangler pages deploy` fails at the asset-upload step. This script needs only the API token.
# Token: CLOUDFLARE_API_TOKEN (or the proxy-injected one). Never printed.
import sys, os, json, base64, mimetypes, requests
from blake3 import blake3
d, project = sys.argv[1], sys.argv[2]
API = 'https://api.cloudflare.com/client/v4'
H = {'Authorization': 'Bearer ' + (os.environ.get('CLOUDFLARE_API_TOKEN') or 'proxy-injected')}
acct = os.environ.get('CLOUDFLARE_ACCOUNT_ID') or requests.get(f'{API}/accounts', headers=H, timeout=60).json()['result'][0]['id']
if requests.get(f'{API}/accounts/{acct}/pages/projects/{project}', headers=H, timeout=60).status_code == 404:
    r = requests.post(f'{API}/accounts/{acct}/pages/projects', headers=H, json={'name': project, 'production_branch': 'main'}, timeout=60)
    print('created project', project, r.json().get('success'))
manifest, files = {}, []
special = {'_headers', '_redirects', '_routes.json', '_worker.js'}
for root, _, fs in os.walk(d):
    for f in fs:
        p = os.path.join(root, f); rel = '/' + os.path.relpath(p, d).replace(os.sep, '/')
        data = open(p, 'rb').read()
        if f in special and root == d:
            files.append((f, (f, data, 'text/plain'))); continue
        ext = os.path.splitext(f)[1][1:]
        h = blake3((base64.b64encode(data).decode() + ext).encode()).hexdigest()[:32]
        manifest[rel] = h
        files.append((h, (f, data, mimetypes.guess_type(f)[0] or 'application/octet-stream')))
form = [('manifest', (None, json.dumps(manifest))), ('branch', (None, 'main'))] + files
r = requests.post(f'{API}/accounts/{acct}/pages/projects/{project}/deployments', headers=H, files=form, timeout=300)
j = r.json()
if not j.get('success'): print('FAILED', r.status_code, j.get('errors')); sys.exit(1)
res = j['result']; print('deployed', res['id'], res['url'], res.get('environment'), 'stage:', res.get('latest_stage', {}).get('status'))
