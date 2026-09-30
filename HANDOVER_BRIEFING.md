# Build a Terrarium: UI Handover Briefing (for the next AI)

You are taking over the UI of a Roblox game called **Build a Terrarium**. A previous AI session (no access to Roblox Studio) designed the whole UI as an HTML mockup, exported it as images, and generated a ready-made Roblox place file with every screen pre-built plus runtime scripts. You have the live Studio MCP connection that the previous AI lacked. **The visual foundation is approved. Do not rebuild or redesign it.** Your job is to inspect it, fix what is broken, finish the functionality, and integrate it into the real game.

The previous AI could never run Studio. Everything below was verified only by offline simulation (layout maths, image compositing), **not by running it in Studio**. Treat every "implemented" claim as "written, untested in a real Studio session" unless the user has confirmed otherwise.

---

## 0. TL;DR and rules of engagement

1. The UI lives in `StarterGui` as about 21 ScreenGuis named `UI_<Screen>` plus one named `UI_Core` (scripts and config).
2. All images come from **14 sprite sheets** (uploaded by the user as Images). Each ImageLabel/ImageButton is cropped with `ImageRectOffset`/`ImageRectSize`. The sheet IDs live in `StarterGui.UI_Core.SheetIds` (14 StringValues).
3. Text is **never baked into images**. Every label is a real TextLabel (Comic Neue Angular Bold, dark stroke, white gradient fill).
4. Creatures and eggs are **not** in the images. Empty `CreatureSlot` / `EggSlot` frames mark where the user's 3D models or viewports go.
5. **Do not regenerate the hierarchy.** The runtime finds pieces by **name** (`Btn_Close_X`, `Tab_*`, `Toggle_On_Track`, `ShillingsAmount`, …). Renaming breaks behaviour. Edit in place, add next to things, keep names.
6. Before changing any structure, inspect it through MCP first. Fix with small, targeted edits.
7. The user mostly works in Roblox Studio (and VS Code). They do **not** want Rojo.

---

## 1. Design intent

### Overall identity
A polished, vibrant, chunky Roblox UI with a subtle forest/terrarium identity. The icon style is **blocky voxel / pixel** (3D-rendered voxel models, flat-lit, hard edges), matching the Roblox blocky look.

### Explicit "do not" list (from the user)
- No heavy gold outlines.
- No wood-and-moss-heavy "fantasy RPG" look.
- No generic, soft, gradient-blob "AI slop" look.
- The Robux icon must be the accurate Robux icon.
- Keep the brief's terminology exactly: **Shillings** (currency), **My Terrarium**, **Field Guide**, **Creatures**, **Store**, **Keeper**, **Holding**, **Release**, **Incubator**, **Bioactivity**, **Backdrop**. Never write "coins", "gems", "pets", "zoo", "index" as labels (the Field Guide was once called Index; it is Field Guide now).

