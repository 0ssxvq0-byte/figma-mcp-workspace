-- "+1.2K" / "-500" text that rises and fades beside a currency, plus a count-up for the amount label.
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)

local FloatingText = {}
local FONT = Font.new("rbxasset://fonts/families/ComicNeueAngular.json", Enum.FontWeight.Bold)

function FloatingText.format(n)
	local a = math.abs(n)
	local s
	if a >= 1e9 then s = string.format("%.1fB", a / 1e9)
	elseif a >= 1e6 then s = string.format("%.1fM", a / 1e6)
	elseif a >= 1e3 then s = string.format("%.1fK", a / 1e3)
	else s = tostring(math.floor(a)) end
	return (s:gsub("%.0([KMB])", "%1"))
end
local function commas(n)
	local s = tostring(math.floor(n))
	return (s:reverse():gsub("(%d%d%d)", "%1,"):reverse():gsub("^,", ""))
end

-- amount > 0 is green and rises; amount < 0 is red and drops a little first
function FloatingText.show(anchor, amount)
	local gain = amount >= 0
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.FontFace = FONT
	label.TextScaled = true
	label.Text = (gain and "+" or "-") .. FloatingText.format(amount)
	label.TextColor3 = gain and Color3.fromRGB(151, 240, 42) or Color3.fromRGB(255, 106, 79)
	label.AnchorPoint = Vector2.new(0, 0.5)
	label.Size = UDim2.fromScale(0.6, 0.55)
	label.Position = UDim2.fromScale(1.02 + math.random() * 0.1, 0.2)
	label.ZIndex = 40
	local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(11, 15, 29); stroke.Thickness = 3; stroke.Parent = label
	label.Parent = anchor
	Sound.play(gain and "CoinGain" or "CoinSpend", nil, 0.08)
	local rise = gain and -0.9 or 0.5
	Tween(label, 1.1, { Position = label.Position + UDim2.fromScale(0, rise) }, Enum.EasingStyle.Quad)
	task.delay(0.45, function()
		Tween(label, 0.6, { TextTransparency = 1 })
		Tween(stroke, 0.6, { Transparency = 1 }).Completed:Wait()
		label:Destroy()
	end)
end

-- counts a TextLabel from its current number to `value` (e.g. the Shillings amount)
function FloatingText.countTo(label, from, to, time)
	local v = Instance.new("NumberValue")
	v.Value = from
	v.Changed:Connect(function(x) label.Text = commas(x) end)
	local tw = Tween(v, time or 0.6, { Value = to }, Enum.EasingStyle.Quad)
	tw.Completed:Connect(function() v:Destroy() end)
	-- a small bump on the label
	local s = label:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", label)
	s.Scale = 1.12
	Tween(s, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
end

return FloatingText
