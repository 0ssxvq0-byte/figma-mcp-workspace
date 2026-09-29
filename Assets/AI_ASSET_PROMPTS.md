# Build a Terrarium: AI asset brief

Use this to generate the icons and graphics for the UI with ChatGPT (or another image generator).
Generate **one sheet per message** (Sheets 1–6 below). Image models get sloppy past ~8–10 items per image,
so splitting keeps quality and consistency high. Paste the **Style block** at the top of every sheet prompt.

When you have the images, upload them here and I'll crop each icon, clean the edges, remove any leftover
background, and wire them into the UI.

---

## Before you generate: 3 things I need from you

1. **Robux icon:** don't use an AI-generated one, because image models almost always get the logo slightly wrong.
   Roblox Studio ships the official one. In an ImageLabel, set `Image` to
   `rbxasset://textures/ui/common/robux.png` (there are also `robux@2x.png` / `robux@3x.png`).
   Alternatively, screenshot it from roblox.com at a large size and send it to me, and I'll clean and recolour it.
2. **Your real product list:** which game passes, cash packs and bundles actually exist (names + prices).
   The Shop currently shows only things already in the HUD: *Starter Pack, X2 Money, X2 Luck, 4 cash packs*.
   Sheet 3 matches that list. Edit it before generating if your list differs.
3. **Your real events list:** names + how long each lasts. Sheet 4 has *Toxic Rain* and *Night Time* from your
   mock-up, plus empty slots.

---

## Style block (paste at the top of every sheet)

```
Game UI icon sprite sheet for a Roblox game called "Build a Terrarium" — a vibrant, blocky forest/terrarium
world. Style: modern, polished Roblox simulator icons. Chunky, slightly rounded 3D shapes in a 3/4 view,
bright saturated colours, soft cel shading with a clean highlight from the top-left and a darker core shadow
at the bottom-right, a small crisp white specular glint on each icon. Every icon has a thick, uniform, very
dark navy outline (#0B0F1D), about 4% of the icon's width, with slightly rounded corners — not bubbly.
Subtle forest touches where natural (a small leaf, sprout or dew drop), never clutter.
No text, no letters, no numbers, no watermarks, no labels, no frames, no drop shadows on the ground.

Layout: a clean grid on a fully TRANSPARENT background (if transparency isn't possible, use one flat solid
#FF00FF magenta background with no gradient and no shadows). Each icon is centred in its own equal cell, the
same visual size as its neighbours, with generous empty space (at least 15% of the cell) on every side so no
two icons touch. Consistent lighting, outline weight, and colour saturation across every icon on the sheet.
Output at the highest resolution available (2048×2048 or larger).
```

---

## Sheet 1: Currency (2 × 3 grid, 6 icons)

```
[STYLE BLOCK]

Sheet contents, left to right, top to bottom:
1. Cash: a single crisp green banknote, slightly bent, with a small leaf emblem in the centre instead of a portrait.
2. Cash stack: a neat stack of 4–5 green banknotes bound with a gold paper band.
3. Cash pile: a larger messy pile of green banknote stacks, a couple of bills fanned on top.
4. Cash bag: a plump burlap money sack tied with a green vine, banknotes peeking out of the top.
5. Cash chest: a small wooden treasure chest with gold trim, lid open, overflowing with green banknotes and a few leaves.
6. Bioactivity: a glowing green seedling sprouting from a small round soil clump, with two tiny floating sparkles — represents plant life energy.
```

Used for: the money counter, the Cash Packs tiers in the Shop ($10K / $50K / $250K / $1M), and the Bioactivity bar.

---

## Sheet 2: HUD menu icons (3 × 3 grid, 9 icons)

```
[STYLE BLOCK]

Sheet contents, left to right, top to bottom:
1. Shop: a red shopping basket with a metal handle, slightly tilted.
2. Pass: a golden VIP ticket with scalloped edges and a small green leaf stamp, tilted about 15 degrees.
3. Index: a thick field-journal book, green leather cover with a pressed leaf on the front and a red bookmark ribbon.
4. Daily Rewards: a desk calendar with a red top binding and two metal rings; the page is blank (no number).
5. Starter Pack: a purple gift box with a big glossy gold ribbon bow and a tiny green sprout poking from the lid.
6. My Base: a small glass terrarium jar with a cork lid, containing a tiny mossy hill, a sapling and a pebble.
7. Upgrades: a chunky green upward arrow with a small leaf growing from its base.
8. Friend Boost: two cheerful blocky Roblox-style character heads side by side, one blue, one orange.
9. Lock: a golden padlock (for locked items).
```

