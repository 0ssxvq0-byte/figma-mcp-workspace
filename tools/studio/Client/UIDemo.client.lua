-- Test keys for trying the UI in Play mode. Delete this script once your game drives the UI itself.
--   1 good toast   2 error toast   3 Wilds banner   4 safe banner   5 rare-hatch announcement
--   6 event starts   7 +Shillings   8 -Shillings   9 Bioactivity +10   0 Hatch Reveal (cycles rarities)
--   H Hatch Reveal with tank full   E egg-banked flight   (click HUD buttons to open panels; X or Esc closes)
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local core = script.Parent
repeat task.wait() until core:GetAttribute("Ready")
local Runtime = core.Runtime
local Notifications = require(Runtime.Notifications)
local HatchReveal = require(Runtime.HatchReveal)
local PanelManager = require(Runtime.PanelManager)

player:SetAttribute("Shillings", 572831)
player:SetAttribute("Bioactivity", 57)
local rarities = { "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic" }
local r = 0

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	local k = input.KeyCode
	if k == Enum.KeyCode.One then Notifications.toast("Good", "Your Moss Egg is ready!", "Head to your incubator to hatch it")
	elseif k == Enum.KeyCode.Two then Notifications.toast("Error", "Not enough Shillings", "You need 12K more", "00_Shared/Icons/Icon_Shilling")
	elseif k == Enum.KeyCode.Three then Notifications.banner("Wilds", "You've entered the Wilds — PvP is on until you're home.")
	elseif k == Enum.KeyCode.Four then Notifications.banner("Safe", "You're safe again — PvP is off.")
	elseif k == Enum.KeyCode.Five then Notifications.announce("Sam hatched a", "Mythic Goliath Birdeater!")
	elseif k == Enum.KeyCode.Six then Notifications.eventStarted("Toxic Rain", "Lasts 5m", "01_MainHUD/ActiveEvents/Event_ToxicRain")
	elseif k == Enum.KeyCode.Seven then player:SetAttribute("Shillings", player:GetAttribute("Shillings") + math.random(200, 5000))
	elseif k == Enum.KeyCode.Eight then player:SetAttribute("Shillings", player:GetAttribute("Shillings") - math.random(100, 2000))
	elseif k == Enum.KeyCode.Nine then player:SetAttribute("Bioactivity", (player:GetAttribute("Bioactivity") + 10) % 110)
	elseif k == Enum.KeyCode.Zero or k == Enum.KeyCode.H then
		r = r % #rarities + 1
		HatchReveal.show({ name = "Stag Beetle", rarity = rarities[r], job = "HUNTER", jobText = "Eats excess insects",
			fact = "Male stag beetles use their huge jaws to\nwrestle rivals — not to bite.", entry = 21, isNew = true, tankFull = k == Enum.KeyCode.H })
	elseif k == Enum.KeyCode.E then
		local eggs = playerGui.UI_MainHUD:FindFirstChild("Btn_Eggs_Frame", true)
		local char = player.Character
		if eggs and char then Notifications.eggBanked(char:GetPivot().Position + Vector3.new(0, 2, -6), nil, eggs) end
	elseif k == Enum.KeyCode.Escape then PanelManager.close() end
end)
