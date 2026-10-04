# Approximate slide preview (LibreOffice is unavailable here): draws every shape of the .pptx in Chromium.
import sys, base64, html, asyncio
from pptx import Presentation
from pptx.util import Emu
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.oxml.ns import qn
P = Presentation(sys.argv[1]); SW, SH = P.slide_width, P.slide_height
S = 1920 / SW
def b64(blob, mime='image/png'): return f'data:{mime};base64,' + base64.b64encode(blob).decode()
def px(v): return v * S
def color_of(fill):
    try:
        if fill.type == 1: return '#' + str(fill.fore_color.rgb)
    except Exception: pass
    return None
slides = []
for n, sl in enumerate(P.slides, 1):
    bgc = '#fff'; bgi = ''
    bg = sl._element.find('.//' + qn('p:bg'))
    if bg is not None:
        blip = bg.find('.//' + qn('a:blip'))
        if blip is not None:
            part = sl.part.related_part(blip.get(qn('r:embed'))); bgi = f'background-image:url({b64(part.blob)});background-size:100% 100%;'
        c = bg.find('.//' + qn('a:srgbClr'))
        if c is not None: bgc = '#' + c.get('val')
    out = ''
    for sh in sl.shapes:
        st = f'left:{px(sh.left)}px;top:{px(sh.top)}px;width:{px(sh.width)}px;height:{px(sh.height)}px;transform:rotate({sh.rotation}deg);'
        if sh.shape_type == MSO_SHAPE_TYPE.PICTURE:
            out += f'<img src="{b64(sh.image.blob)}" style="position:absolute;{st}">'
        elif sh.has_chart if hasattr(sh, 'has_chart') else False:
            out += f'<div style="position:absolute;{st}background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px">[native pie chart]</div>'
        elif sh.shape_type in (MSO_SHAPE_TYPE.AUTO_SHAPE, MSO_SHAPE_TYPE.TEXT_BOX):
            fill = color_of(sh.fill) if sh.fill else None
            prst = sh._element.find('.//' + qn('a:prstGeom')); kind = prst.get('prst') if prst is not None else 'rect'
            rad = '50%' if kind == 'ellipse' else (f'{px(Emu(int(min(sh.width, sh.height) * 0.25)))}px' if kind == 'roundRect' else '0')
            shadow = 'box-shadow:0 6px 10px rgba(0,0,0,.35);' if sh._element.find('.//' + qn('a:outerShdw')) is not None else ''
            clip = 'clip-path:polygon(0 25%,60% 25%,60% 0,100% 50%,60% 100%,60% 75%,0 75%);' if kind == 'rightArrow' else ''
            paras = ''
            if sh.has_text_frame:
                for p in sh.text_frame.paragraphs:
                    al = {1: 'left', 2: 'center', 3: 'right'}.get(p.alignment, 'left')
                    runs = ''
                    for r in p.runs:
                        f = r.font; size = (f.size.pt if f.size else 18) * S * 12700
                        col = '#000'
                        try: col = '#' + str(f.color.rgb)
                        except Exception: pass
                        ln = r._r.find('.//' + qn('a:ln')); stroke = ''
                        if ln is not None and ln.get('w'):
                            w = int(ln.get('w')) / 12700 * S * 12700 / 12700
                            sc = ln.find('.//' + qn('a:srgbClr')); stroke = f'-webkit-text-stroke:{max(1, w):.1f}px #{sc.get("val") if sc is not None else "000"};paint-order:stroke fill;'
                        fam = f.name or 'Comic Sans MS'
                        runs += f'<span style="font-size:{size}px;color:{col};font-weight:{700 if f.bold else 400};font-family:\'{fam}\',\'Comic Neue\',\'DejaVu Sans\',sans-serif;{stroke}">{html.escape(r.text)}</span>'
                    paras += f'<div style="text-align:{al};margin-bottom:{px(p.space_after.pt*12700) if p.space_after else 0}px">{runs or "&nbsp;"}</div>'
                va = {None: 'center'}.get(None)
                anchor = sh._element.find('.//' + qn('a:bodyPr')).get('anchor', 't')
                jc = {'t': 'flex-start', 'ctr': 'center', 'b': 'flex-end'}[anchor]
            else: jc = 'center'
            out += f'<div style="position:absolute;{st}{shadow}{clip}background:{fill or "transparent"};border-radius:{rad};display:flex;flex-direction:column;justify-content:{jc};padding:6px;box-sizing:border-box;overflow:visible;line-height:1.1">{paras}</div>'
    slides.append(f'<div class="s" style="background-color:{bgc};{bgi}">{out}</div>')
page = '<html><body style="margin:0;background:#888"><style>.s{position:relative;width:1920px;height:%dpx;overflow:hidden;margin:0 0 8px 0}</style>%s</body></html>' % (int(SH * S), ''.join(slides))
open('qa/preview.html', 'w').write(page)
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome'); pg = await b.new_page(viewport={'width': 1920, 'height': int(SH * S)})
        await pg.goto('file:///' + __import__('os').path.abspath('qa/preview.html'))
        els = await pg.query_selector_all('.s')
        for i, e in enumerate(els, 1): await e.screenshot(path=f'qa/s{i}.png')
        await b.close()
asyncio.run(main())
