-- Opens and closes the full-screen panels (one at a time), slides them in, switches tabs,
-- picks a random vine set each time a panel opens, and fades the HUD while the Edit Tank panel is open.
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Config = require(script.Parent.UIConfig)

local PanelManager = {}
local gui = {}          -- screen key -> ScreenGui
local current           -- key of the open panel
local hudFaded = false
local playerGui

-- how each panel arrives. Default: slides up from the bottom.
local STYLE = {
	EditTank_Layers = { from = "Right", fadeHud = true },
	EditTank_Backdrops = { from = "Right", fadeHud = true },
	MyTerrarium_Creatures = { from = "Right" }, MyTerrarium_Holding = { from = "Right" }, MyTerrarium_Stats = { from = "Right" },
	HatchReveal = { pop = true }, Release = { pop = true }, WelcomeBack = { pop = true },
}
-- tab buttons (found by their label) and the screen they show
local TABS = {
	Creatures = "MyTerrarium_Creatures", Holding = "MyTerrarium_Holding", Stats = "MyTerrarium_Stats", Decor = "EditTank_Layers",
	Layers = "EditTank_Layers", Backdrops = "EditTank_Backdrops",
}
local GROUP = { -- tabs inside one panel swap instantly instead of sliding again
	MyTerrarium_Creatures = "Terrarium", MyTerrarium_Holding = "Terrarium", MyTerrarium_Stats = "Terrarium",
	EditTank_Layers = "Edit", EditTank_Backdrops = "Edit",
}

local function offscreen(from)
	if from == "Right" then return UDim2.fromScale(1.05, 0) end
	if from == "Left" then return UDim2.fromScale(-1.05, 0) end
	return UDim2.fromScale(0, 1.05)
end

local function labelOf(button)
	local t = button:FindFirstChildWhichIsA("TextLabel", true)
	return t and t.Text
end

-- HUD transparency: remember each piece's own transparency, then fade towards invisible
local function fadeTree(tree, k)
	for _, d in ipairs(tree:GetDescendants()) do
		local prop = (d:IsA("ImageLabel") or d:IsA("ImageButton")) and "ImageTransparency" or (d:IsA("TextLabel") and "TextTransparency") or (d:IsA("UIStroke") and "Transparency")
		if prop then
			if d:GetAttribute("BaseT") == nil then d:SetAttribute("BaseT", d[prop]) end
			local base = d:GetAttribute("BaseT")
			Tween(d, 0.25, { [prop] = base + (1 - base) * k })
		end
	end
end
local hoverHooked = false
local function setHud(faded)
	local hud = gui.MainHUD
	if not hud or hudFaded == faded then return end
	hudFaded = faded
	fadeTree(hud, faded and Config.HudFadeTransparency or 0)
	-- while faded, a HUD piece becomes fully visible again while the mouse is over it
	if not hoverHooked then
		hoverHooked = true
		for _, holder in ipairs(hud.Root:GetChildren()) do
			if holder:IsA("GuiObject") then
				holder.MouseEnter:Connect(function() if hudFaded then fadeTree(holder, 0) end end)
				holder.MouseLeave:Connect(function() if hudFaded then fadeTree(holder, Config.HudFadeTransparency) end end)
			end
		end
	end
end

function PanelManager.setHudFaded(faded) setHud(faded) end

local function pickVines(sg)
	local set = math.random(1, 5)
	for _, d in ipairs(sg:GetDescendants()) do
		if d:GetAttribute("VineSet") then d.Visible = d:GetAttribute("VineSet") == set end
	end
end

function PanelManager.open(key, opts)
	local sg = gui[key]
	if not sg then warn("PanelManager: no screen " .. tostring(key)); return end
	if current == key then return end
	opts = opts or STYLE[key] or {}
	local sameGroup = current and GROUP[current] and GROUP[current] == GROUP[key]
	if current then PanelManager.close(sameGroup) end
	current = key
	local root = sg.Root
	sg.Enabled = true
	pickVines(sg)
	if sameGroup then
		root.Position = UDim2.fromScale(0, 0)
	elseif opts.pop then
		local scale = root:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", root)
		scale.Scale = 0.6
		root.Position = UDim2.fromScale(0, 0)
		Tween(scale, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
		Sound.play("Open")
	else
		root.Position = offscreen(opts.from)
		Tween(root, Config.PanelOpenTime, { Position = UDim2.fromScale(0, 0) }, Enum.EasingStyle.Quint)
		Sound.play("Open")
	end
	setHud(opts.fadeHud == true)
end

function PanelManager.close(instant)
	local key = current
	if not key then return end
	current = nil
	local sg = gui[key]
	local opts = STYLE[key] or {}
	if instant then
		sg.Enabled = false
	else
		Sound.play("Close")
		local tw = Tween(sg.Root, Config.PanelCloseTime, { Position = offscreen(opts.from) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		tw.Completed:Connect(function() if current ~= key then sg.Enabled = false end end)
		setHud(false)
	end
end

function PanelManager.current() return current end
function PanelManager.screen(key) return gui[key] end

function PanelManager.init(pg)
	playerGui = pg
	for _, sg in ipairs(pg:GetChildren()) do
		if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then
			local key = sg.Name:sub(4)
			gui[key] = sg
			if key ~= "MainHUD" and not sg:GetAttribute("Templates") then
				sg.Enabled = false
				for _, d in ipairs(sg:GetDescendants()) do
					if d:IsA("GuiButton") then
						if d.Name == "Btn_Close_X" then
							d.Activated:Connect(function() PanelManager.close() end)
						elseif d.Name:sub(1, 4) == "Tab_" then
							local target = TABS[labelOf(d) or ""]
							if target then d.Activated:Connect(function() PanelManager.open(target) end) end
						end
					end
				end
			end
		end
	end
end

return PanelManager
