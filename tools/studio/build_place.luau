--[[
	Builds BuildATerrarium_UI.rbxlx: a Roblox place with the whole UI already assembled in StarterGui,
	the scripts that animate it, and a small test world. Run with Lune (https://lune-org.github.io):

	  lune run tools/studio/build_place.luau StudioExport/manifest.json RbxmExport/build/sheets.json tools/studio RbxmExport

	Images come from sprite sheets (tools/studio/pack_sheets.py). Each ImageLabel stores its sheet name in the
	"Sheet" attribute and its crop in ImageRectOffset/ImageRectSize; the sheet IDs are pasted into UI_Core.SheetIds.
]]
local roblox = require("@lune/roblox")
local fs = require("@lune/fs")
local serde = require("@lune/serde")
local process = require("@lune/process")

local Instance, UDim2, UDim, Vector2, Vector3, Color3 = roblox.Instance, roblox.UDim2, roblox.UDim, roblox.Vector2, roblox.Vector3, roblox.Color3
local Rect, ColorSequence, ColorSequenceKeypoint, Font, Enum, CFrame = roblox.Rect, roblox.ColorSequence, roblox.ColorSequenceKeypoint, roblox.Font, roblox.Enum, roblox.CFrame

local manifestPath, sheetsPath, studioDir, outDir = process.args[1], process.args[2], process.args[3], process.args[4]
local Layout = serde.decode("json", fs.readFile(manifestPath))
local Sheets = serde.decode("json", fs.readFile(sheetsPath))
local W, H = Layout.canvas[1], Layout.canvas[2]

local FONT = Font.new("rbxasset://fonts/families/ComicNeueAngular.json", Enum.FontWeight.Bold)
local INK = Color3.fromRGB(11, 15, 29)
local PANEL_BG = Color3.fromRGB(17, 33, 22)
local RARITY = {
	Common = Color3.fromRGB(226, 222, 209), Uncommon = Color3.fromRGB(139, 190, 122), Rare = Color3.fromRGB(96, 157, 214),
	Epic = Color3.fromRGB(163, 110, 214), Legendary = Color3.fromRGB(226, 168, 62), Mythic = Color3.fromRGB(224, 84, 84),
}

-- how each screen behaves
local SCREEN = {
	MainHUD = { order = 1, enabled = true },
	Notifications = { order = 30, enabled = true, templates = true },
	Incubator = { order = 2, enabled = false, templates = true },
	HatchReveal = { order = 20 }, Release = { order = 25 }, WelcomeBack = { order = 25 },
}
-- stable names for labels scripts update
local function namedText(screen, text)
	local fixed = {
		["MainHUD|572,831"] = "ShillingsAmount", ["MainHUD|57 / 100"] = "BioactivityValue", ["MainHUD|Bioactivity"] = "BioactivityLabel",
		["MainHUD|4"] = "RebirthCount", ["MainHUD|12/30"] = "EggsCount", ["MainHUD|3m 51s"] = "RestockTimer", ["MainHUD|1.07x"] = "IncomeMultiplier",
		["KeepersShop|3m 51s"] = "RestockTimer", ["HatchReveal|Stag Beetle"] = "CreatureName", ["HatchReveal|Rare Hatch!"] = "HatchTitle",
		["HatchReveal|RARE"] = "RarityLabel", ["HatchReveal|HUNTER"] = "JobLabel", ["HatchReveal|Eats excess insects"] = "JobDescription",
		["HatchReveal|Field Guide #21"] = "EntryNumber", ["WelcomeBack|12.4K"] = "AwayEarnings",
	}
	local n = fixed[screen .. "|" .. text]
	if n then return n end
	if screen == "HatchReveal" and text:sub(1, 9) == "Male stag" then return "FieldNote" end
	return nil
end

local function area(n) return n.w * n.h end
local function key(file) return (file:gsub("^Assets/", ""):gsub("%.png$", "")) end

-- which image to draw for an asset (bursts share one tinted image)
local function imageFor(a)
	local k = key(a.file)
	if a.name:find("^Burst_") then
		return Sheets.images["13_HatchReveal/Bursts/Burst_Common"], "13_HatchReveal/Bursts/Burst_Common", RARITY[a.name:sub(7)]
	end
	return Sheets.images[k], k, nil
end

local function collect(screenKey)
	local nodes = {}
	for order, a in ipairs(Layout.assets) do
		for _, inst in ipairs(a.instances) do
			if inst.screen == screenKey then
				table.insert(nodes, { kind = a.name == "Backdrop_Dim" and "dim" or "image", asset = a, x = inst.x, y = inst.y, w = inst.w, h = inst.h, alt = inst.alt, order = order })
			end
		end
	end
	for i, t in ipairs(Layout.texts) do
		if t.screen == screenKey then table.insert(nodes, { kind = "text", text = t, x = t.x, y = t.y, w = t.w, h = t.h, order = 100000 + i }) end
	end
	for i, s in ipairs(Layout.slots) do
		if s.screen == screenKey then table.insert(nodes, { kind = "slot", slot = s, x = s.x, y = s.y, w = s.w, h = s.h, order = 50000 + i }) end
	end
	for i, f in ipairs(Layout.frames) do
		if f.screen == screenKey then table.insert(nodes, { kind = "frame", frame = f, x = f.x, y = f.y, w = f.w, h = f.h, order = i }) end
	end
	return nodes
end

local function canHold(n)
	if n.kind == "frame" then return true end
	if n.kind ~= "image" or n.alt then return false end
	local a = n.asset
	return not (a.spin or a.vineSet or a.name:find("Glow") or a.name:find("Rays") or a.name:find("^Icon_") or a.name:find("Sparkle")
		or a.name:find("^Sticker") or a.name:find("^Stamp") or a.name:find("Fill") or a.name:find("^Burst_"))
end
local function contains(p, c, centreOnly)
	local cx, cy = c.x + c.w / 2, c.y + c.h / 2
	if cx < p.x or cx > p.x + p.w or cy < p.y or cy > p.y + p.h then return false end
	if centreOnly then return true end
	local ix = math.max(0, math.min(c.x + c.w, p.x + p.w) - math.max(c.x, p.x))
	local iy = math.max(0, math.min(c.y + c.h, p.y + p.h) - math.max(c.y, p.y))
	return ix * iy >= 0.85 * area(c)
end

-- the drawn rectangle: transparent edges that were trimmed off the sprite are removed from the node's rect
local function drawRect(n)
	if n.kind ~= "image" then return n end
	local e = imageFor(n.asset)
	if not e or not e.trim then return n end
	local kx, ky = n.w / n.asset.size[1], n.h / n.asset.size[2]
	local l, t, r, b = e.trim[1] * kx, e.trim[2] * ky, e.trim[3] * kx, e.trim[4] * ky
	return { x = n.x + l, y = n.y + t, w = math.max(1, n.w - l - r), h = math.max(1, n.h - t - b) }
end

local function place(gui, r, parent, leftAnchor)
	if parent then
		local ax = leftAnchor and 0 or 0.5
		gui.AnchorPoint = Vector2.new(ax, 0.5)
		gui.Position = UDim2.fromScale((r.x + ax * r.w - parent.x) / parent.w, (r.y + r.h / 2 - parent.y) / parent.h)
		gui.Size = UDim2.fromScale(r.w / parent.w, r.h / parent.h)
		return gui
	end
	local cx, cy = r.x + r.w / 2, r.y + r.h / 2
	local ax = cx < W / 3 and 0 or (cx > 2 * W / 3 and 1 or 0.5)
	local ay = cy < H / 3 and 0 or (cy > 2 * H / 3 and 1 or 0.5)
	local holder = Instance.new("Frame")
	holder.Name = gui.Name .. "_Holder"
	holder.BackgroundTransparency = 1
	holder.AnchorPoint = Vector2.new(ax, ay)
	holder.Position = UDim2.fromScale((r.x + ax * r.w) / W, (r.y + ay * r.h) / H)
	holder.Size = UDim2.fromScale(r.w / W, r.h / H)
	local c = Instance.new("UIAspectRatioConstraint")
	c.AspectRatio = r.w / r.h
	c.Parent = holder
	gui.AnchorPoint = Vector2.new(leftAnchor and 0 or 0.5, 0.5)
	gui.Position = UDim2.fromScale(leftAnchor and 0 or 0.5, 0.5)
	gui.Size = UDim2.fromScale(1, 1)
	gui.Parent = holder
	return holder
end

local missing = {}
local function makeImage(n)
	local a = n.asset
	local gui = Instance.new(a.button and "ImageButton" or "ImageLabel")
	gui.Name = a.name
	gui.BackgroundTransparency = 1
	local e, k, tint = imageFor(a)
	if e then
		gui:SetAttribute("Sheet", e.sheet)
		gui:SetAttribute("ImageKey", k)
		if e.tile then
			gui.ScaleType = Enum.ScaleType.Tile
			gui.TileSize = UDim2.fromOffset(e.tile, e.tile)
		else
			gui.ImageRectOffset = Vector2.new(e.x, e.y)
			gui.ImageRectSize = Vector2.new(e.w, e.h)
			if e.slice then
				gui.ScaleType = Enum.ScaleType.Slice
				gui.SliceCenter = Rect.new(e.slice[1], e.slice[2], e.slice[3], e.slice[4])
				gui.SliceScale = e.sliceScale or 1
			end
		end
	else
		missing[k] = true
	end
	if tint then gui.ImageColor3 = tint end
	if a.button then gui.AutoButtonColor = false end
	if a.spin then gui:SetAttribute("Spin", true) end
	if a.fill then gui:SetAttribute("FillFraction", a.fill) end
	if a.vineSet then
		gui:SetAttribute("VineSet", a.vineSet)
		gui.Visible = a.vineSet == 1
	end
	if n.alt then gui.Visible = false; gui:SetAttribute("AlternateState", true) end
	if a.name:find("^Badge_") then gui:SetAttribute("Bounce", true) end
	if a.name == "Eggs_Counter_Tag" then gui:SetAttribute("Tilt", true) end
	gui.ZIndex = a.vineSet and (a.front and 40 or 1) or (a.button and 6 or 5)
	if a.name:find("^Burst_") then gui.ZIndex = 1 end
	return gui
end

local function makeText(n, screenKey)
	local t = n.text
	local gui = Instance.new("TextLabel")
	gui.Name = namedText(screenKey, t.text) or ("Text_" .. t.text:gsub("[^%w]+", "_"):sub(1, 28))
	gui.BackgroundTransparency = 1
	gui.Text = t.text
	gui.FontFace = FONT
	gui.TextScaled = true
	gui.TextColor3 = Color3.new(1, 1, 1)
	gui.ZIndex = 8
	local stroke = Instance.new("UIStroke")
	stroke.Color = INK
	stroke.LineJoinMode = Enum.LineJoinMode.Round
	stroke.Thickness = math.max(1, t.size * 0.09)
	stroke:SetAttribute("BaseThickness", stroke.Thickness)
	stroke.Parent = gui
	if t.fill and #t.fill >= 2 then
		local keys = {}
		for i, hex in ipairs(t.fill) do
			table.insert(keys, ColorSequenceKeypoint.new((i - 1) / (#t.fill - 1), Color3.fromHex(hex)))
		end
		local g = Instance.new("UIGradient")
		g.Color = ColorSequence.new(keys)
		g.Rotation = 90
		g.Parent = gui
	end
	return gui
end

local function makeSlot(n)
	local f = Instance.new("Frame")
	f.Name = n.slot.kind .. "Slot"
	f.BackgroundTransparency = 1
	f.ZIndex = 7
	f:SetAttribute("Hint", n.slot.hint)
	return f
end

local function makeFrame(n)
	local f = Instance.new("Frame")
	f.Name = "Panel"
	f.BackgroundColor3 = PANEL_BG
	f.BackgroundTransparency = 0.07
	f.ZIndex = 2
	local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 10); corner.Parent = f
	local stroke = Instance.new("UIStroke")
	stroke.Color = INK; stroke.Thickness = 5; stroke:SetAttribute("BaseThickness", 5)
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = f
	local studs = Instance.new("ImageLabel")
	studs.Name = "Studs"
	studs.BackgroundTransparency = 1
	studs:SetAttribute("Sheet", "Sheet_Studs")
	studs:SetAttribute("ImageKey", "00_Shared/Panel_Studs_Tile")
	studs.ScaleType = Enum.ScaleType.Tile
	studs.TileSize = UDim2.fromOffset(96, 96)
	studs.Size = UDim2.fromScale(1, 1)
	studs.ZIndex = 1
	local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, 10); c.Parent = studs
	studs.Parent = f
	return f
end

local function makeDim()
	local f = Instance.new("Frame")
	f.Name = "Backdrop_Dim"
	f.BackgroundColor3 = Color3.fromRGB(6, 12, 10)
	f.BackgroundTransparency = 0.25
	f.ZIndex = 0
	local g = Instance.new("UIGradient")   -- lighter in the middle, like the mockup's vignette
	g.Transparency = roblox.NumberSequence.new({ roblox.NumberSequenceKeypoint.new(0, 0), roblox.NumberSequenceKeypoint.new(0.5, 0.45), roblox.NumberSequenceKeypoint.new(1, 0) })
	g.Parent = f
	return f
end

local function buildScreen(screenKey)
	local conf = SCREEN[screenKey] or { order = 10 }
	local sg = Instance.new("ScreenGui")
	sg.Name = "UI_" .. screenKey
	sg.ResetOnSpawn = false
	sg.IgnoreGuiInset = true
	sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	sg.DisplayOrder = conf.order
	sg.Enabled = conf.enabled or false
	sg:SetAttribute("Templates", conf.templates or false)
	local root = Instance.new("Frame")
	root.Name = "Root"
	root.BackgroundTransparency = 1
	root.Size = UDim2.fromScale(1, 1)
	root.Parent = sg

	local nodes = collect(screenKey)
	table.sort(nodes, function(a, b)
		if area(a) ~= area(b) then return area(a) > area(b) end
		return a.order < b.order
	end)
	local groups = {}
	local function create(n, best)
		local gui
		if n.kind == "image" then gui = makeImage(n)
		elseif n.kind == "text" then gui = makeText(n, screenKey)
		elseif n.kind == "slot" then gui = makeSlot(n)
		elseif n.kind == "dim" then gui = makeDim()
		else gui = makeFrame(n) end
		if n.kind == "dim" then
			gui.Size = UDim2.fromScale(1, 1)
			gui.Parent = root
			n.gui = gui
			return
		end
		local leftAnchor = n.kind == "image" and n.asset.leftFill == true
		if n.kind == "frame" and not best and screenKey ~= "MainHUD" then
			-- a transparent group the size of the panel; the panel and everything around its edges live in it
			local group = Instance.new("Frame")
			group.Name = "PanelGroup"
			group.BackgroundTransparency = 1
			local holder = place(group, n, nil, false)
			holder.Name = "PanelGroup_Holder"
			holder.Parent = root
			local g = { x = n.x, y = n.y, w = n.w, h = n.h, gui = group }
			table.insert(groups, g)
			place(gui, n, g, false).Parent = group
			gui.ZIndex = 2
			n.gui = gui
			return
		end
		if not best and n.kind ~= "frame" then
			-- pieces overhanging a panel (header icons, stickers, back vines) move with that panel
			local r = drawRect(n)
			local cx, cy = r.x + r.w / 2, r.y + r.h / 2
			for _, g in ipairs(groups) do
				if cx > g.x - 140 and cx < g.x + g.w + 140 and cy > g.y - 140 and cy < g.y + g.h + 140 then best = g; break end
			end
		end
		local top = place(gui, drawRect(n), best, leftAnchor)
		top.Parent = best and best.gui or root
		n.gui = gui
	end
	local isRays = function(n) return n.kind == "image" and n.asset.spin and not n.asset.name:find("^Burst_") end
	local deferred = {}
	for i, n in ipairs(nodes) do
		if isRays(n) then
			table.insert(deferred, n)
		else
			local best
			for j = 1, i - 1 do
				local p = nodes[j]
				local centreOnly = n.kind == "text" or (n.asset ~= nil and (n.asset.vineSet ~= nil or n.asset.name:find("^Badge_") ~= nil
					or n.asset.name == "Eggs_Counter_Tag"))
				if p.gui and canHold(p) and area(p) > area(n) * 1.01 and contains(p, n, centreOnly) then
					if not best or area(p) < area(best) then best = p end
				end
			end
			if n.kind == "image" and n.asset.vineSet and not n.asset.front then best = nil end
			create(n, best)
		end
	end
	for _, n in ipairs(deferred) do
		local best
		for _, p in ipairs(nodes) do
			if p ~= n and p.gui and canHold(p) and p.kind == "image" and contains(p, n, true) then
				if not best or area(p) < area(best) then best = p end
			end
		end
		create(n, best)
		if best then
			local clip = best.gui:FindFirstChild("RaysClip")
			if not clip then
				clip = Instance.new("CanvasGroup")
				clip.Name = "RaysClip"
				clip.BackgroundTransparency = 1
				clip.AnchorPoint = Vector2.new(0.5, 0.5)
				clip.Position = UDim2.fromScale(0.5, 0.5)
				clip.Size = UDim2.fromScale(1, 1)
				clip.ZIndex = 4
				local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 8); corner.Parent = clip
				clip.Parent = best.gui
			end
			n.gui.Parent = clip
		end
	end
	if screenKey == "Notifications" or screenKey == "Incubator" then   -- templates: cloned by scripts when needed
		for _, c in ipairs(root:GetChildren()) do
			if c:IsA("GuiObject") then c.Visible = false end
		end
	end
	print(("  %s: %d pieces"):format(sg.Name, #nodes))
	return sg
end

-- ------------------------------------------------------------------------------------------ scripts
local function readLua(path) return fs.readFile(path) end
local function module(name, source, parent)
	local m = Instance.new("ModuleScript")
	m.Name = name
	m.Source = source
	m.Parent = parent
	return m
end

local function luaValue(v)
	if type(v) == "number" then return tostring(v) end
	return string.format("%q", tostring(v))
end
local function imageMapSource()
	local keys = {}
	for k in pairs(Sheets.images) do table.insert(keys, k) end
	table.sort(keys)
	local lines = { "-- Where each exported image sits on the sprite sheets (generated; do not edit)", "return {", "\tsheets = {" }
	for _, s in ipairs(Sheets.sheets) do table.insert(lines, "\t\t" .. luaValue(s) .. ",") end
	table.insert(lines, "\t},")
	table.insert(lines, "\tscreens = {")
	for _, s in ipairs(Layout.screens) do table.insert(lines, "\t\t" .. luaValue(s.key) .. ",") end
	table.insert(lines, "\t},")
	table.insert(lines, "\timages = {")
	for _, k in ipairs(keys) do
		local e = Sheets.images[k]
		table.insert(lines, string.format("\t\t[%q] = { sheet = %q, x = %d, y = %d, w = %d, h = %d },", k, e.sheet, e.x, e.y, e.w, e.h))
	end
	table.insert(lines, "\t},")
	table.insert(lines, "}")
	return table.concat(lines, "\n") .. "\n"
end

local function buildCore()
	local core = Instance.new("ScreenGui")
	core.Name = "UI_Core"
	core.ResetOnSpawn = false
	core.Enabled = true
	local ids = Instance.new("Configuration")
	ids.Name = "SheetIds"
	for _, s in ipairs(Sheets.sheets) do
		local v = Instance.new("StringValue")
		v.Name = s
		v.Value = ""
		v.Parent = ids
	end
	ids.Parent = core
	local rt = Instance.new("Folder")
	rt.Name = "Runtime"
	for _, entry in ipairs(fs.readDir(studioDir .. "/Runtime")) do
		if entry:sub(-4) == ".lua" then module(entry:sub(1, -5), readLua(studioDir .. "/Runtime/" .. entry), rt) end
	end
	module("ImageMap", imageMapSource(), rt)
	rt.Parent = core
	for _, entry in ipairs({ "UIController", "UIDemo", "WorldDemo" }) do
		local ls = Instance.new("LocalScript")
		ls.Name = entry
		ls.Source = readLua(studioDir .. "/Client/" .. entry .. ".client.lua")
		ls.Parent = core
	end
	local readme = Instance.new("Script")
	readme.Name = "README_FIRST"
	readme.Enabled = false
	readme.Source = readLua(studioDir .. "/Client/READ_ME.lua")
	readme.Parent = core
	return core
end

-- ------------------------------------------------------------------------------------------ test world
local function part(name, size, pos, color, parent, props)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = CFrame.new(pos)
	p.Color = color
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props or {}) do p[k] = v end
	p.Parent = parent
	return p
end
local function prompt(parent, action, object, panel)
	local pp = Instance.new("ProximityPrompt")
	pp.ActionText = action
	pp.ObjectText = object
	pp.HoldDuration = 0
	pp.MaxActivationDistance = 12
	if panel then pp:SetAttribute("OpensPanel", panel) end
	pp.Parent = parent
	return pp
end
local function sign(parent, text)
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromScale(8, 1.6)
	bb.StudsOffset = Vector3.new(0, 4, 0)
	bb.AlwaysOnTop = true
	local l = Instance.new("TextLabel")
	l.Size = UDim2.fromScale(1, 1)
	l.BackgroundTransparency = 1
	l.Text = text
	l.FontFace = FONT
	l.TextScaled = true
	l.TextColor3 = Color3.new(1, 1, 1)
	local s = Instance.new("UIStroke"); s.Thickness = 3; s.Color = INK; s.Parent = l
	l.Parent = bb
	bb.Parent = parent
end

local function buildWorld(game)
	local ws = game:GetService("Workspace")
	part("Baseplate", Vector3.new(400, 4, 400), Vector3.new(0, -2, 0), Color3.fromRGB(92, 164, 70), ws, { Material = Enum.Material.Grass })
	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.CFrame = CFrame.new(0, 0.5, 0)
	spawn.Color = Color3.fromRGB(120, 200, 90)
	spawn.Parent = ws

	-- the player's terrarium: the prompt opens Edit Tank (slides in from the right, HUD fades)
	local terr = Instance.new("Model"); terr.Name = "DemoTerrarium"; terr.Parent = ws
	local base = part("Base", Vector3.new(14, 2, 10), Vector3.new(0, 1, -30), Color3.fromRGB(42, 46, 54), terr)
	part("Glass", Vector3.new(14, 12, 10), Vector3.new(0, 8, -30), Color3.fromRGB(160, 210, 245), terr, { Transparency = 0.7, Material = Enum.Material.Glass })
	part("Soil", Vector3.new(13, 2, 9), Vector3.new(0, 3, -30), Color3.fromRGB(90, 62, 40), terr, { Material = Enum.Material.Ground })
	terr.PrimaryPart = base
	prompt(base, "Edit Tank", "Your Terrarium", "EditTank_Layers")
	local info = part("InfoPost", Vector3.new(1, 5, 1), Vector3.new(10, 2.5, -24), Color3.fromRGB(106, 69, 38), terr)
	prompt(info, "Open", "My Terrarium", "MyTerrarium_Creatures")
	sign(base, "Your Terrarium")
	part("TerrariumSpawn", Vector3.new(4, 1, 4), Vector3.new(0, 0.5, -20), Color3.fromRGB(120, 200, 90), ws, { Transparency = 1, CanCollide = false })

	-- NPC stands: the HUD Shop / Upgrades tabs teleport here; their prompts open the panels
	local npcs = Instance.new("Folder"); npcs.Name = "NPCs"; npcs.Parent = ws
	local keeper = part("KeeperStand", Vector3.new(6, 1, 6), Vector3.new(-40, 0.5, 10), Color3.fromRGB(232, 64, 90), npcs)
	local kp = part("Keeper", Vector3.new(2, 5, 2), Vector3.new(-40, 3.5, 6), Color3.fromRGB(242, 199, 154), npcs)
	prompt(kp, "Talk", "The Keeper", "KeepersShop"); sign(kp, "The Keeper")
	local upg = part("UpgradesStand", Vector3.new(6, 1, 6), Vector3.new(40, 0.5, 10), Color3.fromRGB(106, 218, 18), npcs)
	local un = part("Upgrader", Vector3.new(2, 5, 2), Vector3.new(40, 3.5, 6), Color3.fromRGB(242, 199, 154), npcs)
	prompt(un, "Talk", "Upgrades", "Upgrades"); sign(un, "Upgrades")
	local _ = keeper; local _ = upg

	-- incubators with floating pop-ups, and an egg you can hover and hatch
	local inc = Instance.new("Folder"); inc.Name = "DemoIncubators"; inc.Parent = ws
	for i, state in ipairs({ "Incubating", "Ready", "Locked" }) do
		local p = part("Incubator_" .. state, Vector3.new(4, 3, 4), Vector3.new(-12 + i * 8, 1.5, 20), Color3.fromRGB(70, 80, 90), inc)
		p:SetAttribute("PopupState", state)
	end
	local egg = part("DemoEgg", Vector3.new(2.4, 3, 2.4), Vector3.new(4, 4.5, 20), Color3.fromRGB(140, 135, 120), ws, { Shape = Enum.PartType.Ball, Material = Enum.Material.Slate })
	prompt(egg, "Hatch", "Moss Egg", nil).Name = "HatchPrompt"

	-- a few UI toggles for the in-world signs
	local lighting = game:GetService("Lighting")
	lighting.ClockTime = 14
end

-- ------------------------------------------------------------------------------------------ build
print("Building screens")
local game = Instance.new("DataModel")
local starterGui = game:GetService("StarterGui")
for _, s in ipairs(Layout.screens) do buildScreen(s.key).Parent = starterGui end
buildCore().Parent = starterGui
local server = Instance.new("Script")
server.Name = "TerrariumNavigation"
server.Source = readLua(studioDir .. "/Server/TerrariumNavigation.server.lua")
server.Parent = game:GetService("ServerScriptService")
buildWorld(game)

for k in pairs(missing) do print("  no sprite for " .. k) end
fs.writeDir(outDir)
fs.writeFile(outDir .. "/BuildATerrarium_UI.rbxlx", roblox.serializePlace(game, true))
-- the UI on its own too, for inserting into an existing place (StarterGui > Insert from File)
local uiOnly = {}
for _, c in ipairs(starterGui:GetChildren()) do table.insert(uiOnly, c) end
fs.writeFile(outDir .. "/BuildATerrarium_UI_StarterGui.rbxm", roblox.serializeModel(uiOnly))
print("Wrote " .. outDir .. "/BuildATerrarium_UI.rbxlx and BuildATerrarium_UI_StarterGui.rbxm")
