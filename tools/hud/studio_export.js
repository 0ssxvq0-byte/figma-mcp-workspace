// Curated Roblox Studio export: every separately-animated piece of the UI as its own transparent PNG,
// organised by screen, plus a manifest that records where each piece (and every copy of it) sits,
// and every text label, so the UI can be rebuilt in Studio by script.
//
// Usage: node tools/hud/studio_export.js [outDir]   (default: StudioExport)
//
// Rules (from the brief for this export):
//  - no text is baked into images (text becomes TextLabels); decorative stickers are the only exception
//  - no creatures or eggs (the game has 3D models for those); their spots are recorded as slots
//  - one PNG per repeated element; the manifest lists every place it is used
//  - nothing larger than 1024 px (Roblox's upload limit)
const path = require('path');
const fs = require('fs');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(root, process.argv[2] || 'StudioExport');
const MARGIN = 8, MAX = 1024;

// ------------------------------------------------------------------------------------------------ screens
// root: the element a screen lives in (HUD pieces sit directly on the stage). data: body[data-screen] value.
const SCREENS = [
  { key: 'MainHUD', folder: '01_MainHUD', root: null, data: 'hud' },
  { key: 'DailyRewards', folder: '02_DailyRewards', root: '#scr-daily', data: 'daily' },
  { key: 'Store', folder: '03_Store', root: '#scr-store', data: 'store' },
  { key: 'FieldGuide', folder: '04_FieldGuide', root: '#scr-guide', data: 'guide' },
  { key: 'Rebirth', folder: '05_Rebirth', root: '#scr-rebirth', data: 'rebirth' },
  { key: 'KeepersShop', folder: '06_KeepersShop', root: '#scr-keeper', data: 'keeper' },
  { key: 'Upgrades', folder: '07_Upgrades', root: '#scr-upgrades', data: 'upgrades' },
  { key: 'MyTerrarium_Creatures', folder: '08_MyTerrarium', root: '#scr-hub', data: 'hub' },
  { key: 'MyTerrarium_Holding', folder: '08_MyTerrarium', root: '#scr-holding', data: 'holding' },
  { key: 'MyTerrarium_Stats', folder: '09_MyTerrariumStats', root: '#scr-stats', data: 'stats' },
  { key: 'EditTank_Layers', folder: '10_EditTank', root: '#scr-build', data: 'build' },
  { key: 'EditTank_Drag', folder: '10_EditTank', root: '#scr-build-drag', data: 'build' },
  { key: 'EditTank_Backdrops', folder: '10_EditTank', root: '#scr-buildbd', data: 'buildbd' },
  { key: 'EggInventory', folder: '11_EggInventory', root: '#scr-eggs', data: 'eggs' },
  { key: 'Incubator', folder: '12_IncubatorPopups', root: '#scr-incubator', data: 'incubator' },
  { key: 'HatchReveal', folder: '13_HatchReveal', root: '#scr-hatch', data: 'hatch' },
  { key: 'Release', folder: '14_Release', root: '#scr-release', data: 'release' },
  { key: 'Notifications', folder: '15_Notifications', root: '#scr-notify', data: 'notify' },
  { key: 'WelcomeBack', folder: '16_WelcomeBack', root: '#scr-welcome', data: 'welcome' },
  { key: 'Settings', folder: '17_SettingsCodes', root: '#scr-settings', data: 'settings' },
];

// ------------------------------------------------------------------------------------------------ assets
// mode: 'bare' = no text/icons, 'full' = as drawn, 'only' = just the `show` parts.
// sel matches every copy; the first match (or `pick`) is exported. `scope` limits sel to one screen root.
// slice: 9-slice insets in design px from the image content edge (Studio SliceCenter is written for you).
const A = [];
const add = (file, sel, mode = 'bare', o = {}) => A.push({ file, sel, mode, ...o });
const BTN = 'Buttons', DEC = 'Decor', PNL = 'Panel', CARDS = 'Cards';

// ---- Main HUD
add('01_MainHUD/Buttons/Btn_DailyRewards', '#btn-daily');
add('01_MainHUD/Buttons/Badge_Exclamation', '#badge-daily', 'full', { baked: true });
add('01_MainHUD/Buttons/Btn_Store', '#tile-store');
add('01_MainHUD/Buttons/Btn_FieldGuide', '#tile-guide');
add('01_MainHUD/Buttons/Btn_Rebirth', '#tile-reb');
add('01_MainHUD/Buttons/Btn_Eggs_Frame', '#tile-eggs');
add('01_MainHUD/Buttons/Eggs_Counter_Tag', '#eggs-cnt');
add('01_MainHUD/Buttons/Tab_Shop', '#tab-shop');
add('01_MainHUD/Buttons/Tab_MyTerrarium', '#tab-base');
add('01_MainHUD/Buttons/Tab_Upgrades', '#tab-upg');
add('01_MainHUD/Buttons/Btn_Settings', '#btn-settings');
add('01_MainHUD/Buttons/Btn_AddShillings_Plus', '#btn-add', 'full', { baked: true });
add('01_MainHUD/Icons/Icon_Store_Robux', '#tile-store .svgi', 'full');
add('01_MainHUD/Icons/Icon_FieldGuide_Book', '#tile-guide img', 'full');
add('01_MainHUD/Icons/Icon_Rebirth', '#tile-reb img', 'full');
add('01_MainHUD/Icons/Icon_Settings_Gear', '#btn-settings img', 'full');
add('01_MainHUD/Icons/Icon_Shilling_Large', '#money-row .coin-i', 'full');
add('01_MainHUD/Icons/Icon_Rebirth_Counter', '#rebirths img', 'full');
add('01_MainHUD/Bioactivity/Bioactivity_Bar_Background', '#xpbar .bar', 'bare', { hide: '.fill' });
add('01_MainHUD/Bioactivity/Bioactivity_Bar_Fill', '#xpbar .bar', 'only', { show: '.fill', set: [['#xpbar .bar', '--p', '100%']], slice: [10, 8, 10, 8], fill: 0.57 });
add('01_MainHUD/Bioactivity/Bioactivity_Plant', '#bio-icon', 'full');
add('01_MainHUD/StarterPack/StarterPack_Gift', '#starter > img', 'full');
add('01_MainHUD/StarterPack/StarterPack_Robux_Green', '#starter .price .svgi', 'full');
add('01_MainHUD/StarterPack/StarterPack_Rays', '#starter .rays', 'full', { spin: true });
add('01_MainHUD/StarterPack/StarterPack_Glow', '#starter .glow', 'full');
add('01_MainHUD/Restock/Keeper_Restock_Bar', '#restock');
add('01_MainHUD/ActiveEvents/Event_ServerLuck', '#events .event:nth-of-type(2) img', 'full');
add('01_MainHUD/ActiveEvents/Event_ToxicRain', '#events .event:nth-of-type(3) img', 'full');
add('01_MainHUD/ActiveEvents/Event_NightTime', '#events .event:nth-of-type(4) img', 'full');

