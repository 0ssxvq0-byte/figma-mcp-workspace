-- Smooth Bioactivity fill with a level-up flourish every time it crosses a multiple of 10.
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Effects = require(script.Parent.Effects)
local FloatingText = require(script.Parent.FloatingText)

local Bar = {}
local fill, fullScale, valueLabel, plant, background
local current = 0

function Bar.init(hud)
	fill = hud:FindFirstChild("Bioactivity_Bar_Fill", true)
	background = hud:FindFirstChild("Bioactivity_Bar_Background", true)
	valueLabel = hud:FindFirstChild("BioactivityValue", true)
	plant = hud:FindFirstChild("Bioactivity_Plant", true)
	if not fill then warn("BioactivityBar: Bioactivity_Bar_Fill not found"); return end
	-- the mockup shows 57%; work out what 100% is
	fullScale = fill.Size.X.Scale / (fill:GetAttribute("FillFraction") or 0.57)
	current = 57
end

function Bar.set(value, animate)
	if not fill then return end
	value = math.clamp(value, 0, 100)
	local old = current
	current = value
	local target = UDim2.new(math.max(0.02, fullScale * value / 100), 0, fill.Size.Y.Scale, 0)
	if animate == false then fill.Size = target else Tween(fill, 0.8, { Size = target }, Enum.EasingStyle.Quart) end
	if valueLabel then
		local v = Instance.new("NumberValue"); v.Value = old
		v.Changed:Connect(function(x) valueLabel.Text = string.format("%d / 100", math.floor(x + 0.5)) end)
		Tween(v, 0.8, { Value = value }, Enum.EasingStyle.Quart).Completed:Connect(function() v:Destroy() end)
	end
	if math.floor(value / 10) > math.floor(old / 10) then Bar.levelUp() end
end

function Bar.levelUp()
	Sound.play("LevelUp")
	if fill then
		local flash = fill:Clone()
		flash.Name = "Flash"; flash.ImageColor3 = Color3.new(1, 1, 1); flash.ImageTransparency = 0.2
		flash:ClearAllChildren(); flash.Parent = fill.Parent
		Tween(flash, 0.6, { ImageTransparency = 1 }).Completed:Connect(function() flash:Destroy() end)
	end
	if plant then
		local s = plant:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", plant)
		s.Scale = 1.35
		Tween(s, 0.6, { Scale = 1 }, Enum.EasingStyle.Elastic)
	end
	if background then Effects.sparkles(background, 14, Color3.fromRGB(200, 255, 140)) end
end

return Bar
