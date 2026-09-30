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

-- every step runs on its own, so one problem can never stop the rest of the UI from starting
local function step(name, fn)
	local ok, err = xpcall(fn, debug.traceback)
	if not ok then warn("[UI] '" .. name .. "' failed:\n" .. tostring(err)) end
	return ok
end
print("[UI] starting")

-- wait until every UI_ ScreenGui from StarterGui has arrived
step("wait for screens", function()
	for _, name in ipairs(require(Runtime.ImageMap).screens) do playerGui:WaitForChild("UI_" .. name, 10) end
end)

-- images come from the sprite sheets; the IDs you pasted live in UI_Core.SheetIds
local sheetIds = script.Parent:WaitForChild("SheetIds")
local linked, waiting, missingSheets = 0, 0, {}
step("images", function()
	for _, sg in ipairs(playerGui:GetChildren()) do
		if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then
			local l, w, names = Images.applyAll(sg, sheetIds)
			linked += l; waiting += w
			for _, n in ipairs(names) do missingSheets[n] = true end
		end
	end
end)
if waiting > 0 then
	local list = {}
	for n in pairs(missingSheets) do table.insert(list, n) end
	table.sort(list)
	warn(("[UI] %d images have no sheet ID yet (%s). Paste the IDs into StarterGui.UI_Core.SheetIds (see README_FIRST)."):format(waiting, table.concat(list, ", ")))
	local notice = Instance.new("ScreenGui")
	notice.Name = "UI_SetupNotice"; notice.DisplayOrder = 100; notice.ResetOnSpawn = false; notice.IgnoreGuiInset = true
	local box = Instance.new("TextLabel")
	box.AnchorPoint = Vector2.new(0.5, 1); box.Position = UDim2.fromScale(0.5, 0.97); box.Size = UDim2.fromScale(0.6, 0.07)
	box.BackgroundColor3 = Color3.fromRGB(255, 200, 60); box.TextColor3 = Color3.fromRGB(30, 30, 30)
	box.TextScaled = true; box.Font = Enum.Font.FredokaOne
	box.Text = "Images not linked yet: paste the sheet IDs into StarterGui > UI_Core > SheetIds (see README_FIRST)"
	Instance.new("UICorner", box).CornerRadius = UDim.new(0, 10)
	box.Parent = notice
	notice.Parent = playerGui
	task.delay(25, function() notice:Destroy() end)
else
	print(("[UI] %d images linked"):format(linked))
end

step("buttons", function()
	for _, sg in ipairs(playerGui:GetChildren()) do
		if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then ButtonFX.attachAll(sg) end
	end
end)
step("effects", function() Effects.start(playerGui) end)
step("panels", function() PanelManager.init(playerGui) end)
step("notifications", function() Notifications.init(playerGui) end)
step("incubator popups", function() IncubatorPopup.init(playerGui) end)
step("interactions", function() Interactions.init(playerGui) end)
step("hatch reveal", function() HatchReveal.init(playerGui) end)
local hud = playerGui:WaitForChild("UI_MainHUD")
step("bioactivity bar", function() BioactivityBar.init(hud) end)
step("hud navigation", function() HUDNavigation.init(hud) end)

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
print("[UI] ready. Test keys: 1-9, 0, H, E")