// ---- Shared pieces used on many screens
add('00_Shared/Btn_Close_X', '.btn-close', 'full', { baked: true, scope: 'panel' });
add('00_Shared/Selection_Ring_9Slice', '#sel-ring', 'full', { slice: [12, 12, 12, 12] });
add('00_Shared/Panel_Frame_9Slice', '#panel-frame', 'full', { slice: [16, 16, 16, 16] });
add('00_Shared/Panel_Studs_Tile', '#kit [data-export="Kit/Studs_Tile"]', 'full', { nomargin: true, tile: 96 });
// progress bars: one clean 9-slice each, placed on every bar in the UI (capacity, timers, requirements, ...)
const BARS = '.bar:not(#xpbar .bar):not(#kit .bar)';
add('00_Shared/Bar_Track_9Slice', '#kit [data-export="Kit/Bar_Track"]', 'bare', { hide: '.fill', slice: [12, 12, 12, 12], instSel: BARS });
add('00_Shared/Bar_Fill_Green_9Slice', '#kit [data-export="Kit/Bar_Fill_Green"]', 'only', { show: '.fill', slice: [10, 8, 10, 8], instSel: BARS.replace('.bar:', '.bar.green-fill:'), leftFill: true });
add('00_Shared/Bar_Fill_Gold_9Slice', '#kit [data-export="Kit/Bar_Fill_Gold"]', 'only', { show: '.fill', slice: [10, 8, 10, 8], instSel: '.bar:not(.green-fill):not(#xpbar .bar):not(#kit .bar)', leftFill: true });
add('00_Shared/Scrollbar_Track', '#scr-store .scrollbar', 'bare', { hide: '.thumb' });
add('00_Shared/Scrollbar_Thumb', '#scr-store .scrollbar', 'only', { show: '.thumb' });
add('00_Shared/Sparkle', '#sparkle-one', 'full');
add('00_Shared/Glow_Soft', '#glow-one', 'full');
add('00_Shared/Rays_White', '#rays-one', 'full', { spin: true });
for (const c of ['red', 'blue', 'green', 'lime', 'gold', 'purple', 'emerald', 'gray', 'earth', 'off', 'unknown'])
  add(`00_Shared/Skins_9Slice/Skin_${c[0].toUpperCase() + c.slice(1)}`, `#kit [data-export="Kit/Skin_${c[0].toUpperCase() + c.slice(1)}"]`, 'full', { slice: [14, 14, 14, 18] });
