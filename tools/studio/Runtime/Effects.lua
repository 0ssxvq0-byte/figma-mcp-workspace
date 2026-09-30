-- Ambient UI motion: rotating rays, bouncing badges, tilting quantity labels, sparkles, and stroke scaling.
local RunService = game:GetService("RunService")
local Tween = require(script.Parent.Tween)
local Config = require(script.Parent.UIConfig)
local Images = require(script.Parent.Images)

local Effects = {}
local spinners = {}

local function track(gui)
	if gui:GetAttribute("Spin") then spinners[gui] = true end
	if gui:GetAttribute("Bounce") and not gui:GetAttribute("BounceOn") then
		gui:SetAttribute("BounceOn", true)
		local s = gui.Size
		Tween(gui, 0.55, { Size = UDim2.new(s.X.Scale * 1.12, 0, s.Y.Scale * 1.12, 0) }, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
	end
	if gui:GetAttribute("Tilt") and not gui:GetAttribute("TiltOn") then
		gui:SetAttribute("TiltOn", true)
		gui.Rotation = -9
		Tween(gui, 1.2, { Rotation = 9 }, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
	end
end

-- keep outlines the same weight on every screen size (BuildUI stores the 1080p thickness)
local function rescaleStrokes(root, k)
	for _, d in ipairs(root:GetDescendants()) do
		if d:IsA("UIStroke") and d:GetAttribute("BaseThickness") then
			d.Thickness = math.max(1, d:GetAttribute("BaseThickness") * k)
		end
	end
end

function Effects.start(playerGui)
	local function scan(root)
		for _, d in ipairs(root:GetDescendants()) do if d:IsA("GuiObject") then track(d) end end
		root.DescendantAdded:Connect(function(d) if d:IsA("GuiObject") then task.defer(track, d) end end)
	end
	for _, sg in ipairs(playerGui:GetChildren()) do if sg:IsA("ScreenGui") then scan(sg) end end
	playerGui.ChildAdded:Connect(function(sg) if sg:IsA("ScreenGui") then scan(sg) end end)

	RunService.RenderStepped:Connect(function(dt)
		for gui in pairs(spinners) do
			if gui.Parent then
				if gui.Visible then gui.Rotation = (gui.Rotation + Config.RaySpeed * dt) % 360 end
			else
				spinners[gui] = nil
			end
		end
	end)

	local camera = workspace.CurrentCamera
	local function onResize()
		local k = camera.ViewportSize.Y / 1080
		for _, sg in ipairs(playerGui:GetChildren()) do if sg:IsA("ScreenGui") then rescaleStrokes(sg, k) end end
	end
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(onResize)
	onResize()
end

-- a burst of sparkles over a frame (reward screens, level ups, hatches)
function Effects.sparkles(parent, count, color)
	for _ = 1, count or 12 do
		local s = Instance.new("ImageLabel")
		s.Name = "Sparkle"
		s.BackgroundTransparency = 1
		Images.apply(s, "00_Shared/Sparkle")
		s.ImageColor3 = color or Color3.new(1, 1, 1)
		s.AnchorPoint = Vector2.new(0.5, 0.5)
		s.Position = UDim2.fromScale(0.5 + (math.random() - 0.5) * 0.3, 0.5 + (math.random() - 0.5) * 0.3)
		s.Size = UDim2.fromScale(0, 0)
		s.ZIndex = 30
		local c = Instance.new("UIAspectRatioConstraint"); c.Parent = s
		s.Parent = parent
		local size = 0.06 + math.random() * 0.08
		local dest = UDim2.fromScale(math.random(), math.random())
		Tween(s, 0.25, { Size = UDim2.fromScale(size, size) }, Enum.EasingStyle.Back)
		Tween(s, 0.9, { Position = dest, Rotation = math.random(-180, 180) })
		task.delay(0.45, function()
			Tween(s, 0.45, { ImageTransparency = 1, Size = UDim2.fromScale(0, 0) }).Completed:Wait()
			s:Destroy()
		end)
	end
end

-- gentle twinkling stars that loop while `parent` is visible (Day 7 card, Hatch Reveal window)
function Effects.twinkle(parent, count)
	for _ = 1, count or 8 do
		task.spawn(function()
			local s = Instance.new("ImageLabel")
			s.BackgroundTransparency = 1
			Images.apply(s, "00_Shared/Sparkle")
			s.AnchorPoint = Vector2.new(0.5, 0.5)
			s.ZIndex = 30
			local c = Instance.new("UIAspectRatioConstraint"); c.Parent = s
			s.Parent = parent
			while s.Parent do
				s.Position = UDim2.fromScale(math.random(), math.random())
				local size = 0.03 + math.random() * 0.05
				s.Size = UDim2.fromScale(0, 0); s.ImageTransparency = 0
				Tween(s, 0.5, { Size = UDim2.fromScale(size, size), Rotation = s.Rotation + 90 }, Enum.EasingStyle.Sine)
				task.wait(0.5 + math.random())
				Tween(s, 0.5, { ImageTransparency = 1, Size = UDim2.fromScale(0, 0) }).Completed:Wait()
				task.wait(math.random() * 1.5)
			end
		end)
	end
end

return Effects
