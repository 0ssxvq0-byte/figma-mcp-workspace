"""Adds PowerPoint transitions + animations (pptxgenjs can't) and hides the 'wrong button' slide."""
import zipfile, re, json, sys, shutil
SRC, OUT = sys.argv[1], sys.argv[2]
anim = json.load(open('anim.json'))
NS_MC = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
P14 = 'xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"'
# slide number -> transition
BASIC = {2: '<p:wheel spokes="4"/>', 3: '<p:newsflash/>', 8: '<p:cover dir="r"/>', 13: '<p:zoom dir="in"/>', 17: '<p:fade/>'}
P14T = {1: '<p14:prism/>', 4: '<p14:vortex/>', 5: '<p14:ripple/>', 6: '<p14:flash/>', 7: '<p14:doors/>', 9: '<p14:ferris/>', 10: '<p14:honeycomb/>',
        11: '<p14:glitter/>', 12: '<p14:flythrough/>', 14: '<p14:conveyor/>', 15: '<p14:switch/>', 16: '<p14:shred/>'}
def transition(n):
    if n in BASIC: return f'<p:transition spd="slow">{BASIC[n]}</p:transition>'
    return (f'<mc:AlternateContent {NS_MC}><mc:Choice {P14} Requires="p14"><p:transition spd="slow" p14:dur="1600">{P14T[n]}</p:transition></mc:Choice>'
            f'<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')

class Ids:
    def __init__(s): s.n = 2
    def next(s): s.n += 1; return s.n

def tgt(spid): return f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
def vis(ids, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>{tgt(spid)}'
            f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')
def anim_num(ids, spid, attr, frm, to, dur):
    return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}" fill="hold"/>{tgt(spid)}<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:tavLst><p:tav tm="0"><p:val><p:strVal val="{frm}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="{to}"/></p:val></p:tav></p:tavLst></p:anim>')
def effect(ids, e, spid):
    t, d, dur = e['type'], e['delay'], e['dur']
    def wrap(cls, pid, sub, body, node='withEffect', extra=''):
        return (f'<p:par><p:cTn id="{ids.next()}" presetID="{pid}" presetClass="{cls}" presetSubtype="{sub}" fill="hold" nodeType="{node}"{extra}>'
                f'<p:stCondLst><p:cond delay="{d}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')
    if t == 'zoomIn':
        return wrap('entr', 53, 16, vis(ids, spid) + anim_num(ids, spid, 'ppt_w', '0', '#ppt_w', dur) + anim_num(ids, spid, 'ppt_h', '0', '#ppt_h', dur))
    if t == 'spinIn':
        return wrap('entr', 53, 16, vis(ids, spid) + anim_num(ids, spid, 'ppt_w', '0', '#ppt_w', dur) + anim_num(ids, spid, 'ppt_h', '0', '#ppt_h', dur) + anim_num(ids, spid, 'style.rotation', '720', '0', dur))
    if t in ('flyL', 'flyR', 'flyB'):
        if t == 'flyL': a = ('ppt_x', '0-#ppt_w/2', '#ppt_x'); sub = 8
        elif t == 'flyR': a = ('ppt_x', '1+#ppt_w/2', '#ppt_x'); sub = 2
        else: a = ('ppt_y', '1+#ppt_h/2', '#ppt_y'); sub = 4
        return wrap('entr', 2, sub, vis(ids, spid) + anim_num(ids, spid, *a, dur))
    if t == 'spin':   # endless spin (emphasis)
        return wrap('emph', 8, 0, f'<p:animRot by="21600000"><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}" fill="hold" repeatCount="indefinite"/>{tgt(spid)}<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>')
    if t == 'pulse':  # grow / shrink forever
        return wrap('emph', 6, 0, f'<p:animScale><p:cBhvr><p:cTn id="{ids.next()}" dur="700" autoRev="1" repeatCount="indefinite" fill="hold"/>{tgt(spid)}</p:cBhvr><p:by x="115000" y="115000"/></p:animScale>')
    if t == 'wobble': # rock left and right forever
        return wrap('emph', 15, 0, f'<p:animRot by="900000"><p:cBhvr><p:cTn id="{ids.next()}" dur="350" autoRev="1" repeatCount="indefinite" fill="hold"/>{tgt(spid)}<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>')
    raise SystemExit('unknown effect ' + t)

def timing(slide_xml, effects):
    ids = Ids()
    spids = dict(re.findall(r'<p:cNvPr id="(\d+)" name="([^"]*)"', slide_xml)[::1][i][::-1] for i in range(0))  # placeholder
    spids = {name: sid for sid, name in re.findall(r'<p:cNvPr id="(\d+)" name="([^"]*)"', slide_xml)}
    outer, inner = ids.next(), ids.next()
    body = ''
    for e in effects:
        if e['name'] not in spids: raise SystemExit(f"shape {e['name']} not found")
        body += effect(ids, e, spids[e['name']])
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            f'<p:par><p:cTn id="{outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
            f'<p:par><p:cTn id="{inner}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>'
            '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>'
            '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')

zin = zipfile.ZipFile(SRC); zout = zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', item.filename)
    if m:
        n = int(m.group(1)); x = data.decode('utf8')
        extra = transition(n)
        if str(n) in anim: extra += timing(x, anim[str(n)])
        x = x.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + extra) if '</p:clrMapOvr>' in x else x.replace('</p:cSld>', '</p:cSld>' + extra)
        if n == 17: x = x.replace('<p:sld ', '<p:sld show="0" ', 1)
        data = x.encode('utf8')
    zout.writestr(item, data)
zout.close(); print('written', OUT)
