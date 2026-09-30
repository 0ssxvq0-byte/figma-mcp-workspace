#!/bin/sh
# Assembles StudioExport/ (after tools/hud/studio_export.js has run) and zips it.
set -e
cd "$(dirname "$0")/../.."
node tools/studio/make_layout.js StudioExport
mkdir -p StudioExport/Studio StudioExport/Previews
cp -r tools/studio/Runtime tools/studio/Client tools/studio/Server tools/studio/Tools tools/studio/default.project.json StudioExport/Studio/
[ -f StudioExport/Studio/Modules/AssetIds_Decals.lua ] || printf -- '-- replaced by Tools/upload_assets.py\nreturn {}\n' > StudioExport/Studio/Modules/AssetIds_Decals.lua
cp tools/studio/README.md StudioExport/README.md
cp tools/studio/AI_BUILD_PROMPT.md StudioExport/AI_BUILD_PROMPT.md
cp tools/hud/assets/voxel/Layer_Moss.png StudioExport/Assets/00_Shared/Icons/Icon_Layer_Moss.png
python3 - <<PY
from PIL import Image
import glob,os
for f in sorted(glob.glob("Concepts/_Preview_*.png")):
    im=Image.open(f).convert("RGBA"); bg=Image.new("RGBA",im.size,(38,51,43,255)); bg.alpha_composite(im)
    bg.convert("RGB").save("StudioExport/Previews/"+os.path.basename(f)[9:-4]+".jpg",quality=85)
PY
rm -f Build_a_Terrarium_UI_Studio.zip
zip -qr Build_a_Terrarium_UI_Studio.zip StudioExport
ls -la Build_a_Terrarium_UI_Studio.zip
