# Vines and the Edit Tank panel: how to use them in Roblox

## Vine variations

There are five vine sets (V1–V5). Each panel vine is exported as **two images**:

- `Vines/V<n>/Panel_<id>_Back.png` goes **behind** the panel (lower ZIndex).
- `Vines/V<n>/Panel_<id>_Front.png` goes **in front of** the panel (higher ZIndex). It holds only
  the short stretches where the vine crosses over the panel's edge.

Together they make the vine look like it's wrapped around the panel. Both ends of every vine are hidden
under the panel, so nothing hangs in mid-air.

Pick a set when a panel opens:

```lua
local VINE_SETS = 5
local function applyVines(panel: Frame)
	local v = math.random(1, VINE_SETS)
	for _, img in panel.Vines:GetChildren() do       -- ImageLabels named e.g. "V3_Back", "V3_Front"
		img.Visible = img.Name:sub(1, 2) == "V" .. v
	end
end
```

Previews of all five: `Vines/_Preview_DailyRewards_V1..5.png` and `Vines/_Preview_EditTerrarium_V1..5.png`.

## Edit Tank (right-side build panel)

Opened from **My Terrarium → Edit**. Layout, top to bottom:

1. **Tabs**: Layers / Plants / Decor.
2. **Your Tank**: a live cross-section of the layers already placed, bottom-up, with a dashed
   "Drop the next layer here" slot on top. It updates as layers are added.
3. **Scrolling grid**: one card per item.
   - Quantity label (top-right, tilts ±9°).
   - "IN TANK" tag once placed.
   - Six-dot grip in the corner to show it can be dragged.
4. **Tools**: Rotate, Move, Remove, **Done**.

Drag flow: press a card and it lifts into a tilted "ghost" card that follows the finger or mouse. The slot
it left shows a dashed outline. A dashed ring with "Release to add to your tank" marks the drop zone in
the world. On release, the layer is added and appears in the Your Tank stack.

Exports: `EditTerrarium/` (panel, header, tabs, stack, item cards in both states, tool buttons,
Done, drag ghost, drop target).
