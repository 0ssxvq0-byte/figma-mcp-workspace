# Build a Terrarium: UI Scripting Handover (short brief)

You are implementing the **functionality** of the UI in my Roblox game *Build a Terrarium* through the Roblox Studio MCP. **You are not designing a UI.** The visual UI is already imported into the game. Your job is to **delete the old UI-related scripts, rewrite them cleanly from scratch, and wire the existing GUI to the real game.** Keep the look; fix and polish it only where it is wrong (especially text outlines, see section 2).

---

## 0. Working rules

1. **Inspect before you touch anything.** Read the whole project hierarchy first (Workspace, ReplicatedStorage, ServerScriptService, StarterGui, StarterPlayerScripts, etc.). Find the real names of plots, the Return Pad, Incubators, NPCs (Keeper), teleport/spawn parts, remotes, data modules, currency/Bioactivity values, existing eggs/carry/banking code. **Use actual names. Never assume.** A lot of what you need already exists.
2. **Ask me questions before any major decision.** Do not guess about intended behaviour, naming, data sources, or how a screen should react to the game. Give me a short list of questions after your inspection, then wait.
3. **Game design document:** I have a full GDD (mechanics, systems, terminology, status tags like [BUILT]/[DECIDED]). Ask me for the relevant sections (§7 Incubation, §9 Bioactivity, §12 Keeper/shop, §14 PvP/Wilds, §15 Field Guide, §17 daily/codes, §18 UI) when you need them. Do not ask for the whole thing unless required.
4. **Keep the GUI instances.** Don't rebuild, restyle or rename imported frames, images and labels unless something is broken. If you must rename, tell me first. Your rewrite replaces the *scripts*, not the visuals.
5. **Old UI scripts:** list every UI-related script (LocalScripts/ModuleScripts inside the imported ScreenGuis, any `UI_Core`, `UIController`, `UIDemo`, `WorldDemo`, `README_FIRST`, `TerrariumNavigation`, and any older UI scripts in the game). Show me the list, confirm what is UI-only versus game logic, then remove the UI-only ones. **Don't delete game systems.** Also remove any demo/test world objects left from the import.
6. Use exact terminology everywhere (labels, variables, comments): **Shillings** (plural, always), **Terrarium** (UI prefers it over Tank), **Keeper**, **Creatures**, **Holding**, **Release** (never "sell"), **Field Guide**, **Bioactivity**, **Backdrop**, **Incubator**, **the Wilds**, **Store**. Large numbers abbreviate: 1.2K, 3.4M.

---

## 1. What the imported UI is

- ScreenGuis named `UI_<Screen>` in StarterGui. Each has a full-screen transparent `Root` frame (panels slide by moving `Root`), pieces pinned to screen edges/corners with `UIAspectRatioConstraint`, children nested by containment and centre-anchored.
- Screens: `MainHUD`, `DailyRewards`, `Store`, `FieldGuide`, `Rebirth`, `KeepersShop`, `Upgrades`, `MyTerrarium_Creatures`, `MyTerrarium_Holding`, `MyTerrarium_Stats`, `EditTank_Layers`, `EditTank_Drag`, `EditTank_Backdrops`, `EggInventory`, `Incubator` (small pop-up template), `HatchReveal`, `Release`, `Notifications` (templates), `WelcomeBack`, `Settings` (+ Codes).
- **All images are sprite-sheet crops** (`ImageRectOffset`/`ImageRectSize` on 14 uploaded sheets). Each image has attributes `Sheet` and `ImageKey`. To swap a state, change `ImageRectOffset/Size` (or visibility), don't insert a new image. Sheet IDs are in `UI_Core.SheetIds` (if present in the imported copy); inspect how the images are actually referenced in the game.
- Text is always real TextLabels (never baked in). Creatures/eggs are **not** in the sprites: empty `CreatureSlot` / `EggSlot` frames mark where item icons go. **Per my GDD, item icons are Blender renders in ImageButtons/ImageLabels, not ViewportFrames.** Ask me where the renders are.
- Hidden alternate states exist for things like Rebirth ready, Claimed/Locked, Send to Holding, unselected tabs (attribute `AlternateState`). Templates (`UI_Notifications`, `UI_Incubator`) must stay hidden and be cloned.
- Pieces are found by name in the old scripts (`Btn_Close_X`, `Tab_*`, `Toggle_On_Track`, `Slider_Track`, `Btn_State_Claim`, `ShillingsAmount`, `BioactivityValue`, `RebirthCount`, `EggsCount`, `RestockTimer`, `IncomeMultiplier`). Your new scripts can use whatever lookup is cleanest, but verify these names exist before relying on them.
- The UI was generated offline and **never run in Studio.** Expect some placement/ZIndex/nesting glitches. Fix them in place with small property edits.

