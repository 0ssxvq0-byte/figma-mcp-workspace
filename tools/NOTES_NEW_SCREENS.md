# New screens: implementation notes

## Icons: two 3D pipelines
- `tools/voxel/models.js`: voxel models (Server Luck clovers, events). Chunky on purpose.
- `tools/voxel/parts.js`: **part-based** models built from smooth Roblox-style parts (bevelled blocks,
  cylinders, spheres, tubes). Used for anything prominent: Terrarium, Moss Egg, Satchel, Shilling
  coin and stacks, Field Guide journal, VIP crown, Seedling, Stag Beetle, the 7 terrarium layers and 4 decor
  items.
- `node tools/voxel/render.js` renders both into `tools/hud/assets/voxel/`. Part models replace any voxel
  model with the same name.

## My Terrarium hub (left square panel)
- Opens from the **My Terrarium** tab and covers the left menu, as the brief says.
- Tabs: Creatures · Holding (red count badge) · Decor (opens the Edit Tank panel) · Stats.
- **Creatures**: capacity bar, a 4×2 grid of creature cards (rarity colour, rarity dot, job badge), and an
  empty-slot card. The selected card lifts and gets a white ring. The detail strip shows the creature, rarity
  and job pills, what the job does, **Move to Holding**, and **Release** with its Shilling value.
- **Stats**: Bioactivity, income multiplier and capacity tiles, then the breakdown. Each input
  (Waste, Mould, Prey, Flora, Diversity) has a bar with its **good zone** shaded green and a marker for where the
  tank is now, plus a status chip. A yellow hint line at the bottom gives the single most useful fix.

## Settings (with Codes)
- Audio: Music and Ambience sliders. World: Environment Animation toggle, Graphics **stepped** slider
  (Low / Medium / High / Ultra). Creatures: Arachnophobia and Cute Bugs toggles. Gameplay: PvP toggle.
- Codes box at the bottom: text box, Redeem, Credits. States: `Code_Success` and `Code_Invalid`.
- Opened from the new gear button at the top-left of the HUD.

## Hatch Reveal
- Full-screen overlay: rarity-tinted backdrop, rays, sparkles, the creature large, a **NEW SPECIES!** ribbon,
  the name, rarity and job pills, a real fact, and **Add to Terrarium** (or `Btn_SendToHolding` when full).
- `HatchReveal/Burst_<Rarity>.png` gives a ray burst in each of the six rarity colours.
- Suggested scaling: Common = quick pop (burst only, 0.6 s). Rare+ = rays spin in. Legendary/Mythic = screen
  shake, longer build-up, rays rotate continuously and the banner bounces.

## Incubator pop-ups
- Small, semi-transparent BillboardGui-style cards that float over each incubator, with a pointer at the
  bottom. Three states:
  - **Incubating**: progress ring around the egg, time left, **Skip** for Robux.
  - **Ready**: green glowing ring, the egg tilts and shakes, **HATCH**.
  - **Locked**: padlock, slot number, unlock cost.