for (const r of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'])
  add(`00_Shared/Skins_9Slice/Skin_Rarity_${r}`, `#kit [data-export="Kit/Skin_Rarity_${r}"]`, 'full', { slice: [14, 14, 14, 18] });

// panel headers (one per screen; they differ in colour and size)
const header = (folder, scr, extraHide = '') => add(`${folder}/Panel/Header_Bar`, `${scr} .phead`, 'bare', { hide: '.btn-close' + extraHide });

// ---- Daily Rewards
header('02_DailyRewards', '#scr-daily', ', #btn-claimall');
add('02_DailyRewards/Panel/Header_Calendar_Icon', '#cal-icon', 'full');
add('02_DailyRewards/Buttons/Btn_ClaimAll', '#btn-claimall');
add('02_DailyRewards/Cards/Card_Day_Blue', '#scr-daily .day > .skin.blue', 'bare', { hide: '.status' });
add('02_DailyRewards/Cards/Card_Day_Purple', '#scr-daily .day > .skin.purple', 'bare', { hide: '.status' });
add('02_DailyRewards/Cards/Card_Day_Gold', '#scr-daily .day > .skin.gold', 'bare', { hide: '.status' });
add('02_DailyRewards/Cards/Card_Day7_Rainbow', '#day7 > .skin', 'bare', { hide: '.status, .rays, [data-sparkles]' });
add('02_DailyRewards/Cards/Day7_Rays', '#day7 .rays', 'full', { spin: true });
add('02_DailyRewards/Buttons/Btn_State_Claimed', '#scr-daily .status.gray');
add('02_DailyRewards/Buttons/Btn_State_Claim', '#scr-daily .status.green');
add('02_DailyRewards/Buttons/Btn_State_Locked', '#scr-daily .status.red');
add('02_DailyRewards/Decor/Sticker_OP', '#op', 'full', { baked: true });

// ---- Store
header('03_Store', '#scr-store');
add('03_Store/Panel/Header_Robux_Icon', '#scr-store > .svgi', 'full');
add('03_Store/Buttons/Category_Selected', '#scr-store .scat.gold');
add('03_Store/Buttons/Category_Unselected', '#scr-store .scat.off');
add('03_Store/Cards/Pass_Card_Purple', '#scr-store .pass > .skin.purple', 'bare', { hide: '.buy' });
add('03_Store/Cards/Pass_Card_Blue', '#scr-store .pass > .skin.blue', 'bare', { hide: '.buy' });
add('03_Store/Cards/ServerLuck_Card_Green', '#luck .luck > .skin.emerald', 'bare', { hide: '.buy' });
add('03_Store/Cards/ServerLuck_Card_Gold', '#luck .luck > .skin.gold', 'bare', { hide: '.buy' });
add('03_Store/Cards/ServerLuck_Card_Rainbow', '#luck .luck > .skin.amber7', 'bare', { hide: '.buy' });
add('03_Store/Cards/Pack_Card_Blue', '#packs .pack > .skin.blue', 'bare', { hide: '.buy' });
add('03_Store/Cards/Pack_Card_Purple', '#packs .pack > .skin.purple', 'bare', { hide: '.buy' });
add('03_Store/Cards/Pack_Card_Gold', '#packs .pack > .skin.gold', 'bare', { hide: '.buy' });
add('03_Store/Buttons/Btn_BuyRobux', '#scr-store .buy');
add('03_Store/Icons/Icon_Robux_White', '#scr-store .buy .svgi', 'full');

// ---- Field Guide
header('04_FieldGuide', '#scr-guide');
add('04_FieldGuide/Panel/Header_FieldGuide_Icon', '#scr-guide > img', 'full');
add('04_FieldGuide/Buttons/Tab_Selected', '#index-top .cat');
for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'])
  add(`04_FieldGuide/Cards/Card_${r[0].toUpperCase() + r.slice(1)}`, `#kit [data-export="Kit/Skin_Rarity_${r[0].toUpperCase() + r.slice(1)}"]`, 'full', { slice: [14, 14, 14, 18], alias: true });
add('04_FieldGuide/Cards/Card_Undiscovered', '#index-grid .skin.unknown', 'bare', { hide: '.dot' });
add('04_FieldGuide/Cards/Card_Discovered_Rare', '#index-grid .crit:not(.unknown-c) .skin.r-rare', 'bare', { hide: '.dot, .job' });
add('04_FieldGuide/Cards/Card_Discovered_Uncommon', '#index-grid .crit:not(.unknown-c) .skin.r-uncommon', 'bare', { hide: '.dot, .job' });
add('04_FieldGuide/Decor/Job_Badge', '#index-grid .job', 'bare');
add('04_FieldGuide/Decor/Rarity_Dot', '#index-grid .dot', 'full');
add('04_FieldGuide/Cards/Entry_Detail_Rare', '#guide-detail', 'bare', { hide: '.pill, .note' });
for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'])
  add(`04_FieldGuide/Cards/Milestone_${r[0].toUpperCase() + r.slice(1)}`, `#milestones .ms .skin.r-${r}`, 'bare');

// ---- Rebirth
header('05_Rebirth', '#scr-rebirth');
add('05_Rebirth/Panel/Header_Rebirth_Icon', '#scr-rebirth > img', 'full');
add('05_Rebirth/Cards/Hero_Card', '#reb-hero', 'bare', { hide: '.rays' });
add('05_Rebirth/Cards/Hero_Rays', '#reb-hero .rays', 'full', { spin: true });
add('05_Rebirth/Cards/Requirement_Card', '#reb-reqs .req > .skin', 'bare', { hide: '.bar, .check' });
add('05_Rebirth/Decor/Check_Done', '#reb-reqs .check.ok', 'full', { baked: true });
add('05_Rebirth/Decor/Check_NotDone', '#reb-reqs .check.no', 'full', { baked: true });
add('05_Rebirth/Cards/Reward_Card_Gold', '#reb-right .rew > .skin.gold');
add('05_Rebirth/Cards/Reward_Card_Green', '#reb-right .rew > .skin.emerald');
add('05_Rebirth/Cards/Reward_Card_Blue', '#reb-right .rew > .skin.blue');
add('05_Rebirth/Buttons/Btn_Rebirth_Locked', '#btn-rebirth');
add('05_Rebirth/Buttons/Btn_Rebirth_Ready', '#btn-rebirth-ready', 'bare', { pickAlt: true });

// ---- Keeper's Shop
header('06_KeepersShop', '#scr-keeper', ', .kp-timer');
add('06_KeepersShop/Panel/Header_Shop_Icon', '#scr-keeper > img', 'full');
add('06_KeepersShop/Panel/Restock_Timer_Pill', '#scr-keeper .kp-timer', 'bare', { hide: '.bar' });
add('06_KeepersShop/Cards/Item_Row', '#kp-grid .row > .skin', 'bare', { hide: '.well, .rpill, .buy' });
for (const r of ['common', 'uncommon', 'rare', 'epic'])
  add(`06_KeepersShop/Cards/Item_Well_${r[0].toUpperCase() + r.slice(1)}`, `#kp-grid .well > .skin.r-${r}`, 'bare', { hide: '.bd-thumb' });
add('06_KeepersShop/Buttons/Btn_Buy', '#kp-grid .buy.green');
add('06_KeepersShop/Buttons/Btn_Buy_Disabled', '#kp-grid .buy.gray');
add('06_KeepersShop/Decor/Stamp_SoldOut', '#kp-grid .stamp', 'full', { baked: true });

// ---- Upgrades
header('07_Upgrades', '#scr-upgrades');
add('07_Upgrades/Panel/Header_Upgrade_Icon', '#scr-upgrades > img', 'full');
add('07_Upgrades/Cards/Upgrade_Row_Blue', '#upg-list .upg > .skin.blue', 'bare', { hide: '.buy, .tier' });
add('07_Upgrades/Cards/Upgrade_Row_Purple', '#upg-list .upg > .skin.purple', 'bare', { hide: '.buy, .tier' });
add('07_Upgrades/Cards/Upgrade_Row_Gold', '#upg-list .upg > .skin.gold', 'bare', { hide: '.buy, .tier' });
add('07_Upgrades/Buttons/Btn_Upgrade', '#upg-list .buy');

// ---- My Terrarium (Creatures + Holding)
header('08_MyTerrarium', '#scr-hub');
add('08_MyTerrarium/Buttons/Tab_Selected', '#scr-hub .htabs .cat.green');
add('08_MyTerrarium/Buttons/Tab_Unselected', '#scr-hub .htabs .cat.off');
add('08_MyTerrarium/Buttons/Tab_Count_Badge', '#scr-hub .htabs .cnt');
add('08_MyTerrarium/Cards/Creature_Card_Common', '#hub-grid .skin.r-common', 'bare', { hide: '.dot, .job' });
add('08_MyTerrarium/Cards/Creature_Card_Uncommon', '#hub-grid .skin.r-uncommon', 'bare', { hide: '.dot, .job' });
add('08_MyTerrarium/Cards/Creature_Card_Rare', '#hub-grid .skin.r-rare', 'bare', { hide: '.dot, .job' });
add('08_MyTerrarium/Cards/Empty_Slot', '#hub-grid .crit.empty');
add('08_MyTerrarium/Cards/Detail_Strip', '#hub-detail', 'bare', { hide: '.btns, .pill' });
add('08_MyTerrarium/Buttons/Btn_MoveToHolding', '#hub-detail .btns .skin.blue');
add('08_MyTerrarium/Buttons/Btn_Release', '#hub-detail .btns .skin.red');
add('08_MyTerrarium/Holding/Holding_Note_Bar', '#scr-holding .hold-note');
add('08_MyTerrarium/Holding/Holding_Row_Common', '#hold-list .hrow > .skin.r-common', 'bare', { hide: '.btns, .pill' });
add('08_MyTerrarium/Holding/Holding_Row_Uncommon', '#hold-list .hrow > .skin.r-uncommon', 'bare', { hide: '.btns, .pill' });
add('08_MyTerrarium/Holding/Btn_MoveToTank_Disabled', '#hold-list .btns .skin.gray');
add('08_MyTerrarium/Holding/Btn_Release_Small', '#hold-list .btns .skin.red');
add('08_MyTerrarium/Holding/Empty_Holding_Slot', '#hold-list .hold-empty');
add('08_MyTerrarium/Holding/Btn_UpgradeTank', '#hold-foot .skin.gold');
add('08_MyTerrarium/Holding/Btn_ReleaseCommons', '#hold-foot .skin.red');
add('08_MyTerrarium/Panel/Header_Terrarium_Icon', '#scr-hub > img', 'full');

// ---- My Terrarium Stats
add('09_MyTerrariumStats/Cards/Stat_Tile_Green', '#scr-stats .tile3 > .skin.green');
add('09_MyTerrariumStats/Cards/Stat_Tile_Gold', '#scr-stats .tile3 > .skin.gold');
add('09_MyTerrariumStats/Cards/Stat_Tile_Blue', '#scr-stats .tile3 > .skin.blue');
add('09_MyTerrariumStats/Breakdown/Zone_Bar_Track', '#breakdown .zbar', 'bare', { hide: '.zone, .mark' });
add('09_MyTerrariumStats/Breakdown/Zone_Good_Area', '#breakdown .zbar', 'only', { show: '.zone', slice: [8, 6, 8, 6] });
add('09_MyTerrariumStats/Breakdown/Zone_Marker', '#breakdown .zbar', 'only', { show: '.mark' });
add('09_MyTerrariumStats/Breakdown/Status_Chip_Good', '#breakdown .chip2.ok');
add('09_MyTerrariumStats/Breakdown/Status_Chip_Warn', '#breakdown .chip2.warn');
add('09_MyTerrariumStats/Breakdown/Status_Chip_Bad', '#breakdown .chip2.bad');
add('09_MyTerrariumStats/Breakdown/Hint_Bar', '#scr-stats div.hint');
for (const [i, n] of [['fallen_leaf', 'Waste'], ['microbe', 'Mould'], ['cricket', 'Prey'], ['herb', 'Flora'], ['rainbow', 'Diversity']])
  add(`09_MyTerrariumStats/Icons/Icon_${n}`, `#breakdown img[src$="${i}.png"]`, 'full');

// ---- Edit Tank (Layers + Backdrops)
add('10_EditTank/Panel/Header_Bar', '#scr-build .phead', 'bare', { hide: '.btn-close' });
add('10_EditTank/Panel/Header_Terrarium_Icon', '#scr-build > img', 'full');
add('10_EditTank/Buttons/Tab_Selected', '#btabs .cat.green');
add('10_EditTank/Buttons/Tab_Unselected', '#btabs .cat.off');
add('10_EditTank/Buttons/Tab_Backdrops_Unselected_Wide', '#btabs .cat.off:last-child');
add('10_EditTank/Layers/Layer_Stack_Box', '#stack', 'bare', { hide: '.stack-box' });
add('10_EditTank/Layers/Layer_Stack_Glass', '#stack .stack-box', 'bare', { hide: '.strip, .drop-slot' });
add('10_EditTank/Layers/Drop_Slot_Dashed', '#stack .drop-slot');
add('10_EditTank/Layers/Strip_Soil', '#stack .s-soil');
add('10_EditTank/Layers/Strip_Filter', '#stack .s-filter');
add('10_EditTank/Layers/Strip_ClayBalls', '#stack .s-clay');
add('10_EditTank/Layers/Item_Card', '#bgrid .bitem > .skin', 'bare');
add('10_EditTank/Layers/Tag_InTank', '#bgrid .intank');
add('10_EditTank/Layers/Drag_Grip_Dots', '#bgrid .grip', 'full');
add('10_EditTank/Buttons/Tool_Rotate', '#btools .tool:nth-child(1)', 'full');
add('10_EditTank/Buttons/Tool_Move', '#btools .tool:nth-child(2)', 'full');
add('10_EditTank/Buttons/Tool_Remove', '#btools .tool:nth-child(3)', 'full');
add('10_EditTank/Buttons/Btn_Done', '#btn-done');
add('10_EditTank/Drag/Drag_Ghost_Card', '#ghost > .skin');
add('10_EditTank/Drag/Drop_Target_Ring', '#drop-hint .ring', 'full');
add('10_EditTank/Drag/Drop_Hint_Pill', '#drop-hint .pill');
add('10_EditTank/Backdrops/OnTank_Box', '#bd-now', 'bare', { hide: '.bd-thumb' });
// the first card is fully in view; the other card styles are exported by re-colouring it
add('10_EditTank/Backdrops/Backdrop_Card_Common', '#bdgrid .bdc:nth-child(2) > .skin', 'bare', { hide: '.bd-thumb, .btnx' });
add('10_EditTank/Backdrops/Backdrop_Card_Uncommon', '#bdgrid .bdc:nth-child(2) > .skin', 'bare', { hide: '.bd-thumb, .btnx', cls: [['#bdgrid .bdc:nth-child(2) > .skin', 'r-common', 'r-uncommon']] });
add('10_EditTank/Backdrops/Backdrop_Card_Rare', '#bdgrid .bdc:nth-child(2) > .skin', 'bare', { hide: '.bd-thumb, .btnx', cls: [['#bdgrid .bdc:nth-child(2) > .skin', 'r-common', 'r-rare']] });
add('10_EditTank/Backdrops/Backdrop_Card_Locked', '#bdgrid .bdc:nth-child(2) > .skin', 'bare', { hide: '.bd-thumb, .btnx', cls: [['#bdgrid .bdc:nth-child(2) > .skin', 'r-common', 'unknown']] });
add('10_EditTank/Backdrops/Btn_Equip', '#bdgrid .btnx.blue');
add('10_EditTank/Backdrops/Btn_Equipped', '#bdgrid .btnx.gray');
for (const b of ['default', 'woodland', 'bog', 'snowfield', 'canyon', 'rainforest', 'cavern', 'amber', 'primordial', 'underwater'])
  add(`10_EditTank/Backdrops/Thumbnails/Backdrop_${b[0].toUpperCase() + b.slice(1)}`, `#kit .bd-thumb[data-bd="${b}"]`, 'full', { unlock: true, alias: true });

// ---- Egg Inventory (frames only; eggs are 3D models)
header('11_EggInventory', '#scr-eggs');
for (const r of ['common', 'uncommon', 'rare', 'epic'])
  add(`11_EggInventory/Cards/Egg_Card_${r[0].toUpperCase() + r.slice(1)}`, `#egg-grid .eggc:not(.none) > .skin.r-${r}`, 'bare');
add('11_EggInventory/Cards/Egg_Card_None', '#egg-grid .eggc.none > .skin', 'bare');
add('11_EggInventory/Cards/Egg_Slot_ComingSoon', '#egg-grid .crit.empty');
add('11_EggInventory/Cards/Egg_Detail_Panel', '#egg-detail', 'bare', { hide: '.pill, .btnx' });
add('11_EggInventory/Buttons/Btn_Incubate', '#egg-detail .btnx');
add('11_EggInventory/Icons/Icon_Satchel', '#egg-foot img', 'full');

// ---- Incubator pop-ups
add('12_IncubatorPopups/Popup_Body', '.inc .box', 'bare', { hide: '.hd, .bar, .act, .lock' });
add('12_IncubatorPopups/Popup_Pointer', '.inc .tail', 'full');
add('12_IncubatorPopups/Header_Incubating', '.inc:not(.ready):not(.locked) .hd', 'bare', { hide: '.rchip' });
add('12_IncubatorPopups/Rarity_Chip', '.inc:not(.ready):not(.locked) .rchip');
add('12_IncubatorPopups/Locked_Chip', '.inc.locked .rchip');
add('12_IncubatorPopups/Header_Ready', '.inc.ready .hd');
add('12_IncubatorPopups/Header_Locked', '.inc.locked .hd', 'bare', { hide: '.rchip' });
add('12_IncubatorPopups/Btn_Skip', '.inc:not(.ready):not(.locked) .act');
add('12_IncubatorPopups/Btn_Hatch', '.inc.ready .act');
add('12_IncubatorPopups/Btn_Unlock', '.inc.locked .act');
add('12_IncubatorPopups/Icon_Padlock', '.inc .lock', 'full');
add('12_IncubatorPopups/Shake_Tick', '.inc .tick', 'full');

// ---- Hatch Reveal
add('13_HatchReveal/Backdrop_Dim', '#scr-hatch > #hatch-dim', 'full');
add('13_HatchReveal/Card/Header_Rare', '#hatch-card .phead', 'bare');
add('13_HatchReveal/Card/Window_Rare', '#hatch-win', 'bare', { hide: '.rays, .glow, .shell' });
add('13_HatchReveal/Card/Window_Rays', '#hatch-win .rays', 'full', { spin: true });
add('13_HatchReveal/Card/Window_Glow', '#hatch-win .glow', 'full');
add('13_HatchReveal/Card/Field_Note_Box', '#hatch-note');
add('13_HatchReveal/Card/Sticker_NewSpecies', '#hatch-new', 'full', { baked: true });
add('13_HatchReveal/Card/Header_FieldGuide_Icon', '#hatch-card > img', 'full');
add('13_HatchReveal/Buttons/Btn_AddToTerrarium', '#hatch-btn');
add('13_HatchReveal/Buttons/Btn_SendToHolding', '#hatch-btn-alt', 'bare', { pickAlt: true });
for (const r of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']) {
  add(`13_HatchReveal/Bursts/Burst_${r}`, `.burst[data-export="HatchReveal/Burst_${r}"]`, 'full', { pickAlt: true, spin: true });
  if (r !== 'Rare') {
    const k = r.toLowerCase();
    add(`13_HatchReveal/Card/Header_${r}`, '#hatch-card .phead', 'bare', { cls: [['#hatch-card .phead', 'r-rare', `r-${k}`]] });
    add(`13_HatchReveal/Card/Window_${r}`, '#hatch-win', 'bare', { hide: '.rays, .glow, .shell', cls: [['#hatch-win', 'r-rare', `r-${k}`]] });
  }
}

// ---- Release dialogs
add('14_Release/Dialog_Header_Red', '#rel-1 .phead', 'bare', { hide: '.btn-close' });
add('14_Release/Dialog_Header_Red_Wide', '#rel-2 .phead', 'bare', { hide: '.btn-close' });
add('14_Release/Creature_Frame_Common', '#rel-1 .who > .skin', 'bare');
add('14_Release/Creature_Frame_Epic', '#rel-2 .who > .skin', 'bare');
add('14_Release/Warning_Bar', '#rel-2 .warnbar');
add('14_Release/Buttons/Btn_Cancel', '#rel-1 .acts .skin.gray');
add('14_Release/Buttons/Btn_Release', '#rel-1 .acts .skin.red');
add('14_Release/Buttons/Btn_HoldToRelease', '#rel-2 .acts .hold', 'bare', { hide: '.fillp' });
add('14_Release/Buttons/HoldToRelease_Fill', '#rel-2 .acts .hold', 'only', { show: '.fillp', set: [['#rel-2 .fillp', 'width', '100%']], slice: [4, 4, 4, 4], fill: 0.42 });
add('14_Release/Buttons/Checkbox_On', '#rel-3 .cb.on', 'full', { baked: true });
add('14_Release/Buttons/Checkbox_Off', '#rel-3 .cb:not(.on)', 'full');

// ---- Notifications
add('15_Notifications/Wilds_Indicator', '#wilds-ind');
add('15_Notifications/Icon_PvP_Swords', '#wilds-ind img', 'full');
add('15_Notifications/Banner_Red_Wilds', '.banner .skin.red');
add('15_Notifications/Banner_Green_Safe', '.banner .skin.green');
add('15_Notifications/Icon_Safe_Shield', '.banner .skin.green img', 'full');
add('15_Notifications/Announcement_Strip', '.announce');
add('15_Notifications/Icon_PartyPopper', '.announce img', 'full');
add('15_Notifications/Toast_Body', '.toast', 'bare', { hide: '.tab' });
add('15_Notifications/Toast_Tab_Green', '.toast .tab.green', 'bare');
add('15_Notifications/Toast_Tab_Blue', '.toast .tab.blue', 'bare');
add('15_Notifications/Toast_Tab_Red', '.toast .tab.red', 'bare');
add('15_Notifications/Egg_Flight_Trail', '#egg-fly', 'full');

// ---- Welcome Back
add('16_WelcomeBack/Dialog_Header_Gold', '#wb-dlg .phead', 'bare', { hide: '.btn-close' });
add('16_WelcomeBack/Icon_PocketWatch', '#wb .hero img', 'full');
add('16_WelcomeBack/Btn_Collect', '#wb-dlg .acts .skin.green');

// ---- Settings + Codes
header('17_SettingsCodes', '#scr-settings');
add('17_SettingsCodes/Panel/Header_Gear_Icon', '#scr-settings > img', 'full');
add('17_SettingsCodes/Rows/Setting_Row', '#scr-settings .srow:not(.tall) > .skin', 'bare', { hide: '.toggle, .slider' });
add('17_SettingsCodes/Rows/Setting_Row_Tall', '#scr-settings .srow.tall > .skin', 'bare', { hide: '.steps' });
add('17_SettingsCodes/Controls/Toggle_On_Track', '.toggle.on', 'bare', { hide: '.knob' });
add('17_SettingsCodes/Controls/Toggle_Off_Track', '.toggle.off', 'bare', { hide: '.knob' });
add('17_SettingsCodes/Controls/Toggle_Knob', '.toggle.on .knob', 'full');
add('17_SettingsCodes/Controls/Slider_Track', '.slider .trk', 'bare', { hide: '.fl' });
add('17_SettingsCodes/Controls/Slider_Fill', '.slider .trk', 'only', { show: '.fl', set: [['.slider .fl', 'width', '100%']], slice: [6, 4, 6, 4], fill: 0.7 });
add('17_SettingsCodes/Controls/Slider_Knob', '.slider .kb', 'full');
add('17_SettingsCodes/Controls/Steps_Track', '.steps .trk', 'bare', { hide: '.fl' });
add('17_SettingsCodes/Controls/Steps_Notch_On', '.steps .notch.on', 'full');
add('17_SettingsCodes/Controls/Steps_Notch_Off', '.steps .notch:not(.on)', 'full');
add('17_SettingsCodes/Controls/Steps_Knob', '.steps .kb', 'full');
add('17_SettingsCodes/Codes/Codes_Box', '#codes', 'bare', { hide: '.input, .btnc, .cstate' });
add('17_SettingsCodes/Codes/Code_Input_Field', '#codes .input', 'bare', { hide: '.caret', text: true });
add('17_SettingsCodes/Codes/Btn_Redeem', '#codes .btnc.green');
add('17_SettingsCodes/Codes/Btn_Credits', '#codes .btnc.gray');
add('17_SettingsCodes/Codes/Result_Dot_Success', '#codes .cstate.good .dotc', 'full', { baked: true });
add('17_SettingsCodes/Codes/Result_Dot_Invalid', '#codes .cstate.badc .dotc', 'full', { baked: true, pickAlt: true });
for (const [i, n] of [['musical_note', 'Music'], ['leaf_fluttering_in_wind', 'Ambience'], ['deciduous_tree', 'EnvironmentAnimation'], ['sparkles', 'Graphics'],
  ['spider', 'Arachnophobia'], ['lady_beetle', 'CuteBugs'], ['PvP_Swords', 'PvP']])
  add(`17_SettingsCodes/Icons/Icon_${n}`, `#scr-settings img[src*="${i}"]`, 'full');

// ---- icons shared by many screens (exported once, every use recorded)
add('00_Shared/Icons/Icon_Shilling', 'img.coin-i:not(#money-row .coin-i)', 'full', { biggest: true });
add('00_Shared/Icons/Icon_Robux', '.svgi[data-src$="robux.svg"]', 'full', { biggest: true });
add('00_Shared/Icons/Icon_Padlock', 'img[src$="locked.png"]', 'full', { biggest: true });
for (const [s, n] of [['broom', 'Job_Cleaner'], ['herb', 'Job_Forager'], ['bullseye', 'Job_Hunter'], ['blossom', 'Job_Pollinator'], ['gem_stone', 'Job_Keystone']])
  add(`00_Shared/Icons/Icon_${n}`, `.job img[src$="${s}.png"], .pill img[src$="${s}.png"]`, 'full', { biggest: true, optional: true });
for (const [s, n] of [['VIP_Crown', 'VIP_Crown'], ['Clover_Tier1', 'ServerLuck_Clover_1'], ['Clover_Tier2', 'ServerLuck_Clover_2'], ['Clover_Tier3', 'ServerLuck_Clover_3'],
  ['Shillings_Tier1', 'Shillings_Pack_1'], ['Shillings_Tier2', 'Shillings_Pack_2'], ['Shillings_Tier3', 'Shillings_Pack_3'], ['Shillings_Tier4', 'Shillings_Pack_4'],
  ['Terrarium', 'Terrarium'], ['Satchel', 'Satchel'], ['Seedling', 'Seedling'], ['FieldGuide.png', 'FieldGuide_Book'],
  ['Decor_MossyRock', 'Decor_MossyRock'], ['Decor_Fern', 'Decor_Fern'], ['Decor_Mushroom', 'Decor_Toadstool'], ['Decor_Branch', 'Decor_Branch'],
  ['Layer_ClayBalls', 'Layer_ClayBalls'], ['Layer_Pebbles', 'Layer_Pebbles'], ['Layer_Filter', 'Layer_Filter'], ['Layer_Charcoal', 'Layer_Charcoal'],
  ['Layer_Soil', 'Layer_Soil'], ['Layer_LeafLitter', 'Layer_LeafLitter'], ['Layer_Moss', 'Layer_Moss'], ['framed_picture', 'Backdrops_Category'], ['upgrade.png', 'Upgrade_Arrow'],
  ['ticket', 'Title_Ticket']])
  add(`00_Shared/Icons/Icon_${n}`, `img[src*="${s}"]`, 'full', { biggest: true, optional: true });

// images that are creatures or eggs: never exported, recorded as slots for the 3D models
const SLOT_SEL = 'img[src*="Creature_"], img[src*="Egg_"], img[src*="fluent/snail"], img[src*="fluent/worm"], img[src*="fluent/ant"], img[src*="fluent/honeybee"], ' +
  'img[src*="fluent/cricket"], img[src*="fluent/frog"], img[src*="fluent/bug"], img[src*="fluent/cockroach"], img[src*="fluent/spider"], img[src*="fluent/beetle"], ' +
  'img[src*="fluent/lizard"], img[src*="fluent/butterfly"]';

// ------------------------------------------------------------------------------------------------ run
const types = { '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/hud.html`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  fs.rmSync(out, { recursive: true, force: true });
  const assetDir = path.join(out, 'Assets');
  fs.mkdirSync(assetDir, { recursive: true });

  // page helpers: isolate one element, apply a mode, measure visible content
  await page.addStyleTag({ content: `
    body.isolate #stage .solo .xhide, body.isolate #stage .solo .xhide * { visibility: hidden !important; }
    body.isolate.xonly #stage .solo, body.isolate.xonly #stage .solo * { visibility: hidden !important; }
    body.isolate.xonly #stage .solo .xshow, body.isolate.xonly #stage .solo .xshow * { visibility: visible !important; }
    body.isolate #stage .solo .state-alt:not(.solo):not(.xunlock) { visibility: hidden; }
    body.isolate.xunlock #stage .solo, body.isolate.xunlock #stage .solo * { filter: none !important; }` });
  await page.evaluate((SCREENS) => {
    window.__SCREENS = SCREENS;
    window.__prep = (el, a, on) => {
      document.body.classList.toggle('isolate', on);
      document.body.classList.toggle('xonly', on && a.mode === 'only');
      document.body.classList.toggle('xunlock', on && !!a.unlock);
      el.classList.toggle('solo', on);
      if (!on) { document.querySelectorAll('.xhide, .xshow').forEach(e => e.classList.remove('xhide', 'xshow')); return; }
      const hideSel = [a.mode === 'bare' ? (a.text ? 'img, .svgi' : '.t, img, .svgi') : '', a.hide || ''].filter(Boolean).join(', ');
      if (hideSel) el.querySelectorAll(hideSel).forEach(e => { if (!(a.keep && e.matches(a.keep))) e.classList.add('xhide'); });
      if (a.mode === 'bare' && a.text) { el.style.color = 'transparent'; el.dataset.__col = '1'; }
      if (a.mode === 'only') el.querySelectorAll(a.show).forEach(e => e.classList.add('xshow'));
    };
    window.__bounds = (el, m, nomargin) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const e of [el, ...el.querySelectorAll('*')]) {
        const cs = getComputedStyle(e);
        if (cs.visibility !== 'visible' || cs.display === 'none') continue;
        let r = e.getBoundingClientRect();
        for (let p = e.parentElement; p && p !== el.parentElement; p = p.parentElement) {
          if (getComputedStyle(p).overflow !== 'hidden') continue;
          const c = p.getBoundingClientRect();
          r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
          r.width = r.right - r.left; r.height = r.bottom - r.top;
        }
        if (r.width <= 0 || r.height <= 0) continue;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      if (x0 === Infinity) return null;
      if (nomargin) m = 0;
      return { x: Math.floor(x0 - m), y: Math.floor(y0 - m), w: Math.ceil(x1 + m) - Math.floor(x0 - m), h: Math.ceil(y1 + m) - Math.floor(y0 - m) };
    };
    window.__screenOf = el => {
      if (el.closest('#kit')) return null;
      for (const s of __SCREENS) if (s.root && el.closest(s.root)) return s.key;
      return el.closest('.screen') ? null : 'MainHUD';
    };
  }, SCREENS);

  // decorative vines: five variation sets; the game shows one set at a time
  const vines = await page.evaluate(() => [...new Map([...document.querySelectorAll('svg.wv[data-vn]')]
    .map(e => [e.dataset.v + '|' + e.dataset.vn, { v: e.dataset.v, vn: e.dataset.vn }])).values()]);
  for (const { v, vn } of vines) {
    const [scope] = vn.split('_');
    const nice = vn.replace(/^panel/, 'CentrePanel').replace(/^side/, 'SidePanel').replace(/^hub/, 'TerrariumPanel');
    A.push({ file: `18_Vines/Set${v}/Vine_${nice}`, sel: `svg.wv[data-v="${v}"][data-vn="${vn}"]`, mode: 'full', vines: v, vineSet: +v, front: vn.endsWith('_Front') });
  }

  const manifest = { canvas: [1920, 1080], screens: SCREENS.map(s => ({ key: s.key, folder: s.folder })), assets: [], texts: [], slots: [], frames: [] };
  const seen = new Set();
  for (const a of A) {
    const res = await page.evaluate(async ([a, M]) => {
      document.body.dataset.vines = a.vines || '1';
      const all = [...document.querySelectorAll(a.sel)];
      if (!all.length) return { missing: true };
      // which copy to export
      let el = all[0];
      if (!a.pickAlt) el = all.find(e => !e.closest('.state-alt')) || all[0];
      const sets = [];
      const apply = (on) => {
        for (const [s, prop, val] of a.set || []) document.querySelectorAll(s).forEach(e => {
          if (on) { sets.push([e, prop, e.style.getPropertyValue(prop)]); e.style.setProperty(prop, val); }
        });
        if (!on) { sets.forEach(([e, prop, v]) => v ? e.style.setProperty(prop, v) : e.style.removeProperty(prop)); sets.length = 0; }
        for (const [s, from, to] of a.cls || []) document.querySelectorAll(s).forEach(e => { e.classList.replace(on ? from : to, on ? to : from); });
      };
      // instances: every copy, measured the same way as the exported one
      const inst = [];
      for (const e of (a.instSel ? [...document.querySelectorAll(a.instSel)] : all)) {
        const scr = __screenOf(e);
        if (!scr && e !== el) continue;
        __prep(e, a, true);
        const b = __bounds(e, M, a.nomargin);
        __prep(e, a, false);
        if (b) inst.push({ screen: scr, rect: b, alt: !!e.closest('.state-alt') });
      }
      if (a.biggest) { let best = 0, ba = 0; all.forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.width * r.height > ba) { ba = r.width * r.height; best = i; } }); el = all[best]; }
      apply(true);
      if (a.cls) await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      __prep(el, a, true);
      const clip = __bounds(el, M, a.nomargin);
      return { clip, inst };
    }, [a, MARGIN]);
    if (res.missing) { if (!a.optional) console.warn('MISSING', a.file, a.sel); continue; }
    if (!res.clip || res.clip.w <= 0 || res.clip.h <= 0 || res.clip.y >= 1080 || res.clip.x >= 1920) {
      console.warn('EMPTY', a.file);
      await page.evaluate(() => { document.querySelectorAll('.solo').forEach(e => e.classList.remove('solo')); document.body.classList.remove('isolate', 'xonly', 'xunlock'); document.querySelectorAll('.xhide, .xshow').forEach(e => e.classList.remove('xhide', 'xshow')); });
      continue;
    }
    const clip = { x: Math.max(0, res.clip.x), y: Math.max(0, res.clip.y) };
    clip.width = Math.min(1920, res.clip.x + res.clip.w) - clip.x; clip.height = Math.min(1080, res.clip.y + res.clip.h) - clip.y;
    const big = Math.max(clip.width, clip.height);
    const scale = big * 2 <= MAX ? 2 : big <= MAX ? 1 : +(MAX / big).toFixed(3);
    let buf = await page.screenshot({ clip, omitBackground: true, scale: scale === 2 ? 'device' : 'css' });
    if (scale < 1) {
      const url = await page.evaluate(async ([b64, k]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      }, [buf.toString('base64'), scale]);
      buf = Buffer.from(url.split(',')[1], 'base64');
    }
    // undo everything for the next asset
    await page.evaluate(([a]) => {
      const el = document.querySelector('.solo'); if (el) { __prep(el, a, false); if (el.dataset.__col) { el.style.color = ''; delete el.dataset.__col; } }
      for (const [s, prop] of a.set || []) document.querySelectorAll(s).forEach(e => e.style.removeProperty(prop));
      for (const [s, from, to] of a.cls || []) document.querySelectorAll(s).forEach(e => e.classList.replace(to, from));
      document.body.classList.remove('isolate', 'xonly', 'xunlock');
    }, [a]);
    const file = path.join(assetDir, a.file + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    const name = path.basename(a.file);
    if (seen.has(a.file)) console.warn('DUPLICATE', a.file);
    seen.add(a.file);
    const px = v => Math.round(v * scale);
    const entry = { name, file: 'Assets/' + a.file + '.png', size: [clip.width, clip.height], pixels: [px(clip.width), px(clip.height)],
      button: /^(Btn_|Tab_|Tool_|Category_|Toggle_|Checkbox_)/.test(name), vineSet: a.vineSet || null, front: !!a.front, baked: !!a.baked, spin: !!a.spin, fill: a.fill ?? null, leftFill: !!(a.leftFill || a.fill),
      instances: a.alias ? [] : res.inst.map(i => ({ screen: i.screen, x: i.rect.x, y: i.rect.y, w: i.rect.w, h: i.rect.h, alt: i.alt })) };
    if (a.slice) {
      const [l, t, r, b] = a.slice.map(v => v + (a.nomargin ? 0 : MARGIN));
      entry.slice = { left: px(l), top: px(t), right: px(clip.width - r), bottom: px(clip.height - b), scale: +(1 / scale).toFixed(3) };
    }
    if (a.tile) entry.tile = a.tile;
    manifest.assets.push(entry);
    console.log('asset', a.file, `${clip.width}x${clip.height}@${scale}x`, `x${entry.instances.length}`);
  }

  // text labels, creature/egg slots and native panel frames, per screen
  const baked = A.filter(a => a.baked).map(a => a.sel).join(', ');
  const extra = await page.evaluate(([SLOT_SEL, baked]) => {
    const texts = [], slots = [], frames = [];
    const q = s => [...document.querySelectorAll(s)];
    for (const t of q('.t')) {
      const scr = __screenOf(t);
      if (!scr || t.closest('.state-alt') || t.closest(baked)) continue;
      const r = t.getBoundingClientRect(); if (!r.width) continue;
      const cs = getComputedStyle(t), tf = cs.getPropertyValue('--tf') || cs.getPropertyValue('--tf-white');
      texts.push({ screen: scr, text: t.querySelector('.tm').innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/&amp;/g, '&').replace(/&#183;|·/g, '·').replace(/<[^>]+>/g, ''),
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), size: Math.round(parseFloat(cs.fontSize)),
        fill: [...tf.matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0]), rotation: 0 });
    }
    for (const i of q(SLOT_SEL)) {
      const scr = __screenOf(i);
      if (!scr || i.closest('.state-alt') || scr === 'Settings' || scr === 'MyTerrarium_Stats') continue;
      const r = i.getBoundingClientRect(); if (!r.width) continue;
      const src = i.getAttribute('src'), kind = /Egg_/.test(src) ? 'Egg' : 'Creature';
      slots.push({ screen: scr, kind, hint: src.split('/').pop().replace('.png', ''), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
    }
    // dark panel bodies, dialogs and pop-up bodies become native Frames (UICorner + UIStroke) with the stud tile
    for (const p of q('.panel')) {
      const scr = __screenOf(p);
      if (!scr || p.closest('.state-alt')) continue;
      const r = p.getBoundingClientRect();
      frames.push({ screen: scr, kind: 'Panel', x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), studs: true });
    }
    return { texts, slots, frames };
  }, [SLOT_SEL, baked]);
  Object.assign(manifest, extra);
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`done: ${manifest.assets.length} assets, ${manifest.texts.length} texts, ${manifest.slots.length} slots, ${manifest.frames.length} frames`);
  await browser.close();
  server.close();
});
