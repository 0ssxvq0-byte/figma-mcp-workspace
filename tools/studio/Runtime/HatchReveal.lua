-- Shows the Hatch Reveal card for any creature and rarity.
--   HatchReveal.show({ name = "Stag Beetle", rarity = "Rare", job = "HUNTER", jobText = "Eats excess insects",
--                      fact = "Male stag beetles use their huge jaws to\nwrestle rivals — not to bite.",
--                      entry = 21, isNew = true, tankFull = false })
--   HatchReveal.added.Event:Connect(function(toHolding) ... end)   -- player pressed the button
-- Common is a quick pop; Rare and Epic add slow rays; Legendary and Mythic add the full-screen burst and a shake.
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Images = require(script.Parent.Images)
local Effects = require(script.Parent.Effects)
local PanelManager = require(script.Parent.PanelManager)

local HatchReveal = {}
HatchReveal.added = Instance.new("BindableEvent")

local COLOURS = {
	Common = Color3.fromRGB(226, 222, 209), Uncommon = Color3.fromRGB(139, 190, 122), Rare = Color3.fromRGB(96, 157, 214),
	Epic = Color3.fromRGB(163, 110, 214), Legendary = Color3.fromRGB(226, 168, 62), Mythic = Color3.fromRGB(224, 84, 84),
}
local sg

local function find(name) return sg and sg:FindFirstChild(name, true) end

function HatchReveal.init(playerGui)
	sg = playerGui:WaitForChild("UI_HatchReveal")
	local add, hold = find("Btn_AddToTerrarium"), find("Btn_SendToHolding")
	if add then add.Activated:Connect(function() PanelManager.close(); HatchReveal.added:Fire(false) end) end
	if hold then hold.Activated:Connect(function() PanelManager.close(); HatchReveal.added:Fire(true) end) end
end

function HatchReveal.show(d)
	if not sg then return end
	local rarity = d.rarity or "Rare"
	local colour = COLOURS[rarity] or COLOURS.Rare
	local header, window = find("Header_Rare"), find("Window_Rare")
	-- rarity colour: the common (off-white) header and window, tinted
	for _, g in ipairs({ header, window }) do
		if g then
			if rarity == "Rare" then
				Images.apply(g, g == header and "13_HatchReveal/Card/Header_Rare" or "13_HatchReveal/Card/Window_Rare")
				g.ImageColor3 = Color3.new(1, 1, 1)
			else
				Images.apply(g, g == header and "13_HatchReveal/Card/Header_Common" or "13_HatchReveal/Card/Window_Common")
				g.ImageColor3 = rarity == "Common" and Color3.new(1, 1, 1) or colour
			end
		end
	end
	local set = function(name, text) local l = find(name); if l and text then l.Text = text end end
	set("CreatureName", d.name); set("HatchTitle", rarity .. " Hatch!"); set("RarityLabel", string.upper(rarity))
	set("JobLabel", d.job); set("JobDescription", d.jobText); set("FieldNote", d.fact)
	if d.entry then set("EntryNumber", "Field Guide #" .. d.entry) end
	local sticker = find("Sticker_NewSpecies"); if sticker then sticker.Visible = d.isNew ~= false end
	local add, hold = find("Btn_AddToTerrarium"), find("Btn_SendToHolding")
	if add then add.Visible = not d.tankFull end
	if hold then hold.Visible = d.tankFull == true end
	local rays = find("Window_Rays"); if rays then rays.Visible = rarity ~= "Common" end
	local big = rarity == "Legendary" or rarity == "Mythic"
	for _, b in ipairs(sg:GetDescendants()) do
		if b:IsA("ImageLabel") and b.Name:find("^Burst_") then b.Visible = big and b.Name == "Burst_" .. rarity end
	end
	PanelManager.open("HatchReveal")
	Sound.play(big and "RareHatch" or "EggHatch")
	if window then task.delay(0.25, Effects.sparkles, window, big and 24 or 12, colour) end
	if big then   -- a short shake of the whole card
		local root = sg.Root
		for i = 1, 6 do
			root.Position = UDim2.fromOffset((i % 2 == 0 and 1 or -1) * (8 - i), 0)
			task.wait(0.04)
		end
		root.Position = UDim2.fromScale(0, 0)
	end
	-- the sticker drops in after the card
	if sticker and sticker.Visible then
		local s = sticker:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", sticker)
		s.Scale = 0
		task.delay(0.35, function() Tween(s, 0.4, { Scale = 1 }, Enum.EasingStyle.Back) end)
	end
end

return HatchReveal
