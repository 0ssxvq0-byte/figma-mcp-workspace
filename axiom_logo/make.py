import math, sys
def mark(fg, bg, legw=108, y0=410, m=-0.24, gap=16, slide=18):
    top, base, L, R, cx = 44, 468, 56, 456, 256
    k = (cx - L) / (base - top); inner_y = base - (cx - (L + legw)) / k
    a = f"M{cx} {top}L{R} {base}H{R-legw}L{cx} {inner_y:.1f}L{L+legw} {base}H{L}Z"
    n = gap / 2 * math.sqrt(1 + m*m)
    up = f"M-50 -50H600V{y0+m*600-n:.1f}L-50 {y0-m*50-n:.1f}Z"
    lo = f"M-50 {y0-m*50+n:.1f}L600 {y0+m*600+n:.1f}V600H-50Z"
    d = math.hypot(1, m); sx, sy = -slide/d, -slide*m/d
    rect = f'<rect width="512" height="512" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{rect}
<defs><path id="A" d="{a}"/><clipPath id="u"><path d="{up}"/></clipPath><clipPath id="l"><path d="{lo}"/></clipPath></defs>
<g fill="{fg}"><use href="#A" clip-path="url(#u)"/><g transform="translate({sx:.1f} {sy:.1f})"><use href="#A" clip-path="url(#l)"/></g></g></svg>'''
if __name__ == '__main__':
    cells = [mark('#0a0a0a', '#fff', y0=y) for y in (400, 420, 440)] + [mark('#fff', '#0a0a0a', y0=420)]
    open('ref.html', 'w').write('<html><body style="margin:0;display:flex;background:#ccc">' + ''.join(f'<div style="width:400px;height:400px;margin:6px">{c.replace("<svg ", "<svg width=400 height=400 ")}</div>' for c in cells) + '</body></html>')