---

## 2. Visual design (preserve; polish)

**Style:** polished, vibrant, chunky Roblox UI with a subtle forest/terrarium identity. Blocky **voxel/pixel** icons (flat-lit, hard edges), matching the game's blocky-not-low-poly world. Mobile first: big touch targets, minimal text.

**Do not add:** heavy gold outlines, wood-and-moss-heavy fantasy styling, soft gradient-blob "generic AI" looks, new icon styles. The Robux icon must be the real Robux symbol.

**Panels:** dark navy body (Frame with UICorner + UIStroke + faint tiled stud texture), a bright coloured `Header_Bar` per panel, red close button `Btn_Close_X`. Decorative **vines** (5 variations via `VineSet` attribute 1–5; Back layer behind panel, Front over its edge; show one, randomise per open).

**Colour:** dark navy surfaces, ink `Color3.fromRGB(11, 15, 29)` for outlines, bright saturated accents. Six rarity colours (Common, Uncommon, Rare, Epic, Legendary, Mythic) used consistently on egg frames, cards, Hatch Reveal header/window/burst. Sample exact colours from the imported sprites.

**Typography:** Comic Neue Angular Bold (`rbxasset://fonts/families/ComicNeueAngular.json`, Bold). If missing in Studio, use Fredoka One. White text with a vertical `UIGradient`.

**⚠ TEXT OUTLINES ARE TOO HEAVY. Fix this first.**
- The imported labels use a `UIStroke` of about **9% of text size** (attribute `BaseThickness`). In practice it looks too thick in many places, eating counters and small labels.
- Target: **about 4–5% of text size** (e.g. 18 px text → 1 to 1.5 px; 32 px → 1.5 to 2 px; never above 2 px on UI text, less on small text). Keep colour `11,15,29`, `LineJoinMode = Round`, `ApplyStrokeMode = Contextual`.
- Apply this globally in one pass (script over all TextLabels' UIStroke), and set stroke thickness from text size in one shared helper so new labels follow the same rule. Also scale the stroke with screen size; don't let it grow with `TextScaled` text. Show me before/after on the HUD and one panel.

**Spacing/layout:** the design canvas is 1920×1080; HUD stays in its corners on phones/tablets/ultrawide. Left column: Daily Rewards (wide), Store (smaller bar), Field Guide (tilted book icon), Rebirth, Eggs. Top centre: Shop | My Terrarium | Upgrades tabs. Shillings + plus, rebirth count and Settings at top; Bioactivity bar; Starter Pack offer; Keeper restock bar; Active Events bottom right. **Check each against my GDD (see section 5): some elements may not apply.**

**Animation and feel:** buttons grow about 6% on hover and squash to about 90% on press, then spring back; soft hover tick and bubbly click. Panels slide up from the bottom (Edit Tank and My Terrarium slide in from the right); dialogs pop in (Back ease). Rays (Starter Pack, Day 7, Hatch window) rotate slowly; sparkles twinkle; `!` badges bounce; the Eggs quantity label tilts ±9°. Shillings count up/down with floating green `+1.2K` or red `-500`. Bioactivity fills smoothly with a flash, plant bounce and sparkle every 10 points. Keep everything short, soft and consistent. Sound IDs are not set (ask me or pick sensible Creator Store audio that my account can use).

---

## 3. Screens and intended behaviour

| Screen | Behaviour |
|---|---|
| **Main HUD** | Always visible. Shillings (live), Bioactivity (live), PvP-flag indicator, Keeper restock timer, quick buttons. Side buttons open their panel directly and toggle it closed on second press. `!` badge only when there is something to claim/collect. |
| **Teleport tabs (Shop / My Terrarium / Upgrades)** | **They teleport the player**, not open panels. My Terrarium → player's own Plot/terrarium; Shop → the Keeper; Upgrades → the upgrades spot. Panels then open from ProximityPrompts on those objects. Server validates and moves the character (cooldown, no spam; don't teleport while carrying an egg or flagged for PvP unless I say so). **Find the real destination parts and existing prompts in the game.** |
| **Edit Tank** (Layers/Decor, Drag, Backdrops tab) | Opened from the terrarium's prompt. Slides in from the right; HUD fades to ~60% transparency (restore on close). Drag shows a ghost and drop ring. Backdrops is a **tab of Edit Tank**: owned backdrops, Equip/Equipped. A backend for placing decor already exists; connect to it. |
| **My Terrarium** (Creatures / Holding / Stats) | Creatures in the tank and in **Holding** (when tank is full), move and **Release**; Stats tab shows Bioactivity inputs and zone. Tabs swap without re-sliding. |
| **Release** | Confirm dialog with payout, hold-to-release button, bulk release for Commons. |
| **Keeper's Shop** | Grow-a-Garden-style list: 6 rotating slots with a global 5-minute timer, rows with Buy/disabled/Sold Out, plus a permanent upgrades tab. No Keeper character model in the UI. |
| **Upgrades** | Permanent upgrades (tank tiers, incubator slots, Satchel upgrades). |
| **Store** | Robux items: passes, server luck, Shilling packs, real `MarketplaceService` purchases. |
| **Eggs / Egg Inventory** | Banked eggs by type and count; **Incubate** sends to an Incubator. Banking animates the egg flying from its world position into the Eggs button (server already sends the world position). |
| **Incubator pop-ups** | Small, float over the incubator/creature, show only when the player is near; states incubating (timer, Skip for Robux), ready (Hatch), locked (Unlock). Ready pulses on the HUD and the Incubator prop. |
| **Egg hatching** | Hover: growing eggs wobble, ready eggs shake harder with a white pulse. Hatch: hard shake → white flash → 3D crack animation on the model (ask me) → creature pops out → **Hatch Reveal** card (name, rarity, job, "New Species!"). **No full-screen egg overlay.** |
| **Field Guide** | Species grid by rarity, silhouettes for undiscovered, entry detail, completion, milestones. |
| **Daily Rewards** | Streak-based; day card state changes only its status button (Claim/Claimed/Locked); selected day has the selection ring. |
| **Notifications** | Toasts slide down (egg banked/ready/new species); Wilds banners ("You've entered the Wilds — PvP is on until you're home."; flag cleared) drop in; rare-hatch announcements pop; event card slides from the right while Active Events list slides up from the bottom. PvP/safe notifications use the swords/shield icons. |
| **Welcome Back** | Offline earnings dialog with Collect. |
| **Settings** | Toggles (environment animation etc.), sliders (music/ambience), graphics; Codes entry + Redeem with result state. |
| **Rebirth** | ⚠ **My GDD says "No rebirth [DECIDED]."** The imported UI includes a Rebirth screen/button. **Ask me** before wiring it; it may need to be hidden or repurposed. |

