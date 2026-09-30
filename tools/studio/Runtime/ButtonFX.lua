-- Hover grow, press squash and a springy release on every button, plus the click sound.
-- Buttons are centred on their spot by BuildUI, so they grow from the middle.
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)
local Config = require(script.Parent.UIConfig)

local ButtonFX = {}
local bases = setmetatable({}, { __mode = "k" })   -- each button's resting size, remembered once
local function baseOf(gui)
	bases[gui] = bases[gui] or gui.Size
	return bases[gui]
end

local function scaled(base, k)
	return UDim2.new(base.X.Scale * k, base.X.Offset * k, base.Y.Scale * k, base.Y.Offset * k)
end

function ButtonFX.attach(button)
	if not button:IsA("GuiButton") or button:GetAttribute("FXAttached") then return end
	button:SetAttribute("FXAttached", true)
	local base = baseOf(button)
	local hovering = false
	button.MouseEnter:Connect(function()
		hovering = true
		Tween(button, 0.18, { Size = scaled(base, Config.HoverScale) }, Enum.EasingStyle.Back)
		Sound.play("Hover", nil, 0.05)
	end)
	button.MouseLeave:Connect(function()
		hovering = false
		Tween(button, 0.18, { Size = base })
	end)
	button.MouseButton1Down:Connect(function()
		Tween(button, 0.07, { Size = scaled(base, Config.PressScale) })
	end)
	button.Activated:Connect(function()
		Sound.play("Click")
		-- squash, then spring past full size and settle
		Tween(button, 0.07, { Size = scaled(base, Config.PressScale) }).Completed:Wait()
		Tween(button, 0.35, { Size = scaled(base, hovering and Config.HoverScale or 1) }, Enum.EasingStyle.Back)
	end)
end

-- attach to every button under root, now and later
function ButtonFX.attachAll(root)
	for _, d in ipairs(root:GetDescendants()) do ButtonFX.attach(d) end
	root.DescendantAdded:Connect(function(d) task.defer(ButtonFX.attach, d) end)
end

-- a quick "boing" for anything (used when the Eggs button receives an egg, etc.)
function ButtonFX.pop(gui, k)
	local base = baseOf(gui)
	Tween(gui, 0.08, { Size = scaled(base, k or 1.15) }).Completed:Wait()
	Tween(gui, 0.4, { Size = base }, Enum.EasingStyle.Elastic)
end

return ButtonFX
