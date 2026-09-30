# Build a Terrarium UI: Roblox Studio export

Everything you need to put the Build a Terrarium UI into Roblox Studio: every separately-animated piece as a
transparent PNG, organised by screen, plus scripts that upload the images, rebuild every screen for you, and add
the animations and sounds.

## What's in the ZIP

```
Assets/                      all images (transparent PNG, max 1024 px, 2x resolution where possible)
  00_Shared/                 pieces used on many screens: close button, selection ring, panel frame, stud tile,
                             progress bars, scrollbar, sparkle, glow, rays, 9-slice skins, shared icons
  01_MainHUD/                Buttons/, Icons/, Bioactivity/, StarterPack/, Restock/, ActiveEvents/
  02_DailyRewards/ ... 17_SettingsCodes/   one folder per screen (see "Screens" below)
  18_Vines/Set1 ... Set5/    the five vine variations (Back = behind the panel, Front = over its edge)
Previews/                    a picture of every screen, for reference while you build
Studio/
  Modules/UILayout.lua       where every piece and every text sits (generated from the mockup)
  Modules/AssetIds.lua       image IDs; filled in for you by the tools below
  Runtime/                   animation, sound, panel, notification, incubator and egg modules
  Client/UIController.client.lua     LocalScript that switches it all on
  Server/TerrariumNavigation.server.lua   HUD travel buttons (terrarium / Keeper / upgrades NPC)
  Tools/upload_assets.py     uploads every PNG with Open Cloud (no copying IDs by hand)
  Tools/ResolveImageIds.lua  command-bar script: turns uploaded Decal IDs into Image IDs
  Tools/BuildUI.lua          command-bar script: builds every screen as a ScreenGui in StarterGui
  default.project.json       Rojo project (VS Code users: sync Modules, Runtime, Client, Server)
manifest.json                the same layout data as UILayout.lua, as JSON
AI_BUILD_PROMPT.md           paste this to an AI that has your Studio MCP connection
```

### Naming

| Prefix | Meaning |
|---|---|
| `Btn_` | A button background, no text (text is a TextLabel so it can change and translate) |
| `Tab_` | Top tabs and panel tabs (`Tab_Selected` / `Tab_Unselected`) |
| `Icon_` | An icon on its own, to sit on a button or card |
| `Card_`, `..._Row`, `..._Box`, `..._Panel` | Card and row backgrounds |
| `Header_Bar` | A panel's coloured title bar (no title text, no close button) |
| `_9Slice` | Stretchable: `ScaleType = Slice` (BuildUI sets the slice for you) |
| `Sticker_`, `Stamp_`, `Badge_`, `Checkbox_On`, `Btn_Close_X` | Decorative pieces with their symbol baked in |

**Not exported, on purpose:** creatures and eggs (you have 3D models; BuildUI leaves `CreatureSlot` / `EggSlot`
frames where they go), all text (TextLabels instead), and the dark panel bodies (native Frames with UICorner +
UIStroke + the stud tile, made by BuildUI). Repeated pieces are exported once; `UILayout.lua` lists every place each
one is used, so BuildUI places all the copies.

### Screens

| Folder | Screen |
|---|---|
| `01_MainHUD` | Daily Rewards, Store, Field Guide, Rebirth, Eggs, Shop / My Terrarium / Upgrades tabs, Settings, Shillings + plus, rebirth counter, Bioactivity bar (background, fill, plant), Starter Pack (gift, Robux, rays, glow), Keeper restock bar, event icons |
| `02_DailyRewards` | Header, calendar, Claim All, day cards (blue / purple / gold / Day 7), Claim / Claimed / Locked, OP sticker, Day 7 rays. Selected state = `00_Shared/Selection_Ring_9Slice` |
| `03_Store` | Header, Robux icon, categories (selected / unselected), pass, server luck and Shilling pack cards, Robux buy button |
| `04_FieldGuide` | Header, book icon, tab, cards per rarity and undiscovered, job badge, rarity dot, entry detail, milestone cards |
| `05_Rebirth` | Header, hero card + rays, requirement card, checks, reward cards, locked / ready buttons |
| `06_KeepersShop` | Header, restock pill, item row, item wells per rarity, Buy / disabled, Sold Out stamp |
| `07_Upgrades` | Header, upgrade rows, Upgrade button |
| `08_MyTerrarium` | Header, tabs + count badge, creature cards, empty slot, detail strip, buttons, all Holding pieces |
| `09_MyTerrariumStats` | Stat tiles, zone bar (track, good area, marker), status chips, hint bar, input icons |
| `10_EditTank` | Header, tabs, layer stack, soil / filter / clay strips, item card, In Tank tag, grip, tools, Done, drag ghost + drop ring, Backdrops tab: on-tank box, backdrop cards, Equip / Equipped, 10 backdrop thumbnails |
| `11_EggInventory` | Header, egg card frames per rarity + empty, coming-soon slot, detail panel, Incubate |
| `12_IncubatorPopups` | Pop-up body + pointer, headers (incubating / ready / locked), rarity chip, Skip / Hatch / Unlock, padlock, shake ticks |
| `13_HatchReveal` | Dim backdrop, card header + window in all six rarity colours, window rays + glow, field note box, New Species sticker, buttons, full-screen bursts per rarity |
| `14_Release` | Dialog headers, creature frames, warning bar, Cancel / Release / Hold to Release (+ fill), checkboxes |
| `15_Notifications` | Wilds indicator, red / green banners, announcement strip, toast body + coloured tabs, swords / shield / party icons, egg flight trail |
| `16_WelcomeBack` | Dialog header, pocket watch, Collect |
| `17_SettingsCodes` | Header, rows, toggles (track on / off + knob), slider (track, fill, knob), stepped slider pieces, codes box, input field, Redeem, Credits, result dots, row icons |

