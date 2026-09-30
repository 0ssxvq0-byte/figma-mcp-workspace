-- Build a Terrarium UI: client entry point (LocalScript in StarterPlayerScripts).
-- Wires animations, sounds, panels, notifications and interactions onto the ScreenGuis built by BuildUI.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ProximityPromptService = game:GetService("ProximityPromptService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local pkg = ReplicatedStorage:WaitForChild("TerrariumUI")
local Runtime = pkg:WaitForChild("Runtime")
local AssetIds = require(pkg.Modules.AssetIds)

local ButtonFX = require(Runtime.ButtonFX)
local Effects = require(Runtime.Effects)
local PanelManager = require(Runtime.PanelManager)
local Notifications = require(Runtime.Notifications)
local FloatingText = require(Runtime.FloatingText)
local BioactivityBar = require(Runtime.BioactivityBar)
local HUDNavigation = require(Runtime.HUDNavigation)
local IncubatorPopup = require(Runtime.IncubatorPopup)

local hud = playerGui:WaitForChild("UI_MainHUD")
task.wait()   -- let every UI_ ScreenGui replicate into PlayerGui

-- everything moves and clicks
for _, sg in ipairs(playerGui:GetChildren()) do
	if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then ButtonFX.attachAll(sg) end
end
Effects.start(playerGui, AssetIds)
PanelManager.init(playerGui)
Notifications.init(playerGui, AssetIds)
IncubatorPopup.init(playerGui)
BioactivityBar.init(hud)
HUDNavigation.init(hud)

-- Shillings: count up/down with floating +/- text (server sets the player's "Shillings" attribute)
local amountLabel = hud:FindFirstChild("ShillingsAmount", true)
local coin = hud:FindFirstChild("Icon_Shilling_Large", true)
local shillings = player:GetAttribute("Shillings") or 0
player:GetAttributeChangedSignal("Shillings"):Connect(function()
	local new = player:GetAttribute("Shillings") or 0
	if amountLabel then FloatingText.countTo(amountLabel, shillings, new) end
	if coin and new ~= shillings then FloatingText.show(coin.Parent, new - shillings) end
	shillings = new
end)
if amountLabel then amountLabel.Text = tostring(shillings) end

-- Bioactivity (server sets the "Bioactivity" attribute, 0-100)
player:GetAttributeChangedSignal("Bioactivity"):Connect(function()
	BioactivityBar.set(player:GetAttribute("Bioactivity") or 0)
end)
if player:GetAttribute("Bioactivity") then BioactivityBar.set(player:GetAttribute("Bioactivity"), false) end

-- ProximityPrompts open panels: give a prompt the attribute  OpensPanel = "EditTank_Layers"  (or KeepersShop,
-- Upgrades, MyTerrarium_Creatures, ...). The terrarium's edit prompt slides the Edit Tank in and fades the HUD.
ProximityPromptService.PromptTriggered:Connect(function(prompt)
	local panel = prompt:GetAttribute("OpensPanel")
	if panel then PanelManager.open(panel) end
end)

-- Day 7 card and the Hatch Reveal window twinkle while visible
local day7 = playerGui:FindFirstChild("UI_DailyRewards") and playerGui.UI_DailyRewards:FindFirstChild("Card_Day7_Rainbow", true)
if day7 then Effects.twinkle(day7, 6) end
local hatchWindow = playerGui:FindFirstChild("UI_HatchReveal") and playerGui.UI_HatchReveal:FindFirstChild("Window_Rare", true)
if hatchWindow then Effects.twinkle(hatchWindow, 8) end

-- examples of the notification API (delete once your game calls them for real):
-- Notifications.toast("Good", "Your Moss Egg is ready!", "Head to your incubator to hatch it")
-- Notifications.toast("Error", "Not enough Shillings", "You need 12K more", "00_Shared/Icons/Icon_Shilling")
-- Notifications.banner("Wilds", "You've entered the Wilds — PvP is on until you're home.")
-- Notifications.banner("Safe", "You're safe again — PvP is off.")
-- Notifications.announce("Sam hatched a", "Mythic Goliath Birdeater!")
-- Notifications.eventStarted("Toxic Rain", "Lasts 5m", "01_MainHUD/ActiveEvents/Event_ToxicRain")
