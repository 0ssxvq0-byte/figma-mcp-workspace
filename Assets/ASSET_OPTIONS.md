# Getting high-quality assets: options and recommendation

## TL;DR

- **Robux:** use Roblox's official icon; never generate one. In-game: `rbxasset://textures/ui/common/robux.png`
  (also `@2x`, `@3x`). The file is in your Studio install at
  `%LOCALAPPDATA%\Roblox\Versions\<version>\content\textures\ui\common\robux@3x.png`. Send it over and it'll
  replace the stand-in mark in every mockup.
- **Most icons:** voxel models rendered in 3D (`tools/voxel/`). They're blocky like the game world, lit
  consistently, free, and quick to re-render after any change. No AI involved.
- **Higgsfield:** the connector works through MCP, but it isn't the fix. See below.

## Higgsfield + MCP (tested from this session)

| | |
|---|---|
| Connection | Works. The Higgsfield MCP connector is attached to this session and responds. |
| Your account | Free plan, **0 credits**. Nothing can be generated right now. |
| Free trial | 3 days, **100 credits, MCP-only**, card required. **Auto-charges $49/month** unless cancelled before day 3. |
| Cheapest paid plan shown | Plus: $49/month, or $29/month billed annually (1,000 credits/month). |
| What it could do | Text-to-image and image-to-image (with style references), background removal, upscaling, image-to-3D (GLB mesh), a Blender-based 3D scene builder. |

**Why it isn't the fix:** Higgsfield doesn't have its own image model. For images it routes
to Nano Banana (Google Gemini's image model) and GPT Image (ChatGPT's), the same engines you already tried.
The results would have the same "AI look". The only real improvement is convenience (I could iterate directly).

**When it *would* be worth it:** a one-off burst of a few hero illustrations, using the 3-day trial and
cancelling immediately. Not for a full, consistent icon set.

## Options compared

| Option | Quality / consistency | Cost | Who does the work |
|---|---|---|---|
| Official assets (Robux, Roblox UI textures) | Exact | Free | You send me the file once |
| **Voxel models rendered in code** (`tools/voxel`) | High and identical lighting, outline and scale every time; matches the blocky world | Free | Me, directly |
| Existing icon packs (Free Icon Pack, Fluent Emoji) | Good but mixed styles | Free | Me |
| Build in Roblox Studio + ViewportFrame | Uses the game's real models, so it's a perfect match | Free | You build, I can script the rig |
| Blender | Highest ceiling | Free | Slow; needs you running Blender locally |
| AI image generation (ChatGPT / Gemini / Higgsfield) | Inconsistent, "AI look" | Free–$49/month | You, then me to clean up |

## Voxel pipeline

- Models: `tools/voxel/models.js`. Each icon is a few lines of code (pixel masks, spheres, stacks).
- Render: `node tools/voxel/render.js` renders every model to `tools/hud/assets/voxel/*.png` (transparent, trimmed).
- Current set: Server Luck clovers (3 tiers), cash packs (4 tiers), bioactivity seedling, Toxic Rain, Night Time.
- Next candidates: daily reward crates, calendar, shop basket, index journal, terrarium jar (My Base), critters.
