#!/usr/bin/env python3
"""
Packs every image the UI uses into a few 1024 x 1024 sprite sheets, so the whole UI needs only a handful
of uploads. Writes RbxmExport/Sheets/Sheet_NN.png and RbxmExport/build/sheets.json.

Images are stored at design size (1920 x 1080 canvas; vines at 75%), transparent edges trimmed where safe,
with 2 px padding so neighbours never bleed. Rules:
  - Backdrop_Dim is not packed (the builder draws it as a native Frame)
  - one Burst image is packed; the builder tints it per rarity
  - the stud tile gets its own sheet, because tiling needs a whole image
Usage: python3 tools/studio/pack_sheets.py [StudioExport] [RbxmExport]
"""
import json, os, sys
from PIL import Image

SRC = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'StudioExport')
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else 'RbxmExport')
SHEET, PAD, MAXSIDE = 1024, 2, 1016
KEEP_EVEN_UNUSED = {'Sparkle', 'Burst_Common', 'Header_Common', 'Window_Common'}

m = json.load(open(os.path.join(SRC, 'manifest.json')))
os.makedirs(os.path.join(OUT, 'Sheets'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'build'), exist_ok=True)

key = lambda f: f[len('Assets/'):-len('.png')]
items, entries = [], {}
for a in m['assets']:
    name = a['name']
    if name == 'Backdrop_Dim' or (name.startswith('Burst_') and name != 'Burst_Common'):
        continue
    if not a['instances'] and name not in KEEP_EVEN_UNUSED:
        continue
    k = key(a['file'])
    im = Image.open(os.path.join(SRC, a['file'])).convert('RGBA')
    dw, dh = a['size']                              # design px (includes the export margin)
    t = 0.75 if k.startswith('18_Vines') else 1.0
    t = min(t, MAXSIDE / max(dw, dh))
    tw, th = max(1, round(dw * t)), max(1, round(dh * t))
    im = im.resize((tw, th), Image.LANCZOS)
    trim = [0, 0, 0, 0]
    # only pieces that never hold other pieces are trimmed (matches BuildUI's nesting rules)
    leaf = (a.get('spin') or a.get('vineSet') or 'Glow' in name or 'Rays' in name or name.startswith(('Icon_', 'Sticker', 'Stamp'))
            or 'Sparkle' in name or name.startswith('Burst_'))
    can_trim = leaf and not a.get('slice') and not a.get('tile') and not a.get('button')
    if can_trim:
        bb = im.getbbox()
        if bb:
            trim = [bb[0] / t, bb[1] / t, (tw - bb[2]) / t, (th - bb[3]) / t]   # design px removed from each side
            im = im.crop(bb)
    e = {'t': round(t, 4), 'trim': [round(v, 2) for v in trim]}
    if a.get('slice'):
        s = a['slice']
        f = t * dw / a['pixels'][0]                 # original image px -> sheet px
        e['slice'] = [round(s['left'] * f, 1), round(s['top'] * f, 1), round(s['right'] * f, 1), round(s['bottom'] * f, 1)]
        e['sliceScale'] = round(1 / t, 4)
    if a.get('tile'):
        e['tile'] = a['tile']
    entries[k] = e
    if a.get('tile'):
        im.save(os.path.join(OUT, 'Sheets', 'Sheet_Studs.png'))
        e.update(sheet='Sheet_Studs', x=0, y=0, w=im.width, h=im.height)
        continue
    items.append((k, im))

# shelf packing, tallest first; several sheets
items.sort(key=lambda kv: (-kv[1].height, -kv[1].width))
sheets = []                                          # each: {'img', 'shelves': [[y, h, x]]}
def place(im):
    w, h = im.width + 2 * PAD, im.height + 2 * PAD
    for si, s in enumerate(sheets):
        for shelf in s['shelves']:
            if h <= shelf[1] and shelf[2] + w <= SHEET:
                x, y = shelf[2], shelf[0]; shelf[2] += w
                return si, x, y
        used = sum(sh[1] for sh in s['shelves'])
        if used + h <= SHEET:
            s['shelves'].append([used, h, w])
            return si, 0, used
    sheets.append({'img': Image.new('RGBA', (SHEET, SHEET), (0, 0, 0, 0)), 'shelves': [[0, h, w]]})
    return len(sheets) - 1, 0, 0
for k, im in items:
    si, x, y = place(im)
    sheets[si]['img'].paste(im, (x + PAD, y + PAD))
    entries[k].update(sheet=f'Sheet_{si + 1:02d}', x=x + PAD, y=y + PAD, w=im.width, h=im.height)

names = []
for i, s in enumerate(sheets):
    name = f'Sheet_{i + 1:02d}'
    # crop unused space at the bottom so uploads are smaller (offsets stay valid)
    used = max(sh[0] + sh[1] for sh in s['shelves'])
    s['img'].crop((0, 0, SHEET, min(SHEET, used))).save(os.path.join(OUT, 'Sheets', name + '.png'), optimize=True)
    names.append(name)
if any(e.get('sheet') == 'Sheet_Studs' for e in entries.values()):
    names.append('Sheet_Studs')
json.dump({'sheets': names, 'images': entries}, open(os.path.join(OUT, 'build', 'sheets.json'), 'w'), indent=1)
print(f'{len(entries)} images -> {len(names)} sheets: {", ".join(names)}')
