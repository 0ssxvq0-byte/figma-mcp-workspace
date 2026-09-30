# Prompt for an AI with Roblox Studio (MCP) access

Copy everything below the line into your Studio AI (Claude Code, etc. with the Roblox Studio MCP connected).
Unzip the export first and tell it where the folder is.

---

You are implementing the finished UI for my Roblox game **Build a Terrarium** in the open Roblox Studio place.
The complete export is in `<PATH TO StudioExport>`. Read `README.md` there first; it describes every folder,
naming rule, script and hook. Do not redesign anything: the look is final.

## Step 1: get the images and scripts in
1. If `Studio/Modules/AssetIds_Decals.lua` does not exist yet, stop and ask me to run
   `python3 Studio/Tools/upload_assets.py --key ... --user ...` (it uploads every PNG in `Assets/` with my API key).
2. Create in ReplicatedStorage: Folder `TerrariumUI` → Folders `Modules` and `Runtime`.
   - ModuleScripts in `Modules`: `UILayout` (from `Studio/Modules/UILayout.lua`), `AssetIds_Decals`.
   - ModuleScripts in `Runtime`: one per file in `Studio/Runtime/` (same names).
   - LocalScript `UIController` in StarterPlayer.StarterPlayerScripts from `Studio/Client/UIController.client.lua`.
   - Script `TerrariumNavigation` in ServerScriptService from `Studio/Server/TerrariumNavigation.server.lua`.
   Paste file contents exactly; don't rewrite them.
3. Run `Studio/Tools/ResolveImageIds.lua` in the command bar (it creates `Modules.AssetIds`).
4. Run `Studio/Tools/BuildUI.lua` in the command bar. Check the output: every `UI_<Screen>` ScreenGui should be in
   StarterGui and there should be no "no image ID" warnings.
5. Compare each screen with its picture in `Previews/` (enable one ScreenGui at a time). Fix only real placement
   mistakes; keep names and hierarchy, because the runtime finds pieces by name.

## Step 2: make it a real game UI
- Keep every button's text as a TextLabel. Timers, prices, counts and names are live values.
- Replace each static grid with a ScrollingFrame and a UIGridLayout or UIListLayout, using the first built card as
  the template and cloning it per item: Field Guide cards, Keeper's Shop rows, Store packs, Edit Tank item cards,
  backdrop cards, Egg Inventory cards, My Terrarium creature cards and Holding rows.
  Call `ScrollFX.attach(frame, AssetIds)` on each one.
- `CreatureSlot` and `EggSlot` frames mark where my 3D creature and egg renders go (ViewportFrame or image).
  Ask me which models to use.
- Daily Rewards: a day card's state only changes its status button (`Btn_State_Claim` / `Claimed` / `Locked`).
  The selected day gets `00_Shared/Selection_Ring_9Slice` on top.
- Active Events (bottom right): only the icons are images. Build each row from a TextLabel + UIGradient fade in
  Studio, and slide the list up from the bottom when an event starts (`Notifications.eventStarted` shows the
  slide-in card from the right).
- Income multiplier and similar small labels are plain TextLabels.

## Step 3: behaviour (already in the Runtime modules; wire them up)
- HUD **My Terrarium** teleports me to my terrarium; **Shop** to the Keeper NPC; **Upgrades** to the upgrades
  NPC (`HUDNavigation` + `TerrariumNavigation`; adjust `getDestination` to the real plot/NPC names).
- Their panels open from ProximityPrompts: set the attribute `OpensPanel` on the prompt
  (`KeepersShop`, `Upgrades`, `EditTank_Layers`, `MyTerrarium_Creatures`).
- The terrarium's interact prompt opens **Edit Tank**: it slides in from the right and the HUD fades to
  ~60% transparency (fully visible while hovered is optional); closing restores the HUD.
- Incubator pop-ups stay small, float over the incubator / creature, and appear when I'm close
  (`IncubatorPopup.new(part)`, `:set(state, data)`, `:autoShow(14)`).
- Eggs: `EggFX.new(eggModel)`. Growing eggs wobble gently on hover; ready eggs shake harder with a white pulse;
  hatching = hard shake → white flash → the 3D crack animation on the model (ask me for it) → the creature pops out
  → open `HatchReveal`. No full-screen overlay for the egg itself.
- Currency changes show floating `+`/`-` text; Bioactivity fills smoothly with a level-up flourish every 10 points.
  Both react to the player attributes `Shillings` and `Bioactivity`; set these from the server.
- Notifications: toasts slide down; Wilds banners drop in; rare-hatch announcements pop; the egg-banked egg flies
  into the Eggs button.
- Sounds: fill `Runtime/UIConfig.Sounds` with Creator Store audio (README lists what to search for). Keep
  them short, soft and consistent.

## Rules
- Mobile first: test at phone size (Device Emulator), and keep touch targets big.
- Don't rename exported pieces or change `UILayout`; if something is wrong, tell me what and where.
- After each step, tell me what you did and what you need from me.
