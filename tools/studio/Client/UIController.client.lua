-- Build a Terrarium UI: client entry point. Lives in StarterGui.UI_Core, runs when the UI is copied to PlayerGui.
-- Wires images, animations, sounds, panels, notifications and interactions onto the UI_ ScreenGuis.
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local Runtime = script.Parent:WaitForChild("Runtime")

local Images = require(Runtime.Images)
local ButtonFX = require(Runtime.ButtonFX)
local Effects = require(Runtime.Effects)
local PanelManager = require(Runtime.PanelManager)
local Notifications = require(Runtime.Notifications)
local FloatingText = require(Runtime.FloatingText)
local BioactivityBar = require(Runtime.BioactivityBar)
local HUDNavigation = require(Runtime.HUDNavigation)
local IncubatorPopup = require(Runtime.IncubatorPopup)
local Interactions = require(Runtime.Interactions)
local HatchReveal = require(Runtime.HatchReveal)

-- wait until every UI_ ScreenGui from StarterGui has arrived
local SCREENS = require(Runtime.ImageMap).screens
for _, name in ipairs(SCREENS) do playerGui:WaitForChild("UI_" .. name, 10) end

-- images from the sprite sheets (IDs pasted into UI_Core.SheetIds)
local sheetIds = script.Parent:WaitForChild("SheetIds")
for _, sg in ipairs(playerGui:GetChildren()) do
	if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then Images.applyAll(sg, sheetIds) end
end

for _, sg in ipairs(playerGui:GetChildren()) do
	if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then ButtonFX.attachAll(sg) end
end
Effects.start(playerGui)
PanelManager.init(playerGui)
Notifications.init(playerGui)
IncubatorPopup.init(playerGui)
Interactions.init(playerGui)
HatchReveal.init(playerGui)
local hud = playerGui:WaitForChild("UI_MainHUD")
BioactivityBar.init(hud)
HUDNavigation.init(hud)

-- Shillings: count up/down with floating +/- text (set the player's "Shillings" attribute from your server)
local amountLabel = hud:FindFirstChild("ShillingsAmount", true)
local coin = hud:FindFirstChild("Icon_Shilling_Large", true)
local shillings = player:GetAttribute("Shillings")
player:GetAttributeChangedSignal("Shillings"):Connect(function()
	local new = player:GetAttribute("Shillings") or 0
	local old = shillings or new
	if amountLabel then FloatingText.countTo(amountLabel, old, new) end
	if coin and new ~= old then FloatingText.show(coin.Parent, new - old) end
	shillings = new
end)

-- Bioactivity 0-100 (the player's "Bioactivity" attribute)
player:GetAttributeChangedSignal("Bioactivity"):Connect(function()
	BioactivityBar.set(player:GetAttribute("Bioactivity") or 0)
end)

-- ProximityPrompts open panels: give the prompt an attribute OpensPanel = "EditTank_Layers" / "KeepersShop" / ...
ProximityPromptService.PromptTriggered:Connect(function(prompt)
	local panel = prompt:GetAttribute("OpensPanel")
	if panel then PanelManager.open(panel) end
end)

-- twinkling stars on the Day 7 card and the Hatch Reveal window
local day7 = playerGui.UI_DailyRewards:FindFirstChild("Card_Day7_Rainbow", true)
if day7 then Effects.twinkle(day7, 6) end
local hatchWindow = playerGui.UI_HatchReveal:FindFirstChild("Window_Rare", true)
if hatchWindow then Effects.twinkle(hatchWindow, 8) end

-- expose the API for your own scripts: require(PlayerGui.UI_Core.Runtime.<Module>) works too
script.Parent:SetAttribute("Ready", true)
