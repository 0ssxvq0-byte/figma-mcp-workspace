-- Demo for the test world in BuildATerrarium_UI.rbxlx: incubator pop-ups and an egg you can hover and hatch.
-- Safe to delete in your real game; it does nothing if the demo parts aren't there.
local Players = game:GetService("Players")
local core = script.Parent
repeat task.wait() until core:GetAttribute("Ready")
local Runtime = core.Runtime
local IncubatorPopup = require(Runtime.IncubatorPopup)
local EggFX = require(Runtime.EggFX)
local HatchReveal = require(Runtime.HatchReveal)
local Notifications = require(Runtime.Notifications)

local incubators = workspace:FindFirstChild("DemoIncubators")
if incubators then
	for _, p in ipairs(incubators:GetChildren()) do
		local state = p:GetAttribute("PopupState")
		local popup = IncubatorPopup.new(p)
		if state == "Incubating" then
			popup:set(state, { title = "Moss Egg", rarity = "COMMON", timeLeft = "2m 14s", progress = 0.62, skipPrice = 15 })
			task.spawn(function()   -- count down so you can see it update
				local left = 134
				while popup.gui.Parent and left > 0 do
					task.wait(1); left -= 1
					popup:set(state, { timeLeft = string.format("%dm %02ds", left // 60, left % 60), progress = 1 - left / 360 })
				end
			end)
		elseif state == "Ready" then
			popup:set(state, { title = "Moss Egg" })
		else
			popup:set(state, { title = "Incubator 3", cost = "50K" })
		end
		popup:autoShow(16)
		popup.onAction:Connect(function(s)
			if s == "Locked" then Notifications.toast("Error", "Not enough Shillings", "You need 12K more", "00_Shared/Icons/Icon_Shilling")
			else Notifications.toast("Good", s == "Ready" and "Hatching!" or "Skipped!", "Watch the egg") end
		end)
	end
end

local egg = workspace:FindFirstChild("DemoEgg")
if egg then
	local fx = EggFX.new(egg)
	task.delay(3, function() fx:setReady(true) end)
	local prompt = egg:FindFirstChild("HatchPrompt")
	if prompt then
		prompt.Triggered:Connect(function()
			prompt.Enabled = false
			-- a stand-in creature: your real model goes here
			local creature = Instance.new("Model")
			creature.Name = "DemoCreature"
			local body = Instance.new("Part")
			body.Size = Vector3.new(3, 1.2, 2); body.Color = Color3.fromRGB(107, 58, 30); body.Anchored = true; body.Parent = creature
			creature.PrimaryPart = body
			fx:hatch(creature, {
				onRevealed = function()
					HatchReveal.show({ name = "Stag Beetle", rarity = "Rare", job = "HUNTER", jobText = "Eats excess insects",
						fact = "Male stag beetles use their huge jaws to\nwrestle rivals — not to bite.", entry = 21, isNew = true })
				end,
			})
		end)
	end
end