Note: I'll add the "31" to the calendar myself so the number is sharp. The Rebirth icon is deliberately
not on this list because you want to keep the current one.

---

## Sheet 3: Shop products (2 × 3 grid, 6 icons, larger and more detailed)

```
[STYLE BLOCK]
These are premium store product icons, so give them extra detail and a subtle magical glow rim.

Sheet contents, left to right, top to bottom:
1. X2 Money pass: a glossy gold medallion badge with a green banknote wrapped around it, small sparkles.
2. X2 Luck pass: a glossy emerald medallion badge with a bright four-leaf clover on its face, small sparkles.
3. Starter Pack bundle: a purple gift box with a gold bow, a green banknote and a small four-leaf clover tucked beside it.
4. Premium crate: a sturdy green-and-gold supply crate with leaf decals, lid slightly lifted with light spilling out.
5. Glowing sapling in a pot: a potted sapling with luminous green leaves (for a future plant-related pass).
6. Golden watering can: a shiny gold watering can with a dripping water drop (for a future growth-speed pass).
```

Items 5–6 are optional placeholders. Swap them for your real passes before generating (see "Before you generate" #2).

---

## Sheet 4: Events (2 × 3 grid, 6 icons)

```
[STYLE BLOCK]
Event icons should read clearly at small sizes: bold silhouettes, strong colour identity.

Sheet contents, left to right, top to bottom:
1. Toxic Rain: a small dark-green storm cloud raining bright lime-green acid droplets, with a couple of bubbles.
2. Night Time: a pale yellow crescent moon partly behind a soft dark-blue cloud, with two tiny stars.
3. [EVENT NAME]: [short visual description]
4. [EVENT NAME]: [short visual description]
5. [EVENT NAME]: [short visual description]
6. Timer: a small round stopwatch in white and green (used next to event durations).
```

---

## Sheet 5: Daily reward crates (2 × 2 grid, 4 icons)

```
[STYLE BLOCK]

Sheet contents, left to right, top to bottom:
1. Common reward crate: a small orange cardboard box with tape and a leaf sticker.
2. Rare reward crate: a blue wooden crate with silver corner brackets.
3. Epic reward crate: a purple crate with gold corner brackets and faint glowing seams.
4. Legendary Day 7 crate: a large ornate golden crate with emerald gems, a vine wrapping it, bright light bursting from the seams.
```

---

## Sheet 6: Forest decoration pieces (2 × 3 grid, 6 pieces)

This replaces the wood and moss. They're small accents that clip onto panel corners and tab ends.

```
[STYLE BLOCK]
These are decorative UI trim pieces, not icons: flatter, cleaner, designed to sit on the corner or edge of a
colourful rectangular panel. Bright leaf greens with the same dark navy outline.

Sheet contents, left to right, top to bottom:
1. Corner leaf cluster: 3–4 glossy broad leaves fanning out from a single point, for a top-left panel corner.
2. The same cluster mirrored, for a top-right corner.
3. Hanging vine: a single slim vine with 5–6 small leaves, hanging straight down, about 4× taller than wide.
4. Horizontal vine runner: a slim vine lying along a horizontal edge with small leaves alternating up and down, about 5× wider than tall.
5. Fern sprig: a single curled young fern frond.
6. Small leaf pair with a dew drop: two small leaves and one glossy water drop.
```

---

## Optional Sheet 7: Index creatures

The Index currently uses Microsoft's Fluent Emoji (MIT licensed). If you want them to match the rest of the new
art exactly, send me your final critter list and I'll write this sheet too. It's not needed yet.

---

## After generating

- Save each sheet as PNG at full resolution (don't screenshot it, because that loses quality).
- Upload them here. I'll slice them into individual transparent PNGs named for their slot
  (e.g. `Icons/Currency/CashStack.png`), clean up the edges, and re-render every screen with them.
- If one icon on a sheet comes out wrong, just regenerate that single item with the same style block.
  It doesn't need to be on a sheet.