## Setting it up (about 15 minutes)

1. **Upload the images.** You need Python 3 and an Open Cloud API key
   (create.roblox.com → Credentials → Create API Key → add the *Assets* API with read + write, add your IP).
   ```
   python3 Studio/Tools/upload_assets.py --key YOUR_KEY --user YOUR_USER_ID
   ```
   (use `--group GROUP_ID` if the game belongs to a group). It can be stopped and re-run safely, and writes
   `Studio/Modules/AssetIds_Decals.lua`.
2. **Get the scripts into Studio.**
   - *Rojo (VS Code):* `rojo serve Studio/default.project.json` and connect from the Rojo plugin.
   - *By hand:* in ReplicatedStorage make a Folder `TerrariumUI` with Folders `Modules` and `Runtime`. Add a
     ModuleScript for each `.lua` file in `Studio/Modules` and `Studio/Runtime` (same names, paste the contents).
     Put `UIController.client.lua` in StarterPlayerScripts as a LocalScript named `UIController`, and
     `TerrariumNavigation.server.lua` in ServerScriptService as a Script.
3. **Turn Decal IDs into Image IDs:** paste `Studio/Tools/ResolveImageIds.lua` into the command bar
   (View → Command Bar) and press Enter. It writes `ReplicatedStorage.TerrariumUI.Modules.AssetIds`.
4. **Build the UI:** paste `Studio/Tools/BuildUI.lua` into the command bar. Every screen appears in StarterGui as
   `UI_<Screen>`. Run it again whenever you want a clean rebuild.
5. **Sounds:** put sound IDs in `Runtime/UIConfig` (see below). Missing ones are simply skipped.
6. **Play.** The HUD animates straight away; panels open from their buttons.

No Python? Use **Asset Manager → Bulk Import** on the `Assets` folders instead, then copy each image's ID into
`Modules/AssetIds.lua` (the keys are the file paths). That's slower, so the script is recommended.

## How the built UI is organised

- `StarterGui.UI_<Screen>` → `Root` (full-screen, transparent; panels slide by moving this) → pieces.
- Top-level pieces sit in a `<Name>_Holder` frame pinned to the nearest screen edge or corner, with a
  `UIAspectRatioConstraint`, so the HUD stays in its corners on phones, tablets and ultrawide screens.
- Everything else is nested inside the piece it sits on (text inside its button, buttons inside their card, cards
  inside the panel), so moving or scaling a piece moves everything on it.
- Children are centred on their spot, so buttons grow and bounce from the middle.
- Named text labels your scripts will update: `ShillingsAmount`, `BioactivityValue`, `RebirthCount`, `EggsCount`,
  `RestockTimer`, `IncomeMultiplier`. Other labels are called `Text_<their text>`.
- Vines: all five sets are built; `VineSet` = 1–5. Set 1 shows by default; PanelManager picks a random set each
  time a panel opens.
- Alternate states (Rebirth ready, Send to Holding, bursts, ...) are built hidden with the `AlternateState` attribute.

## What the runtime does

