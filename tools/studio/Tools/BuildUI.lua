--[[
	BuildUI (run in Studio's COMMAND BAR, or ask your Studio AI to run it)

	Builds every Build a Terrarium screen as a ScreenGui in StarterGui from
	ReplicatedStorage.TerrariumUI.Modules.UILayout (positions) and .AssetIds (image IDs).
	Safe to run again: it replaces the UI_ ScreenGuis it made before.

	What you get per screen:
	  StarterGui.UI_<Screen>  (ScreenGui)
	    Root                   (full-screen transparent Frame; panels slide by moving this)
	      <pieces>             every exported image, nested inside the piece it sits on,
	                           TextLabels for all text (Comic Neue Angular + ink stroke + gradient),
	                           CreatureSlot / EggSlot frames where your 3D models go,
	                           Panel frames (UICorner + UIStroke + stud tile) for the dark panel bodies
	Nothing is scripted here; UIController (Runtime) adds the animations, sounds and behaviour.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local pkg = ReplicatedStorage:WaitForChild("TerrariumUI")
local Layout = require(pkg.Modules.UILayout)
local AssetIds = require(pkg.Modules.AssetIds)

-- Change FONT if Comic Neue Angular is not in your Studio's font list (Enum.Font.FredokaOne is the closest)
local FONT = Font.new("rbxasset://fonts/families/ComicNeueAngular.json", Enum.FontWeight.Bold)
local INK = Color3.fromRGB(11, 15, 29)
local PANEL_BG = Color3.fromRGB(17, 33, 22)
local W, H = Layout.canvas[1], Layout.canvas[2]

-- how each screen behaves
local SCREEN = {
	MainHUD = { order = 1, enabled = true },
	Notifications = { order = 30, enabled = true, templates = true },   -- toasts/banners are cloned from here
	Incubator = { order = 2, enabled = false, templates = true },      -- cloned into BillboardGuis
	HatchReveal = { order = 20 },
	Release = { order = 25 },
	WelcomeBack = { order = 25 },
}
-- well-known text labels get stable names so scripts can update them
local NAMED_TEXT = {
	["MainHUD|572,831"] = "ShillingsAmount", ["MainHUD|57 / 100"] = "BioactivityValue", ["MainHUD|Bioactivity"] = "BioactivityLabel",
	["MainHUD|4"] = "RebirthCount", ["MainHUD|12/30"] = "EggsCount", ["MainHUD|3m 51s"] = "RestockTimer", ["MainHUD|1.07x"] = "IncomeMultiplier",
	["KeepersShop|3m 51s"] = "RestockTimer",
}

local function area(n) return n.w * n.h end
local function hasAsset(key)
	local id = AssetIds[key]
	return id and id ~= ""
end

local function collect(screenKey)
	local nodes = {}
	for order, a in ipairs(Layout.assets) do
		for _, inst in ipairs(a.instances) do
			if inst.screen == screenKey then
				table.insert(nodes, { kind = "image", asset = a, x = inst.x, y = inst.y, w = inst.w, h = inst.h, alt = inst.alt, order = order })
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

-- a piece can hold other pieces unless it spins, is a glow/vine/icon, or is a full-screen dim
local function canHold(n)
	if n.kind == "frame" then return true end
	if n.kind ~= "image" or n.alt then return false end   -- hidden alternate states never hold visible pieces
	local a = n.asset
	return not (a.spin or a.vineSet or a.name:find("Glow") or a.name:find("Rays") or a.name:find("^Icon_") or a.name == "Backdrop_Dim"
		or a.name:find("Sparkle") or a.name:find("^Sticker") or a.name:find("^Stamp") or a.name:find("Fill"))
end
local function contains(p, c, centreOnly)
	local cx, cy = c.x + c.w / 2, c.y + c.h / 2
	if cx < p.x or cx > p.x + p.w or cy < p.y or cy > p.y + p.h then return false end
	if centreOnly then return true end
	local ix = math.max(0, math.min(c.x + c.w, p.x + p.w) - math.max(c.x, p.x))
	local iy = math.max(0, math.min(c.y + c.h, p.y + p.h) - math.max(c.y, p.y))
	return ix * iy >= 0.85 * area(c)
end

local function place(gui, n, parent, leftAnchor)
	if parent then
		-- children are centred on their spot, so they grow and bounce from the middle
		local ax = leftAnchor and 0 or 0.5
		gui.AnchorPoint = Vector2.new(ax, 0.5)
		gui.Position = UDim2.fromScale((n.x + ax * n.w - parent.x) / parent.w, (n.y + n.h / 2 - parent.y) / parent.h)
		gui.Size = UDim2.fromScale(n.w / parent.w, n.h / parent.h)
		return gui
	end
	-- top-level pieces are pinned to the nearest screen edge/corner and keep their shape on any screen
	local cx, cy = n.x + n.w / 2, n.y + n.h / 2
	local ax = cx < W / 3 and 0 or (cx > 2 * W / 3 and 1 or 0.5)
	local ay = cy < H / 3 and 0 or (cy > 2 * H / 3 and 1 or 0.5)
	local holder = Instance.new("Frame")
	holder.Name = gui.Name .. "_Holder"
	holder.BackgroundTransparency = 1
	holder.AnchorPoint = Vector2.new(ax, ay)
	holder.Position = UDim2.fromScale((n.x + ax * n.w) / W, (n.y + ay * n.h) / H)
	holder.Size = UDim2.fromScale(n.w / W, n.h / H)
	local c = Instance.new("UIAspectRatioConstraint")
	c.AspectRatio = n.w / n.h
	c.Parent = holder
	gui.AnchorPoint = Vector2.new(leftAnchor and 0 or 0.5, 0.5)
	gui.Position = UDim2.fromScale(leftAnchor and 0 or 0.5, 0.5)
	gui.Size = UDim2.fromScale(1, 1)
	gui.Parent = holder
	return holder
end

local function makeImage(n)
	local a = n.asset
	local gui = Instance.new(a.button and "ImageButton" or "ImageLabel")
	gui.Name = a.name
	gui.BackgroundTransparency = 1
	gui.Image = AssetIds[a.key] or ""
	gui.ScaleType = Enum.ScaleType.Stretch
	if a.slice then
		gui.ScaleType = Enum.ScaleType.Slice
		gui.SliceCenter = Rect.new(a.slice.left, a.slice.top, a.slice.right, a.slice.bottom)
		gui.SliceScale = a.slice.scale
	elseif a.tile then
		gui.ScaleType = Enum.ScaleType.Tile
		gui.TileSize = UDim2.fromOffset(a.tile, a.tile)
	end
	if a.button then gui.AutoButtonColor = false end
	gui:SetAttribute("AssetKey", a.key)
	if a.spin then gui:SetAttribute("Spin", true) end
	if a.fill then gui:SetAttribute("FillFraction", a.fill) end
	if a.vineSet then
		gui:SetAttribute("VineSet", a.vineSet)
		gui.Visible = a.vineSet == 1
	end
	if n.alt then gui.Visible = false; gui:SetAttribute("AlternateState", true) end
	if a.name:find("^Badge_") then gui:SetAttribute("Bounce", true) end
	if a.name == "Eggs_Counter_Tag" then gui:SetAttribute("Tilt", true) end
	if not hasAsset(a.key) then warn("BuildUI: no image ID for " .. a.key) end
	gui.ZIndex = a.vineSet and (a.front and 40 or 1) or (a.button and 6 or 5)
	if a.name:find("Dim") then gui.ZIndex = 0 end          -- full-screen dim sits behind everything
	if a.name:find("^Burst_") then gui.ZIndex = 1 end      -- rarity bursts sit behind the Hatch card
	return gui
end

local function makeText(n, screenKey)
	local t = n.text
	local gui = Instance.new("TextLabel")
	local named = NAMED_TEXT[screenKey .. "|" .. t.text]
	gui.Name = named or ("Text_" .. t.text:gsub("[^%w]+", "_"):sub(1, 28))
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
	stroke:SetAttribute("BaseThickness", stroke.Thickness)   -- UIController rescales strokes to the screen size
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
	f:SetAttribute("Hint", n.slot.hint)   -- which model goes here (placeholder name from the mockup)
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
	if n.frame.studs and hasAsset("00_Shared/Panel_Studs_Tile") then
		local studs = Instance.new("ImageLabel")
		studs.Name = "Studs"
		studs.BackgroundTransparency = 1
		studs.Image = AssetIds["00_Shared/Panel_Studs_Tile"]
		studs.ScaleType = Enum.ScaleType.Tile
		studs.TileSize = UDim2.fromOffset(96, 96)
		studs.Size = UDim2.fromScale(1, 1)
		studs.ZIndex = 1
		local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, 10); c.Parent = studs
		studs.Parent = f
	end
	return f
end

local function buildScreen(screenKey)
	local conf = SCREEN[screenKey] or { order = 10 }
	local old = StarterGui:FindFirstChild("UI_" .. screenKey)
	if old then old:Destroy() end
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
	-- biggest first, so every piece's container exists before it
	table.sort(nodes, function(a, b)
		if area(a) ~= area(b) then return area(a) > area(b) end
		return a.order < b.order
	end)
	local function create(n, best)
		local gui
		if n.kind == "image" then gui = makeImage(n)
		elseif n.kind == "text" then gui = makeText(n, screenKey)
		elseif n.kind == "slot" then gui = makeSlot(n)
		else gui = makeFrame(n) end
		local leftAnchor = n.kind == "image" and n.asset.leftFill == true
		local top = place(gui, n, best, leftAnchor)
		top.Parent = best and best.gui or root
		n.gui = gui
	end
	-- rotating rays go inside the card they shine behind (even though they are bigger), clipped to it
	local isRays = function(n) return n.kind == "image" and n.asset.spin and not n.asset.name:find("^Burst_") end
	local deferred = {}
	for i, n in ipairs(nodes) do
		if isRays(n) then
			table.insert(deferred, n)
		else
			local best
			for j = 1, i - 1 do
				local p = nodes[j]
				if p.gui and canHold(p) and area(p) > area(n) * 1.01 and contains(p, n, n.kind == "text" or (n.asset and n.asset.vineSet ~= nil)) then
					if not best or area(p) < area(best) then best = p end
				end
			end
			-- back-layer vines sit behind their panel, so they stay top-level
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
			-- ClipsDescendants ignores rotated children, so the spinning rays go in a CanvasGroup, which does clip them
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
	sg.Parent = StarterGui
	print(("BuildUI: %s  (%d pieces)"):format(sg.Name, #nodes))
	return sg
end

for _, s in ipairs(Layout.screens) do buildScreen(s.key) end
print("BuildUI: done. Add the Runtime modules and UIController to make it move (see README).")