---

## 4. What you must code from scratch

1. **One small, clean client architecture** (for example one controller + a few ModuleScripts: panel manager, button FX, notifications, currency/Bioactivity display, list builder, input). No leftover code from the old scripts; reuse logic only if you understand and re-verify it.
2. **Button FX, panel open/close/tab swapping**, one panel open at a time, close buttons, HUD fade for Edit Tank, vine set randomisation, mobile-safe input (use `Activated`, not mouse-only events).
3. **Data binding** to the game's real systems (Shillings, Bioactivity, eggs, creatures, plots, shop stock, upgrades, daily streak, codes, settings) through the game's existing remotes/data modules. Create RemoteEvents/Functions only where none exist, with server-side validation for everything that costs Shillings or Robux.
4. **Convert static grids to real lists**: Field Guide, Keeper's Shop rows, Store packs, Edit Tank items, backdrop cards, Egg Inventory, Creatures and Holding. Use the first built card as a template (clone per item in a ScrollingFrame with UIGridLayout/UIListLayout), keep card internals. Add smooth scrolling.
5. **Animations and feedback** listed in section 2; **notifications system**; **floating currency text**; **Bioactivity bar**; **egg fly-to-icon**; **incubator pop-ups**; **hatch sequence into Hatch Reveal**.
6. **Teleport system** (client button → server-validated teleport to real parts).
7. **Sounds** through one `Sound` helper with an ID table.
8. **Settings persistence** and applying settings (volume, environment animation toggle).
9. Clean up: no demo keys, no debug prints, sensible `ResetOnSpawn` (HUD and panels should not reset), correct `DisplayOrder`/`ZIndex` (notifications and Hatch Reveal above panels).

---

## 5. Suggested order of work

1. Inspect the game and the imported UI; list old UI scripts vs. game systems.
2. **Ask me questions** (data sources, remotes, teleport parts, Rebirth, item-icon renders, sounds, crack animation). Ask for GDD sections as needed.
3. Fix text outlines and any obvious layout glitches (screenshots per screen, desktop and phone emulation).
4. Remove old UI scripts; build the new core (panels, button FX, HUD binding).
5. Panels one by one: Edit Tank, My Terrarium, Shop/Upgrades, Eggs/Incubator/Hatch, Field Guide, Daily, Settings/Codes, Notifications.
6. Mobile and edge-case pass. Report what changed and what is left after each stage.

Important: finished means the UI behaves correctly in Play mode with real game data. Test in Play and read the Output.
