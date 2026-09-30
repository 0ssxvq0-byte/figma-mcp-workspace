-- Toasts (slide down from the top), Wilds banners (drop in), rare hatch announcements,
-- the Wilds indicator, event pop-ups (slide in from the right) and the egg-banked flight.
-- Everything is cloned from the templates BuildUI made in UI_Notifications.
local RunService = game:GetService("RunService")
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Config = require(script.Parent.UIConfig)
local ButtonFX = require(script.Parent.ButtonFX)
local Images = require(script.Parent.Images)

local Notifications = {}
local sg, root, templates = nil, nil, {}
local toasts = {}

-- the holder (top-level piece) that contains a descendant with this name
local function holderWith(name)
	for _, h in ipairs(root:GetChildren()) do
		if h.Name == name .. "_Holder" or h:FindFirstChild(name, true) then return h end
	end
end
local function texts(g)
	local list = {}
	for _, d in ipairs(g:GetDescendants()) do if d:IsA("TextLabel") then table.insert(list, d) end end
	table.sort(list, function(a, b) return a.AbsolutePosition.Y < b.AbsolutePosition.Y end)
	return list
end

function Notifications.init(playerGui)
	sg = playerGui:WaitForChild("UI_Notifications")
	root = sg.Root
	templates.toast = holderWith("Toast_Body")
	templates.bannerRed = holderWith("Banner_Red_Wilds")
	templates.bannerGreen = holderWith("Banner_Green_Safe")
	templates.announce = holderWith("Announcement_Strip")
	templates.wilds = holderWith("Wilds_Indicator")
	for _, h in ipairs(root:GetChildren()) do if h:IsA("GuiObject") then h.Visible = false end end
	sg.Enabled = true
end

