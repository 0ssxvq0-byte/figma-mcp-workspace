# Screens: implementation notes

Every screen has a full preview in `Concepts/_Preview_NN_Name.png` (numbered in the order a player meets them)
and one transparent PNG per component in its own folder.

## Icons: voxel (pixel) style only
- `tools/voxel/models.js` holds every icon model; `node tools/voxel/render.js` renders them into
  `tools/hud/assets/voxel/`. `ONLY=Terrarium,Egg_Moss node tools/voxel/render.js` renders a subset.
- Models can return `glass` voxels as well as solid ones; glass is drawn see-through (used by the Terrarium).
- New this round: Terrarium (from the in-game tank: dark frame, blue glass, rock back wall, vent strip with
  latch, pebble compartment), all seven eggs (Moss from the reference; Pebble, Fern, Amber, Dusk, Canopy and
  Primordial are placeholders until the egg sheet arrives), Field Guide book, Stag Beetle, the Keeper.

## HUD
- Left: Daily Rewards (full bar), Store + Field Guide (squares), Rebirth (full bar). Rebirth counter above Shillings.
- Right: Starter Pack, then the **Eggs** button with a tilted `12/30` count. The egg-banked animation flies into it.
- **Wilds indicator** (`Notifications/Wilds_Indicator`) sits beside the settings button, only while PvP is on.

## My Terrarium (right-side square panel)
- Opens on the right and hides the Starter Pack and Eggs button while open.
- Tabs: Creatures, Holding (count badge), Decor (opens Edit Tank), Stats.
- Holding: a yellow note explains why creatures are waiting; each row has Move to Tank (greyed while full)
  and Release. Footer: Upgrade Tank, Release Commons (opens the bulk release dialog).

## Keeper's Shop
- Keeper portrait (placeholder voxel NPC) with the speech bubble for the rotating facts/jokes.
- Restock countdown card, six slots: rarity tag, tilted stock label (`x3`, `1 left`), price button.
- States: normal, `SOLD OUT` stamp with grey button, too expensive (grey button, red price).

## Eggs, Backdrops, Rebirth
- Eggs: capacity bar, egg cards grouped by type with tilted counts (quantity labels tilt about 9 degrees),
  empty types greyed, detail panel with hatch time, what it can hatch and **Incubate**.
- Backdrops: 10 launch backdrops. Owned: Equip / Equipped. Locked: greyed thumbnail, padlock and where to get it.
- Rebirth: requirements with progress bars, rewards, locked and ready buttons.

## Hatch
1. `Hatch_Cracking`: the egg shakes and cracks ("Hatching...").
2. `Hatch_Reveal`: a Field Guide style card, not a full-screen burst. Header and window use the rarity colour,
   the creature stands on the broken shell, a `NEW SPECIES!` sticker only on first hatch, then the field note,
   entry number and **Add to Terrarium** (`Btn_SendToHolding` when full).
- Scale by rarity: Common = card pops in quickly. Rare+ = rays turn slowly in the window. Legendary/Mythic =
  add the full-screen `Burst_<Rarity>` behind the card and a short screen shake.

## Release
- Common: single confirm. Epic and above: **Hold to Release** (fill shows progress). Bulk: tick list of Commons.
- Every dialog says "Releasing keeps your Field Guide entry."

## Notifications
- Red Wilds banner, green safe banner, rare hatch announcement strip (rarity-coloured name), toasts
  (egg ready, new species, not enough Shillings, tank full, inventory full), egg-banked flight to the Eggs button,
  and the Welcome Back dialog.

## Incubator pop-ups
- Small semi-transparent cards over each incubator, same frame as the panels: rarity-coloured header,
  egg, timer bar, and one action (Skip for Robux / HATCH / Unlock).
