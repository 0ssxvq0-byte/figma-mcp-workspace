# Build a Terrarium UI: Roblox Studio import guide

Everything in this folder is made for a **1920 x 1080 design canvas**. Positions in `layout.json` use that size,
so `Scale = offset / 1920` (X) or `offset / 1080` (Y). Both values are already worked out for you.

## What's in the folder

| Folder | Contents |
|---|---|
| `HUD/`, `DailyRewards/`, `Store/`, `FieldGuide/`, `Rebirth/`, `KeepersShop/`, `Upgrades/`, `MyTerrarium/`, `MyTerrarium_Holding/`, `EditTerrarium/`, `EggInventory/`, `Incubator/`, `HatchReveal/`, `Release/`, `Notifications/`, `WelcomeBack/`, `Settings/` | One PNG per component, plus its separate layers (see below) |
| `Kit/` | 9-slice pieces for building new buttons, cards and panels at any size |
| `Icons/` | Every voxel icon on its own (eggs, terrarium, Shillings, decor, layers, events, and more) |
| `layout.json` | Position, size and text for every component |

### Layers

Components that combine a background, text and an icon are split so each part can be animated on its own:

| File | Use it for |
|---|---|
| `Name.png` | Quick placement, or anything that never changes |
| `Name__Base.png` | The button, card or panel on its own (no text, no icon) |
| `Name__Icon.png` | Just the icon, in the same spot |
| `Name__Text.png` | Just the text, in the same spot. Swap for a TextLabel when the text changes (timers, prices, counts, names) |

All layers of a component are the same size and line up exactly. Stack them as ImageLabels with
`Size = UDim2.fromScale(1, 1)` inside one Frame.

Images are 2x resolution where that fits Roblox's 1024 px limit, otherwise 1x. The full panels are wider than 1024 px
even at 1x, so they are shrunk to fit (the `scale` field in `layout.json`, e.g. `0.86`). For crisp panels, build them from
their parts (header, cards, buttons) plus the Kit panel body rather than the flattened `Panel_Full` image.

## Importing

1. **View → Asset Manager → Bulk Import**. Select the PNGs from one folder at a time. The file name becomes the asset name.
2. In your ScreenGui set `IgnoreGuiInset = true`, `ResetOnSpawn = false` and `ZIndexBehavior = Sibling`.
3. For each component, create a Frame (transparent) with:
   - `Position = UDim2.fromScale(position[1], position[2])` and `Size = UDim2.fromScale(size[1], size[2])` from `layout.json` → `udim2`
   - a `UIAspectRatioConstraint` with `AspectRatio = w / h` from `offset`, so it keeps its shape on phones
4. Put the layer ImageLabels inside, `BackgroundTransparency = 1`, `ScaleType = Fit`.

Each image already has 12 px of transparent padding around it for outlines and shadows. That padding is included
in the `offset` / `udim2` values, so nothing needs adjusting.

## Text as TextLabels

Use TextLabels for anything that changes. To match the mockups:

- **Font:** Comic Neue Angular, Bold. Pick it in the `FontFace` property if your Studio's font list has it.
  If not, Fredoka One is the closest built-in font.
- **Outline:** `UIStroke`, colour `11, 15, 29`, `LineJoinMode = Round`, `Thickness = TextSize × 0.09`
  (a 40 px label gets 3.5).
- **Drop shadow:** a copy of the label behind it, coloured `11, 15, 29`, moved down by `TextSize × 0.055`.
- **Fill:** white text with a `UIGradient` (`Rotation = 90`). The colours for each text are in `layout.json`
  (`texts[].fill`, top to bottom). The common ones:

| Style | Gradient (top → bottom) | Used for |
|---|---|---|
| White | `#FFFFFF` → `#FFFFFF` → `#E4EADF` | Most labels |
| Gold | `#FFF3A0` → `#FFD54A` → `#F59A14` | Shillings amounts, timers, prices |
| Green | `#E2FF6A` → `#97F02A` → `#45C214` | Robux prices, "Ready", good values |
| Red | `#FFB3A6` → `#FF6A4F` → `#D9372A` | Warnings, too expensive |
| Cream | `#FFF8E6` → `#F6E7C2` → `#E2C98F` | Section labels, descriptions |
| Muted | `#D9D5C8` → `#B8B2A2` | Hints, locked text |
| Purple | `#F1D0FF` → `#C78AF0` → `#8F4FD0` | Rebirth counter |

`texts[]` in `layout.json` also gives each label's position and size inside its component, and its font size in
design pixels.

## 9-slice kit

| File | Settings |
|---|---|
| `Kit/Skin_<Colour>.png` (buttons, cards, headers, tabs) | `ScaleType = Slice`, `SliceCenter = Rect(44, 44, 324, 164)`, `SliceScale = 0.5` |
| `Kit/Skin_Rarity_<Rarity>.png` (rarity cards) | same as above |
| `Kit/Panel_Body.png` (dark panel with ink border) | `ScaleType = Slice`, `SliceCenter = Rect(52, 52, 396, 396)`, `SliceScale = 0.5` |
| `Kit/Studs_Tile.png` (panel stud pattern, 192 px, no padding) | `ScaleType = Tile`, `TileSize = UDim2.fromOffset(96, 96)` |
| `Kit/Bar_Track.png`, `Kit/Bar_Fill_Green.png`, `Kit/Bar_Fill_Gold.png` | `ScaleType = Slice`, `SliceCenter = Rect(48, 44, 400, 84)`, `SliceScale = 0.5`. Put the fill inside the track and tween its `Size.X` for progress |

The faceted shine stretches a little on very wide or tall buttons. For the big pieces (panel headers, the Hatch card)
use the exported component instead.

## Suggested animations

| Element | Animation |
|---|---|
| Buttons | On press, tween a `UIScale` 1 → 0.92 → 1 (Back easing, 0.15 s) |
| Alert badges (`!`, Holding count) | Gentle scale pulse 1 → 1.12, looping |
| Quantity labels (`x3`, `12/30`, `1 left`) | Rotate back and forth ±9°, 1.2 s, Sine, looping |
| Incubator "Ready" egg | Rotate ±12°, fast, with pauses; the egg cracks as a 3D model in the incubator itself |
| Hatch Reveal card | `UIScale` 0.6 → 1.05 → 1 (Back easing). Rays in the window rotate slowly. Legendary and Mythic also show the full-screen `Burst_<Rarity>` behind the card |
| New Species sticker | Drops in after the card, small bounce |
| Toasts | Slide down from the top, stay 3 s, slide back up |
| Wilds banners | Drop in, stay 4 s. The Wilds indicator stays while PvP is on and pulses slowly |
| Egg banked | Tween the `Notifications/Egg_Flying` image from the egg's screen position to the Eggs button, then pop `Egg_Plus1` |
| Keeper restock timer | Update the TextLabel every second; tween the small bar |

## Screens and where they open

| Opens from | Screen |
|---|---|
| Top: Shop | Keeper's Shop |
| Top: My Terrarium | My Terrarium (right side). Tabs: Creatures, Holding, Decor (opens Edit Tank), Stats |
| Top: Upgrades | Upgrades |
| Left: Daily Rewards / Store / Field Guide / Rebirth | Those panels |
| Right: Eggs | Egg Inventory |
| Edit Tank → Backdrops tab | Backdrops (equip owned ones; locked ones say where to get them) |
| Gear (top left) | Settings with Codes |
| Walking up to an incubator | Incubator pop-up (BillboardGui over the incubator) |