-- kind: "Good" (green), "Info" (blue), "Error" (red). icon: an AssetIds key or rbxassetid string.
function Notifications.toast(kind, title, subtitle, icon)
	local t = templates.toast:Clone()
	local tabName = kind == "Error" and "Toast_Tab_Red" or kind == "Info" and "Toast_Tab_Blue" or "Toast_Tab_Green"
	for _, d in ipairs(t:GetDescendants()) do
		if d:IsA("ImageLabel") and d.Name:find("^Toast_Tab_") then Images.apply(d, "15_Notifications/" .. tabName) end
		if d:IsA("ImageLabel") and icon and d.Name:find("^Icon") then if not Images.apply(d, icon) then d.Image = icon end end
	end
	local lines = texts(t)
	if lines[1] then lines[1].Text = title end
	if lines[2] then lines[2].Text = subtitle or "" end
	t.AnchorPoint = Vector2.new(0.5, 0)
	local index = #toasts
	local y = 0.2 + index * 0.075
	t.Position = UDim2.fromScale(0.5, -0.1)
	t.Visible = true
	t.Parent = root
	table.insert(toasts, t)
	Sound.play(kind == "Error" and "Error" or "Notify")
	Tween(t, 0.35, { Position = UDim2.fromScale(0.5, y) }, Enum.EasingStyle.Back)
	task.delay(Config.ToastTime, function()
		Tween(t, 0.25, { Position = UDim2.fromScale(0.5, -0.1) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In).Completed:Wait()
		table.remove(toasts, table.find(toasts, t))
		t:Destroy()
		for i, other in ipairs(toasts) do Tween(other, 0.25, { Position = UDim2.fromScale(0.5, 0.2 + (i - 1) * 0.075) }) end
	end)
end

-- "Wilds" (red) or "Safe" (green)
function Notifications.banner(kind, text)
	local t = (kind == "Wilds" and templates.bannerRed or templates.bannerGreen):Clone()
	local lines = texts(t)
	if text and lines[1] then lines[1].Text = text end
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.fromScale(0.5, -0.12)
	t.Visible = true
	t.Parent = root
	Sound.play("Banner")
	Tween(t, 0.45, { Position = UDim2.fromScale(0.5, 0.17) }, Enum.EasingStyle.Back)
	task.delay(Config.BannerTime, function()
		Tween(t, 0.3, { Position = UDim2.fromScale(0.5, -0.12) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In).Completed:Wait()
		t:Destroy()
	end)
	if templates.wilds then templates.wilds.Visible = kind == "Wilds" end
end

-- "Sam hatched a Mythic Goliath Birdeater!" ; nameColor tints the second line (rarity colour)
function Notifications.announce(prefix, highlighted)
	local t = templates.announce:Clone()
	local lines = texts(t)
	table.sort(lines, function(a, b) return a.AbsolutePosition.X < b.AbsolutePosition.X end)
	if lines[1] then lines[1].Text = prefix end
	if lines[2] then lines[2].Text = highlighted end
	t.Visible = true
	t.Parent = root
	local s = Instance.new("UIScale"); s.Scale = 0.5; s.Parent = t
	Sound.play("RareHatch")
	Tween(s, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(5, function()
		Tween(s, 0.25, { Scale = 0 }).Completed:Wait()
		t:Destroy()
	end)
end

-- an event started: small card slides in from the right; your Active Events list can slide up from the bottom
function Notifications.eventStarted(title, subtitle, icon, activeEventsFrame)
	local t = templates.toast:Clone()
	for _, d in ipairs(t:GetDescendants()) do
		if d:IsA("ImageLabel") and icon and d.Name:find("^Icon") then if not Images.apply(d, icon) then d.Image = icon end end
	end
	local lines = texts(t)
	if lines[1] then lines[1].Text = title end
	if lines[2] then lines[2].Text = subtitle or "" end
	t.AnchorPoint = Vector2.new(1, 0.5)
	t.Position = UDim2.fromScale(1.4, 0.62)
	t.Visible = true
	t.Parent = root
	Sound.play("Notify")
	Tween(t, 0.45, { Position = UDim2.fromScale(0.985, 0.62) }, Enum.EasingStyle.Back)
	task.delay(Config.ToastTime + 1, function()
		Tween(t, 0.3, { Position = UDim2.fromScale(1.4, 0.62) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In).Completed:Wait()
		t:Destroy()
	end)
	if activeEventsFrame and not activeEventsFrame.Visible then
		local target = activeEventsFrame.Position
		activeEventsFrame.Position = target + UDim2.fromScale(0, 0.4)
		activeEventsFrame.Visible = true
		Tween(activeEventsFrame, 0.5, { Position = target }, Enum.EasingStyle.Quint)
	end
end

function Notifications.setWilds(on)
	if templates.wilds then templates.wilds.Visible = on end
end

-- egg banked: an image flies from the egg's world position into the Eggs button, which pops.
-- image: an rbxassetid of your egg render; eggsButton: the Btn_Eggs_Frame in UI_MainHUD
function Notifications.eggBanked(worldPosition, image, eggsButton)
	local cam = workspace.CurrentCamera
	local p, onScreen = cam:WorldToViewportPoint(worldPosition)
	local start = onScreen and Vector2.new(p.X, p.Y) or cam.ViewportSize / 2
	local finish = eggsButton.AbsolutePosition + eggsButton.AbsoluteSize / 2
	local egg = Instance.new("ImageLabel")
	egg.BackgroundTransparency = 1
	if image then egg.Image = image else Images.apply(egg, "00_Shared/Sparkle") end
	egg.AnchorPoint = Vector2.new(0.5, 0.5)
	egg.Size = UDim2.fromOffset(70, 80)
	egg.ZIndex = 50
	egg.Parent = root
	local control = (start + finish) / 2 - Vector2.new(0, 220)
	local t = 0
	local conn
	conn = RunService.RenderStepped:Connect(function(dt)
		t = math.min(1, t + dt / 0.7)
		local e = t * t * (3 - 2 * t)
		local a = start:Lerp(control, e):Lerp(control:Lerp(finish, e), e)
		egg.Position = UDim2.fromOffset(a.X, a.Y)
		egg.Rotation = e * 360
		egg.Size = UDim2.fromOffset(70 - 30 * e, 80 - 34 * e)
		if t >= 1 then
			conn:Disconnect()
			egg:Destroy()
			Sound.play("CoinGain", 1.2)
			task.spawn(ButtonFX.pop, eggsButton)
		end
	end)
end

return Notifications
