-- What each HUD button does.
--   Top tabs travel in the world: My Terrarium -> your terrarium, Shop -> the Keeper, Upgrades -> the upgrades NPC.
--   The NPCs / terrarium then open their panel through ProximityPrompts (see UIController).
--   Side buttons open their panel directly.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(script.Parent.UIConfig)
local PanelManager = require(script.Parent.PanelManager)

local HUDNavigation = {}

local TRAVEL = { Tab_MyTerrarium = "Terrarium", Tab_Shop = "Keeper", Tab_Upgrades = "Upgrades" }
local OPEN = {
	Btn_DailyRewards = "DailyRewards", Btn_Store = "Store", Btn_FieldGuide = "FieldGuide", Btn_Rebirth = "Rebirth",
	Btn_Eggs_Frame = "EggInventory", Btn_Settings = "Settings", Btn_AddShillings_Plus = "Store",
}

function HUDNavigation.init(hud)
	local remote = ReplicatedStorage:WaitForChild(Config.TravelRemote, 10)
	for _, b in ipairs(hud:GetDescendants()) do
		if b:IsA("GuiButton") then
			if TRAVEL[b.Name] then
				b.Activated:Connect(function()
					PanelManager.close()
					if remote then remote:FireServer(TRAVEL[b.Name]) end
				end)
			elseif OPEN[b.Name] then
				b.Activated:Connect(function()
					if PanelManager.current() == OPEN[b.Name] then PanelManager.close() else PanelManager.open(OPEN[b.Name]) end
				end)
			end
		end
	end
end

return HUDNavigation
