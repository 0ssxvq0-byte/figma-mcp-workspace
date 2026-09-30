#!/usr/bin/env python3
"""
Uploads every PNG in Assets/ to Roblox with Open Cloud, then writes Studio/Modules/AssetIds_Decals.lua.

Why: so nobody has to copy hundreds of asset IDs by hand.

Setup (once):
  1. https://create.roblox.com/dashboard/credentials -> Create API Key
     - Access permissions: add "Assets" API, allow  asset:read  and  asset:write
     - Accepted IP addresses: add your IP (or 0.0.0.0/0 while you run this)
  2. Find your user ID (the number in your profile URL), or your group ID if the game is owned by a group.

Run (from the unzipped StudioExport folder):
  python3 Studio/Tools/upload_assets.py --key YOUR_API_KEY --user 123456
  python3 Studio/Tools/upload_assets.py --key YOUR_API_KEY --group 987654

It uploads as Decals (the type Open Cloud accepts for images), waits for each one, and saves progress to
Studio/Tools/upload_progress.json so you can stop and re-run safely. Afterwards run
Studio/Tools/ResolveImageIds.lua in Studio's command bar to turn the Decal IDs into Image IDs.
Only Python 3 is needed; no extra packages.
"""
import argparse, json, os, sys, time, uuid, urllib.request, urllib.error

API = 'https://apis.roblox.com/assets/v1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))          # the StudioExport folder
ASSETS = os.path.join(ROOT, 'Assets')
PROGRESS = os.path.join(HERE, 'upload_progress.json')
OUT = os.path.join(ROOT, 'Studio', 'Modules', 'AssetIds_Decals.lua')


def request(method, url, key, body=None, ctype=None):
    req = urllib.request.Request(url, data=body, method=method, headers={'x-api-key': key})
    if ctype:
        req.add_header('Content-Type', ctype)
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')
            if e.code == 429 or e.code >= 500:           # rate limited or server busy: back off and retry
                time.sleep(2 ** attempt)
                continue
            sys.exit(f'\n{method} {url} failed ({e.code}): {msg}')
        except urllib.error.URLError as e:
            time.sleep(2 ** attempt)
    sys.exit(f'\n{method} {url} kept failing; check your connection and try again (progress is saved).')


def upload(path, name, key, creator):
    boundary = uuid.uuid4().hex
    meta = {'assetType': 'Decal', 'displayName': name[:50], 'description': 'Build a Terrarium UI',
            'creationContext': {'creator': creator}}
    with open(path, 'rb') as f:
        png = f.read()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="request"\r\n\r\n{json.dumps(meta)}\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="fileContent"; filename="{os.path.basename(path)}"\r\n'
            f'Content-Type: image/png\r\n\r\n').encode() + png + f'\r\n--{boundary}--\r\n'.encode()
    op = request('POST', f'{API}/assets', key, body, f'multipart/form-data; boundary={boundary}')
    op_id = op.get('operationId') or op.get('path', '').split('/')[-1]
    for _ in range(60):
        if op.get('done'):
            return op['response']['assetId']
        time.sleep(1)
        op = request('GET', f'{API}/operations/{op_id}', key)
    sys.exit(f'\nTimed out waiting for {name}; re-run to continue.')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--key', required=True, help='Open Cloud API key with asset:read and asset:write')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--user', help='your Roblox user ID')
    g.add_argument('--group', help='group ID, if the game belongs to a group')
    args = ap.parse_args()
    creator = {'userId': args.user} if args.user else {'groupId': args.group}

    files = []
    for d, _, fs in os.walk(ASSETS):
        for f in sorted(fs):
            if f.endswith('.png'):
                full = os.path.join(d, f)
                files.append((os.path.relpath(full, ASSETS)[:-4].replace(os.sep, '/'), full))
    files.sort()
    done = json.load(open(PROGRESS)) if os.path.exists(PROGRESS) else {}
    print(f'{len(files)} images, {len(done)} already uploaded')
    for i, (key, full) in enumerate(files, 1):
        if key in done:
            continue
        name = key.replace('/', '_')
        print(f'[{i}/{len(files)}] {key} ... ', end='', flush=True)
        done[key] = upload(full, name, args.key, creator)
        print(done[key])
        json.dump(done, open(PROGRESS, 'w'), indent=1)
        time.sleep(0.6)                                  # stay under the upload rate limit
    with open(OUT, 'w') as f:
        f.write('-- Decal IDs from upload_assets.py. Run ResolveImageIds.lua in the command bar to make AssetIds.\nreturn {\n')
        for key, _ in files:
            f.write(f'  [{json.dumps(key)}] = {done[key]},\n')
        f.write('}\n')
    print(f'\nDone. Wrote {OUT}\nNext: open Studio and follow step 3 in README (ResolveImageIds.lua).')


if __name__ == '__main__':
    main()