| Feature | Where |
|---|---|
| Buttons grow slightly on hover, squash on press and spring back, with hover + click sounds | `ButtonFX` (every button, automatically) |
| Panels slide up from the bottom (Edit Tank and My Terrarium slide in from the right); dialogs pop in; tabs swap instantly | `PanelManager` |
| Random vine set each time a panel opens | `PanelManager` |
| HUD fades to 60% while Edit Tank is open, back when it closes | `PanelManager.setHudFaded` |
| Rays behind the Starter Pack, Day 7, Rebirth, Hatch window and bursts rotate | `Effects` (anything with the `Spin` attribute) |
| Exclamation badges bounce, the Eggs counter tilts ±9° | `Effects` (`Bounce`, `Tilt` attributes) |
| Sparkle bursts and twinkling stars on reward screens | `Effects.sparkles`, `Effects.twinkle` |
| Shillings count up/down with a rising green `+1.2K` or falling red `-500` | `FloatingText` (reacts to the player's `Shillings` attribute) |
| Bioactivity fills smoothly; every 10 points: white flash, plant bounce, sparkles, level-up sound | `BioactivityBar` (reacts to the `Bioactivity` attribute) |
| Toasts slide down, Wilds banners drop in, rare-hatch announcements pop, event cards slide in from the right while your Active Events list slides up from the bottom | `Notifications` |
| Egg banked: egg flies from the world into the Eggs button, which pops | `Notifications.eggBanked` |
| Smooth wheel scrolling, custom scrollbar, soft tick sound, cards pop in as they scroll into view | `ScrollFX.attach(yourScrollingFrame, AssetIds)` |
| Incubator pop-ups float over the incubator/creature and pop in when you're close | `IncubatorPopup` |
| Eggs wobble on hover; ready eggs shake harder with a white glow; hatching = hard shake → white flash → your crack animation → creature pops out → Hatch Reveal | `EggFX` |
| HUD My Terrarium / Shop / Upgrades travel to the terrarium / Keeper / upgrades NPC | `HUDNavigation` + `TerrariumNavigation` (server) |

### Hooking it to your game

- Set player attributes on the server: `player:SetAttribute("Shillings", n)` and `("Bioactivity", 0–100)`.
- ProximityPrompts open panels: give the prompt an attribute `OpensPanel` = `EditTank_Layers` (terrarium),
  `KeepersShop` (Keeper), `Upgrades` (upgrades NPC), `MyTerrarium_Creatures`, etc. Edit Tank slides in from the right
  and fades the HUD; closing restores it.
- Travel spots: `TerrariumNavigation` looks for `workspace.Plots.<PlayerName>.Spawn`, `workspace.NPCs.KeeperStand`
  and `workspace.NPCs.UpgradesStand`. Change `getDestination` if yours are named differently.
- Lists (Field Guide grid, Keeper's Shop rows, Store, Edit Tank items, Egg Inventory): replace the built grid with
  a ScrollingFrame + `UIGridLayout` / `UIListLayout`, using the first built card as the template, then call
  `ScrollFX.attach(frame, AssetIds)`.
- Creature and egg pictures: put your ViewportFrames or rendered images inside the `CreatureSlot` / `EggSlot` frames.

## Text style (for any new TextLabels)

- Font: **Comic Neue Angular, Bold** (`Font.new("rbxasset://fonts/families/ComicNeueAngular.json", Enum.FontWeight.Bold)`).
  If your Studio doesn't list it, change `FONT` at the top of `BuildUI.lua` and `FloatingText.lua` to Fredoka One.
- `UIStroke`: colour `11, 15, 29`, `LineJoinMode = Round`, thickness ≈ text size × 0.09 at 1080p
  (store it in the `BaseThickness` attribute and `Effects` keeps it right on every screen size).
- Fill: white text with a vertical `UIGradient` (BuildUI copies each label's colours from the mockup).

## Sound effects

Search the Creator Store (Audio) for these, and put the IDs in `Runtime/UIConfig`:

| Key | What to search for |
|---|---|
| Hover | "ui hover tick", "soft tick" |
| Click | "bubble pop", "ui pop click" |
| Open / Close | "ui whoosh", "swoosh short" |
| Notify | "notification chime", "soft bell" |
| Banner | "alert horn short", "drum hit" |
| CoinGain / CoinSpend | "coin clink", "coins pickup" |
| LevelUp | "level up sparkle", "magic chime rising" |
| Scroll | "scroll tick" (keep it very quiet) |
| EggShake / EggHatch | "wood rattle", "egg crack", "sparkle burst" |
| RareHatch | "fanfare short", "victory jingle" |
| Error | "error buzz", "denied" |
| Equip / Claim | "equip click", "reward jingle" |
