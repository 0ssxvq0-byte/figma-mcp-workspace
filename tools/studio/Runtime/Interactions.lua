-- Self-contained interactions that don't need your game's systems:
--   Settings toggles (ON/OFF), sliders (drag), graphics steps (Low/Medium/High/Ultra)
--   tab groups (Store categories, panel tabs): clicked one becomes selected
--   checkboxes (bulk release), Daily Rewards Claim button, Hold to Release
-- Each fires Interactions.changed:Fire(name, value) so your game can listen:
--   Interactions.changed.Event:Connect(function(name, value) print(name, value) end)
local UserInputService = game:GetService("UserInputService")
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Images = require(script.Parent.Images)
local Effects = require(script.Parent.Effects)

local Interactions = {}
Interactions.changed = Instance.new("BindableEvent")

local function labelIn(g)
	return g:FindFirstChildWhichIsA("TextLabel", true)
end
local function rowName(g)   -- the setting's title, e.g. "Music"
	local row = g.Parent
	for _ = 1, 3 do
		if not row then break end
		for _, d in ipairs(row:GetChildren()) do
			if d:IsA("TextLabel") and d ~= g and not d.Text:match("%%$") and d.Text ~= "ON" and d.Text ~= "OFF" then return d.Text end
		end
		row = row.Parent
	end
	return g.Name
end

-- ON/OFF toggles: swap the track image, slide the knob to the other side, flip the label
local function toggle(track)
	local on = track.Name == "Toggle_On_Track"
	local knob = track:FindFirstChild("Toggle_Knob", true)
	local text = labelIn(track)
	track.Activated:Connect(function()
		on = not on
		Images.apply(track, on and "17_SettingsCodes/Controls/Toggle_On_Track" or "17_SettingsCodes/Controls/Toggle_Off_Track")
		if knob then Tween(knob, 0.25, { Position = UDim2.fromScale(1 - knob.Position.X.Scale, knob.Position.Y.Scale) }, Enum.EasingStyle.Back) end
		if text then
			text.Text = on and "ON" or "OFF"
			Tween(text, 0.25, { Position = UDim2.fromScale(1 - text.Position.X.Scale, text.Position.Y.Scale) })
		end
		Interactions.changed:Fire(rowName(track), on)
	end)
end

-- sliders: drag anywhere on the track
local function slider(track)
	local fill = track:FindFirstChild("Slider_Fill", true)
	local knob = track.Parent and track.Parent:FindFirstChild("Slider_Knob", true)
	local value = track.Parent and (function()
		for _, d in ipairs(track.Parent:GetDescendants()) do if d:IsA("TextLabel") and d.Text:match("%%$") then return d end end
	end)()
	if not fill then return end
	local full = fill.Size.X.Scale / 0.7
	local knobLeft = knob and (knob.Position.X.Scale - 0.7 * (track.Size.X.Scale)) or 0
	local dragging = false
	local function set(x)
		local frac = math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
		fill.Size = UDim2.fromScale(full * math.max(frac, 0.02), fill.Size.Y.Scale)
		if knob then knob.Position = UDim2.fromScale(knobLeft + frac * track.Size.X.Scale, knob.Position.Y.Scale) end
		if value then value.Text = math.floor(frac * 100 + 0.5) .. "%" end
		Interactions.changed:Fire(rowName(track), frac)
	end
	local hit = knob and { track, knob } or { track }
	for _, g in ipairs(hit) do
		g.Active = true
		g.InputBegan:Connect(function(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
				dragging = true; set(input.Position.X); Sound.play("Click", 1.2)
			end
		end)
	end
	UserInputService.InputChanged:Connect(function(input)
		if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then set(input.Position.X) end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then dragging = false end
	end)
end

-- groups of Tab_/Category_ buttons with Selected/Unselected images inside one parent
local function tabGroups(root)
	local pairsKey = {
		Category_Selected = { "03_Store/Buttons/Category_Selected", "03_Store/Buttons/Category_Unselected" },
		Category_Unselected = { "03_Store/Buttons/Category_Selected", "03_Store/Buttons/Category_Unselected" },
	}
	for _, b in ipairs(root:GetDescendants()) do
		local keys = pairsKey[b.Name]
		if keys and b:IsA("GuiButton") then
			b.Activated:Connect(function()
				local container = b.Parent and b.Parent.Parent or b.Parent
				for _, other in ipairs(container:GetDescendants()) do
					if pairsKey[other.Name] and other:IsA("GuiButton") then
						other.Name = other == b and "Category_Selected" or "Category_Unselected"
						Images.apply(other, other == b and keys[1] or keys[2])
					end
				end
				local t = labelIn(b)
				Interactions.changed:Fire("StoreCategory", t and t.Text)
			end)
		end
	end
end

local function checkbox(b)
	local on = b.Name == "Checkbox_On"
	b.Activated:Connect(function()
		on = not on
		Images.apply(b, on and "14_Release/Buttons/Checkbox_On" or "14_Release/Buttons/Checkbox_Off")
		local s = b:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", b)
		s.Scale = 0.8
		Tween(s, 0.3, { Scale = 1 }, Enum.EasingStyle.Back)
		Interactions.changed:Fire("ReleaseCheckbox", on)
	end)
end

-- Daily Rewards: Claim -> Claimed with a sparkle burst on the card
local function claim(b)
	b.Activated:Connect(function()
		if b:GetAttribute("Claimed") then return end
		b:SetAttribute("Claimed", true)
		Images.apply(b, "02_DailyRewards/Buttons/Btn_State_Claimed")
		local t = labelIn(b)
		if t then t.Text = "CLAIMED" end
		Sound.play("Claim")
		Effects.sparkles(b.Parent or b, 16, Color3.fromRGB(255, 236, 140))
		Interactions.changed:Fire("DailyClaim", b.Parent and b.Parent.Name)
	end)
end

-- Hold to Release: the fill grows while held; completes after 1.2 s
local function hold(b)
	local fill = b:FindFirstChild("HoldToRelease_Fill", true)
	if not fill then return end
	local full = fill.Size.X.Scale / 0.42
	fill.Size = UDim2.fromScale(0, fill.Size.Y.Scale)
	local tw
	b.MouseButton1Down:Connect(function()
		tw = Tween(fill, 1.2, { Size = UDim2.fromScale(full, fill.Size.Y.Scale) }, Enum.EasingStyle.Linear)
		tw.Completed:Connect(function(state)
			if state == Enum.PlaybackState.Completed then
				Sound.play("CoinGain")
				Interactions.changed:Fire("HoldToRelease", true)
			end
		end)
	end)
	local function cancel()
		if tw then tw:Cancel() end
		Tween(fill, 0.2, { Size = UDim2.fromScale(0, fill.Size.Y.Scale) })
	end
	b.MouseButton1Up:Connect(cancel)
	b.MouseLeave:Connect(cancel)
end

function Interactions.init(playerGui)
	for _, sg in ipairs(playerGui:GetChildren()) do
		if sg:IsA("ScreenGui") and sg.Name:sub(1, 3) == "UI_" then
			for _, d in ipairs(sg:GetDescendants()) do
				if d:IsA("GuiButton") then
					if d.Name == "Toggle_On_Track" or d.Name == "Toggle_Off_Track" then toggle(d)
					elseif d.Name == "Checkbox_On" or d.Name == "Checkbox_Off" then checkbox(d)
					elseif d.Name == "Btn_State_Claim" then claim(d)
					elseif d.Name == "Btn_HoldToRelease" then hold(d) end
				elseif d.Name == "Slider_Track" then slider(d) end
			end
			tabGroups(sg)
		end
	end
end

return Interactions