### Visual language
- **Panels:** dark navy bodies (native Frames, `UICorner` + `UIStroke` + a faint tiled "stud" texture from `Sheet_Studs` via `ScaleType = Tile`), with a bright coloured **Header_Bar** per panel (colour matches the panel's purpose). Panels carry a close button `Btn_Close_X` (red X).
- **Vines:** decorative vine sets hang over panel edges. Five variations (`VineSet` attribute 1–5), "Back" layer behind the panel and "Front" layer over its edge. Set 1 is visible by default; `PanelManager` randomises per open.
- **Text:** Comic Neue Angular Bold (`rbxasset://fonts/families/ComicNeueAngular.json`, Bold). Fallback is Fredoka One if the font is missing. White fill with a vertical `UIGradient`; `UIStroke` colour `Color3.fromRGB(11, 15, 29)`, round line join, thickness about 9% of text size at 1080p (stored in attribute `BaseThickness`; `Effects` rescales it on other screen sizes).
- **Rarity colour system** (used on egg frames, creature cards, Hatch Reveal headers/windows/bursts): Common, Uncommon, Rare, Epic, Legendary, Mythic (six colours; the Hatch Reveal has a header, window and full-screen burst per rarity). Exact hex values are in the original mockup and baked into the images; if you need them, sample from the sheet images or the `Burst_*` tints in `BuildUI` output.
- **Buttons:** chunky, slightly glossy, rounded; grow on hover, squash on press.
- **Decor effects:** rotating ray bursts behind hero items (Starter Pack, Day 7 card, Rebirth hero, Hatch window), twinkling sparkles, pulsing glows, bouncing `!` badges.
- **Design canvas:** 1920 × 1080. Everything is scaled from that, pinned to screen edges/corners (see hierarchy). Mobile (phone aspect, about 2340 × 1080) was checked offline; touch targets must stay large.

### Motion and sound (intent)
- Button hover grows about 6%, press squashes to about 90%, spring back; soft hover tick + bubbly click.
- Panels slide up from the bottom; Edit Tank and My Terrarium slide in from the right; dialogs (Hatch Reveal, Release, Welcome Back) pop in with a back-ease scale.
- While Edit Tank is open, the HUD fades to about 60% transparency.
- Shillings count up/down with floating `+1.2K` (green, rising) or `-500` (red, falling).
- Bioactivity bar fills smoothly; every 10 points: white flash, plant bounce, sparkles, level-up sound.
- Toasts slide down; Wilds banners drop in; rare-hatch announcements pop; event card slides in from the right while the Active Events list slides up from the bottom; a banked egg flies into the Eggs button.
- Sounds: **none assigned**. `Runtime/UIConfig.Sounds` holds 16 keys, all `0`.

---

## 2. What exists and how it is packaged

### The place file
`BuildATerrarium_UI.rbxlx` (also `BuildATerrarium_UI_StarterGui.rbxm`, same StarterGui content only). Contains:

| Location | Contents |
|---|---|
| `StarterGui.UI_<Screen>` | One ScreenGui per screen, each with a `Root` frame (transparent, full-screen; panels slide by moving `Root`) |
| `StarterGui.UI_Core` | `SheetIds` (Configuration with 14 StringValues), `Runtime` (ModuleScripts), `UIController` (LocalScript), `UIDemo` and `WorldDemo` (demo LocalScripts), disabled `README_FIRST` script. `UI_Core.Enabled = true` so its scripts run |
| `ServerScriptService.TerrariumNavigation` | Server half of the HUD travel buttons |
| `Workspace` | A small **test world** (terrarium part, Keeper/Upgrades stands, ProximityPrompts with `OpensPanel` attributes, demo incubator/eggs) for testing only. Delete it when integrating |

### Screens (`UI_<name>`)
`MainHUD`, `DailyRewards`, `Store`, `FieldGuide`, `Rebirth`, `KeepersShop`, `Upgrades`, `MyTerrarium_Creatures`, `MyTerrarium_Holding`, `MyTerrarium_Stats`, `EditTank_Layers`, `EditTank_Drag`, `EditTank_Backdrops`, `EggInventory`, `Incubator` (small pop-up templates), `HatchReveal`, `Release`, `Notifications` (templates, start hidden), `WelcomeBack`, `Settings` (also holds Codes).

### Sprite sheets and asset IDs
- `Sheet_01 … Sheet_13` + `Sheet_Studs` (the stud tile needs a whole image for tiling). About 362 images packed. Each is ≤ 1024 px wide/tall.
- The user already imported them (as **Images**, not Decals) and supplied these IDs in this order:

| Sheet | ID |
|---|---|
| Sheet_01 | 85440929472060 |
| Sheet_02 | 119960524412695 |
| Sheet_03 | 86544932994138 |
| Sheet_04 | 92786978404585 |
| Sheet_05 | 72886392423379 |
| Sheet_06 | 83407090024761 |
| Sheet_07 | 105360837456071 |
| Sheet_08 | 120135694523641 |
| Sheet_09 | 115500063354790 |
| Sheet_10 | 83695407876242 |
| Sheet_11 | 124704106508983 |
| Sheet_12 | 139308160076078 |
| Sheet_13 | 74966954633328 |
| Sheet_Studs | 139153189887382 |

  **Caveat:** this mapping assumes the user copied IDs in name order. Verify by checking a few images visually. If a region shows the wrong picture, the sheets are swapped.
- They are linked by running, in the command bar:
  ```lua
  require(game.StarterGui.UI_Core.Runtime.SetSheetIds)({ Sheet_01 = 85440929472060, Sheet_02 = 119960524412695, Sheet_03 = 86544932994138, Sheet_04 = 92786978404585, Sheet_05 = 72886392423379, Sheet_06 = 83407090024761, Sheet_07 = 105360837456071, Sheet_08 = 120135694523641, Sheet_09 = 115500063354790, Sheet_10 = 83695407876242, Sheet_11 = 124704106508983, Sheet_12 = 139308160076078, Sheet_13 = 74966954633328, Sheet_Studs = 139153189887382 })
  ```
  This writes the IDs into `SheetIds` and applies them to every image in StarterGui (so the edit view shows real pictures). At runtime `Images.applyAll` re-applies them in PlayerGui. Missing IDs show coloured placeholder boxes plus an on-screen yellow notice.
- **Limitation:** images are packed at design resolution (1920×1080 space), so they can look slightly soft on very large/high-DPI displays. High-res re-export is possible from the source mockup but is not available to you; the user has the repo.
- `Backdrop_Dim` is not an image; it is a native Frame. One `Burst` image is shared and tinted per rarity.

### Image conventions
Each ImageLabel stores attributes `Sheet` and `ImageKey` (key = path inside the export, e.g. `01_MainHUD/Buttons/Btn_DailyRewards`). `Images.apply(gui, key)` re-points any GUI object to another exported image. The map is `UI_Core.Runtime.ImageMap` (generated; do not hand-edit). 9-slice images use `ScaleType = Slice` with computed `SliceCenter` and `SliceScale`.

### Source repository (user's, for re-generation if ever needed)
`/home/user/figma-mcp-workspace`, branch `claude/hello-uz5zcf`:
`tools/hud/hud.html` (the mockup), `tools/voxel/` (three.js voxel icon renderer), `tools/hud/studio_export.js` (exports), `tools/studio/pack_sheets.py` (sheet packer), `tools/studio/build_place.luau` (Lune script that generates the `.rbxlx`), `tools/studio/Runtime|Client|Server/*.lua` (all scripts). You likely won't touch these; everything you need is in the place file.

---

## 3. UI hierarchy (how to read it through MCP)

```
StarterGui
├─ UI_MainHUD (ScreenGui)
│  └─ Root (Frame, full screen, transparent)
│     ├─ <Piece>_Holder (Frame, pinned to a screen corner/edge, has UIAspectRatioConstraint)
│     │   └─ <Piece> (ImageButton/ImageLabel, cropped from a sheet)
│     │        ├─ Text_<label> / named TextLabels (centre-anchored, stroke + gradient)
│     │        └─ nested children (badges, icons, fills)
│     ├─ PanelGroup frames (a panel + its overhanging decorations, so they scale as one)
│     └─ Vines (several sets, `VineSet` attribute 1–5)
├─ UI_DailyRewards … UI_Settings (same pattern; Root positioned off-screen when closed)
├─ UI_Core (scripts/config)
```

Rules the builder followed (keep them when editing):
- **Top-level pieces** sit in a `<Name>_Holder` frame anchored to the nearest screen corner/edge with a `UIAspectRatioConstraint`, so the HUD stays in its corner on phone/tablet/ultrawide.
- **Everything else is nested by containment** (text inside its button, buttons inside their card, cards inside the panel). Children are **centre-anchored** (AnchorPoint 0.5, 0.5) so scaling/bouncing happens from the middle.
- Things that cannot hold children: fill images (e.g. the Bioactivity fill) and similar leaves. Text that sits on them is a sibling, not a child.
- Spinning rays are inside a `CanvasGroup` named `RaysClip` so they clip to their card. Anything with attribute `Spin` rotates (`Effects`).
- **Alternate states** (Rebirth ready, Send to Holding, bursts, Claimed/Locked, unselected tab) are built but hidden, marked with attribute `AlternateState`. Swap visibility or call `Images.apply` to change state; do not duplicate.
- Panels' dark bodies are native Frames (`UICorner`, `UIStroke`, tiled stud texture child).
- Named live labels scripts update: `ShillingsAmount`, `BioactivityValue`, `RebirthCount`, `EggsCount`, `RestockTimer`, `IncomeMultiplier`. Other labels are `Text_<their text>`.
- Naming prefixes: `Btn_` button, `Tab_` tab, `Icon_`, `Card_`, `..._Row`, `Header_Bar`, `Sticker_`, `Stamp_`, `Badge_`, `Checkbox_On/Off`, `Toggle_On_Track/Off_Track`, `Slider_Track`, `CreatureSlot`, `EggSlot`.
- Attributes used: `Sheet`, `ImageKey`, `Spin`, `Bounce`, `Tilt`, `VineSet`, `AlternateState`, `Templates` (on Notifications/Incubator ScreenGuis), `BaseThickness`, `FillFraction`, `OpensPanel` (on ProximityPrompts), `PopupState`.
- Hierarchy has been simulated but **not opened in Studio**: expect nesting, sizing, or z-order glitches in places (see section 7).

---

## 4. Screens: purpose, contents, navigation

**Main HUD (`UI_MainHUD`, always visible).**
- Left menu column (top to bottom): **Daily Rewards** (wide button, with bouncing `!` badge when claimable), **Store** (smaller bar, Robux icon), **Field Guide** (larger tilted voxel book icon), **Rebirth**, plus **Eggs** button with counter (`EggsCount`, tilts ±9°).
- Top centre tabs: **Shop | My Terrarium | Upgrades**.
- Top corner: **Shillings** (`ShillingsAmount`) with a plus (`Btn_AddShillings_Plus`, opens Store), rebirth counter (`RebirthCount`), **Settings** gear.
- **Bioactivity bar** (background, fill, plant icon, `BioactivityValue`).
- **Starter Pack** offer (gift icon, Robux price, spinning rays, glow).
- **Keeper restock bar** (`RestockTimer`).
- **Active Events** (bottom right): only event icons are images; rows are TextLabels with a gradient fade. List slides up from bottom on event start.
- Income multiplier label (`IncomeMultiplier`).

**Navigation intent (important):** the HUD tabs **do not open panels**; they **teleport** the player. My Terrarium → player's terrarium; Shop → the Keeper NPC; Upgrades → the upgrades NPC. The panels then open from **ProximityPrompts** on those objects (attribute `OpensPanel`). Side buttons (Daily Rewards, Store, Field Guide, Rebirth, Eggs, Settings, the plus) open their panel directly and toggle it closed on second press. `HUDNavigation` falls back to opening the panel directly if the travel remote/destination is missing, so the UI can be tried without the world.

**Other screens**
| Screen | Purpose / content |
|---|---|
| `DailyRewards` | 7-day calendar, **Claim All**, day cards (blue/purple/gold, Day 7 rainbow with rays + twinkle), per-card Claim / Claimed / Locked state, OP sticker, selection ring (`00_Shared/Selection_Ring_9Slice`) on the selected day |
| `Store` | Categories (selected/unselected tabs), passes, server luck, Shilling packs, Robux buy buttons |
| `FieldGuide` | Creature discovery book: cards per rarity + undiscovered silhouettes, entry detail, job badge, rarity dot, milestone cards |
| `Rebirth` | Hero card with rays, requirement card with check marks, reward cards, locked/ready button states |
| `KeepersShop` | **Grow-a-Garden style** stock list (no Keeper character model; "New Stock" sits in the header): rows with item wells per rarity, Buy/disabled, Sold Out stamp, restock pill |
| `Upgrades` | Upgrade rows with Upgrade button |
| `MyTerrarium_Creatures / Holding / Stats` | Tabs of My Terrarium: creature cards + empty slot, detail strip; **Holding** (creatures in storage; "Send to Holding"); **Stats** (stat tiles, zone bar with marker, status chips, hint bar) |
| `EditTank_Layers / Drag / Backdrops` | Terrarium editing: layer stack (soil/filter/clay), item cards, In Tank tag, tools, Done, drag ghost + drop ring. **Backdrops is a tab of Edit Tank** (on-tank box, 10 backdrop cards, Equip/Equipped). Slides in from the right; HUD fades |
| `EggInventory` | Egg cards per rarity + empty, coming-soon slot, detail panel, **Incubate** button |
| `Incubator` | **Small** world-space pop-ups floating over an incubator/creature: incubating (timer, Skip), ready (Hatch), locked (Unlock, padlock), rarity chip, shake ticks |
| `HatchReveal` | Full reveal card (rarity-coloured header/window/rays/glow, field note, New Species sticker, buttons). **No egg-cracking overlay**: the egg cracks in 3D in the terrarium, then this card opens |
| `Release` | Release confirm dialog, warning bar, Cancel / Release / **Hold to Release** (fill), checkboxes |
| `Notifications` | Templates: Wilds indicator, red/green banners, announcement strip, toast (coloured tabs), swords/shield/party icons (PvP on / safe again), egg flight trail. No terrarium icon on "safe again" or Welcome Back |
| `WelcomeBack` | Offline-earnings dialog with pocket-watch icon and **Collect** |
| `Settings` | Toggles, sliders (continuous and stepped), codes box, input field, **Redeem**, result dots, Credits |

---

## 5. Required functionality: status

Legend: ✅ written (untested in Studio) · 🟡 partial · ❌ missing.

### Runtime modules (`StarterGui.UI_Core.Runtime`)
| Module | Status | What it does |
|---|---|---|
| `Images` | ✅ | `applyAll(root, ids)` crops every image from its sheet; coloured placeholders if an ID is missing; `apply(gui, key)` swaps an image |
| `SetSheetIds` | ✅ | One-paste command-bar helper (see section 2) |
| `ButtonFX` | ✅ | Hover grow (`HoverScale` 1.06), press squash (`PressScale` 0.9), spring back, hover/click sounds. Attached to every GuiButton automatically (attribute `FXAttached`) |
| `Effects` | ✅ | Rotates anything with `Spin`; bounces `Bounce`; tilts `Tilt`; rescales `UIStroke` from `BaseThickness`; `sparkles()`, `twinkle()` |
| `PanelManager` | ✅ | `open(key, opts)`, `close(instant)`, `current()`, `screen(key)`, `setHudFaded(bool)`, `init`. Slide/pop styles per panel, close button wiring, tab wiring by label (Creatures/Holding/Stats/Decor/Layers/Backdrops), tab groups swap instantly, random vine set, HUD fade for Edit Tank |
| `HUDNavigation` | ✅ | Maps HUD button names to travel (`Tab_MyTerrarium`, `Tab_Shop`, `Tab_Upgrades`) or to panels; fires `TerrariumTravel` RemoteEvent |
| `Notifications` | ✅ | `toast(kind,title,subtitle,icon)`, `banner(kind,text)`, `announce(prefix,highlight)`, `eventStarted(...)`, `setWilds(on)`, `eggBanked(worldPos,image,eggsButton)` |
| `FloatingText` | ✅ | `countTo(label, old, new)`, `show(anchor, delta)` for Shillings |
| `BioactivityBar` | ✅ | `set(0–100)` smooth fill, flash/bounce/sparkles per 10 points |
| `ScrollFX` | 🟡 | `attach(scrollingFrame)`: smooth wheel, custom scrollbar, tick, pop-in. **No ScrollingFrames exist yet** (see section 7) |
| `IncubatorPopup` | 🟡 | `IncubatorPopup.new(adornee)`, `:set(state,data)`, `:show/hide`, `:autoShow(range)`, `:destroy`. Works on the test world only; real incubator wiring missing |
| `EggFX` | 🟡 | `EggFX.new(eggModel)`, `:shake`, `:setReady`, `:hatch(creature, opts)`: hover wobble, stronger shake + white pulse when ready, hatch sequence. **The 3D crack animation is a placeholder**; user must supply one |
| `HatchReveal` | 🟡 | `show(data)` fills the reveal card by rarity. Needs real creature data and model |
| `Interactions` | ✅ | Settings toggles (on/off swap), sliders, Store category tab swap, checkboxes, Daily **Claim** state flip (`Btn_State_Claim` → claimed; local only), **Hold to Release** fill. Fires `Interactions.changed` for your code |
| `Sound` | 🟡 | Plays `UIConfig.Sounds[key]`; all IDs are `0` so it is silent |
| `UIConfig` | ✅ | Sound IDs, scales, times, `HudFadeTransparency = 0.6`, `TravelRemote = "TerrariumTravel"` |
| `Tween` | ✅ | Tiny helper |

`UIController` (LocalScript) runs each startup step inside `xpcall`, prints `[UI] starting`, `[UI] N images linked`, `[UI] ready`, or `[UI] '<step>' failed:` with a traceback, and sets attribute `Ready = true` on `UI_Core`. It also connects `Shillings` and `Bioactivity` **player attributes** to the count-up/floating text/bar and opens panels from `ProximityPromptService.PromptTriggered` using the prompt attribute `OpensPanel`.

`UIDemo` (keys 1–9, 0, H, E) and `WorldDemo` exist only for testing; remove before shipping.

### Behaviour that the game must provide (not implemented; needs the user's systems)
- Server sets `player:SetAttribute("Shillings", n)` and `("Bioactivity", 0–100)`; rebirth count, eggs count, restock timer, income multiplier, daily-reward state, etc. must drive their labels (currently static text from the mockup).
- Real ProximityPrompts on the user's terrarium, Keeper and upgrades NPCs with `OpensPanel` = `EditTank_Layers`, `KeepersShop`, `Upgrades`, `MyTerrarium_Creatures`.
- `TerrariumNavigation` looks for `workspace.Plots.<PlayerName>.Spawn`, `workspace.NPCs.KeeperStand`, `workspace.NPCs.UpgradesStand`. Adjust `getDestination` to the real names (inspect the game through MCP).
- Purchases (Robux via MarketplaceService, Shillings), Daily Rewards persistence, Rebirth, Keeper stock, Upgrades, egg incubation timers/skips, Hatch results, Release, Redeem codes, settings persistence and applying settings (music/SFX volume, etc.).
- Real lists (see below), real creature/egg 3D renders in slots, real 3D crack animation, sound IDs.

### Intended interactions per area (what "done" means)
- **HUD:** all buttons hover/press FX; `!` badges bounce only when something is claimable; Shillings text counts with floating +/−; Bioactivity animates.
- **Edit Tank:** opens from the terrarium prompt, slides from the right, HUD fades to 60% (optionally fully visible on hover), close restores. Tabs: Layers/Decor ↔ Backdrops swap without re-sliding; dragging an item shows the ghost and a drop ring (`EditTank_Drag`).
- **Incubator pop-ups:** small, float over the incubator/creature, show only when the player is near; states incubating/ready/locked.
- **Eggs:** growing eggs wobble gently on hover; ready eggs shake harder with a white pulse; hatching = hard shake → white flash → 3D crack animation → creature pops out → `HatchReveal`. No full-screen egg overlay.
- **Daily Rewards:** day card state changes only its status button (Claim / Claimed / Locked); selected day shows the selection ring.
- **Notifications:** toasts slide down; Wilds banner drops; rare hatches get an announcement; event start shows a card from the right and adds a row to Active Events sliding up.

---

## 6. Dependencies and pitfalls

- **Fonts:** Comic Neue Angular might not exist in the user's Studio. If TextLabels show a default font, switch to Fredoka One (scripts: `FloatingText.lua`, builder constants; in the place, set `FontFace` on labels).
- **Image IDs:** must be Image assets (not Decal IDs). The user imported them via Asset Manager; if the pictures don't show in Play but do in edit, check asset permissions/moderation status.
- **Templates:** `UI_Notifications` and `UI_Incubator` are templates (`Templates` attribute); they must stay hidden. Notifications clone from them.
- **Sheet order caveat** in section 2.
- **Non-English/long text:** labels are centre-anchored and scaled from the 1080p mock; long strings may overflow. Use `TextScaled` with a `UITextSizeConstraint` or fixed sizes carefully.
- **Naming collisions** when moving into the user's project: prefixes `UI_`, `Btn_`, `Tab_`, module names like `Sound`, `Tween`, `Effects`, `Notifications`. Keep everything inside `UI_Core` and `ReplicatedStorage`/`StarterGui` to avoid clashes; check the user's game for existing `Sound`/`Tween` modules.
- **ResetOnSpawn:** check each ScreenGui. Reset on spawn would destroy state and re-run scripts. The intended setting is `false` for the HUD and panels; verify and set it.
- **ZIndex/DisplayOrder:** verify notifications and the Hatch Reveal render above panels; `UI_SetupNotice` uses DisplayOrder 100.

---

## 7. Known problems and unfinished work (be honest with the user about these)

The user's words: "there are still some glitches, some UI elements that need improving, and certain aspects that aren't quite right yet." The previous AI could not see the result in Studio, so this list is partly inferred:

1. **Never run end to end in Studio.** First action: open the place, link sheet IDs, press Play with Output open and read `[UI]` lines. A user screenshot earlier showed text visible but images missing (IDs not linked yet); after linking the user says it "looks pretty good" with glitches.
2. **Unspecified visual glitches**: expect misplaced/mis-sized pieces on some screens, possible nesting/z-order issues, and text overflow. Compare each screen with the intended look (sections 1 and 4; the mockup previews are in the user's repo `StudioExport/Previews`, if they provide them) and fix with minimal edits. Specific areas that were troublesome in the offline simulation and deserve a careful look: badges and decorations that overhang a parent, Bioactivity text vs. fill, rays inside cards (clipping), Hatch Reveal dim vs. card z-order, hidden alternate-state buttons overlapping visible ones, phone aspect ratio.
3. **Static grids instead of lists.** Field Guide cards, Keeper's Shop rows, Store packs, Edit Tank item cards, backdrop cards, Egg Inventory cards, My Terrarium creature cards and Holding rows are fixed, pre-placed copies from the mockup. Convert each to a `ScrollingFrame` with `UIGridLayout`/`UIListLayout`, using the first card as a template clone source, then call `ScrollFX.attach`. Keep card internals and names.
4. **`CreatureSlot` / `EggSlot` are empty.** Ask the user which models/viewports to place (ViewportFrame, or rendered images).
5. **Egg crack animation, sounds, real data, purchases, persistence** are all missing (section 5).
6. **Active Events rows** are TextLabels with gradient fade, only the icons are images; needs dynamic row creation and sliding.
7. **Income multiplier/other labels** are static text.
8. **Demo leftovers:** `UIDemo`, `WorldDemo`, test world in Workspace, disabled `README_FIRST` script. Remove at integration.
9. **Image softness** on high-DPI (design-resolution sheets).
10. **Font availability** (Comic Neue Angular).
11. **Travel system:** the `TerrariumTravel` RemoteEvent is created by the server script; the client falls back to opening panels if it is missing. The real game needs real destinations and probably a cooldown/teleport effect.
12. **Mobile:** verify all screens in Device Emulator; enlarge small touch targets if needed. Panels are designed for 16:9 scaling; on phones, consider a UIScale per panel.
13. **Incubator pop-ups** are built as BillboardGui-style templates for the test world; check scale at distance and that only nearby ones show.

---

## 8. How to proceed via Studio MCP

**Golden rule: preserve and build on what exists. Do not recreate the UI.**

1. **Orient (no changes).**
   - List `StarterGui` children; confirm the ScreenGui names in section 3.
   - Read `UI_Core.Runtime.*` sources, `UIController`, `ServerScriptService.TerrariumNavigation`.
   - Check `UI_Core.SheetIds` values; if empty, run the `SetSheetIds` command from section 2 (via `run_code` or by asking the user).
   - Screenshot/inspect each screen (enable one ScreenGui at a time or drive via Play mode). Note glitches per screen.
2. **Run it.** Start Play mode; capture Output. Fix any `[UI] '<step>' failed` first. Confirm `[UI] N images linked, 0 waiting` and `[UI] ready`.
3. **Fix visuals in place.** Use small property edits (`Position`, `Size`, `ZIndex`, `Visible`, `AnchorPoint`). Never delete a piece that scripts look up by name. Re-check at 16:9 and a phone emulation (2340×1080) after every fix.
4. **Integrate with the real game** (inspect it via MCP first):
   - Move `UI_*` ScreenGuis and `UI_Core` into the real project's `StarterGui`, and `TerrariumNavigation` into `ServerScriptService`. Delete the test world and demo scripts afterwards.
   - Discover how the game stores Shillings, Bioactivity, eggs, creatures, plots, NPCs, shops, daily rewards, rebirth; then write a thin **adapter** (client controller + RemoteEvents/attributes) that feeds the existing UI. Do not modify the UI to fit a data model; adapt the data to the UI.
   - Replace placeholder lists with real data-driven lists (templates → clones).
   - Hook ProximityPrompts (`OpensPanel`), real travel destinations, purchases, claims, etc.
5. **Finish the missing behaviour** from section 5 using the existing modules (`PanelManager.open/close`, `Notifications.*`, `FloatingText`, `BioactivityBar.set`, `IncubatorPopup`, `EggFX`, `HatchReveal.show`, `Interactions.changed`, `Images.apply`). Extend modules rather than replacing them.
6. **Polish:** assign sounds in `UIConfig.Sounds` (search terms: hover "ui hover tick"; click "bubble pop"; open/close "ui whoosh"; notify "soft bell"; banner "drum hit"; coins "coin clink"; level up "magic chime rising"; scroll "scroll tick" (very quiet); egg "wood rattle"/"egg crack"; rare "fanfare short"; error "error buzz"; equip/claim "equip click"/"reward jingle"). Keep them short, soft, consistent. Use only audio the user's account can use.
7. **Report back after each stage:** what changed, what you need from the user (model names, sound choices, data access), and what remains. Ask before anything destructive or that changes the look.

### Things to ask the user early
- Which 3D models/viewports for creatures and eggs; do they have a crack animation?
- How the real game stores currency, eggs, creatures, plots; names of NPCs/plot spawn parts.
- Whether to keep Comic Neue Angular or swap the font.
- Audio IDs they want, or permission to choose from the Creator Store.

### Don'ts
- Don't rename exported pieces or attributes; don't change `ImageMap`.
- Don't re-upload or re-pack images unless the user asks (they can regenerate from their repo).
- Don't add gold outlines, wood/moss heavy styling, or new icon styles. New icons must match the blocky voxel look.
- Don't use different terminology than listed in section 1.
- Don't ship demo scripts or the test world.
