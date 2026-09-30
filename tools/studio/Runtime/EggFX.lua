-- 3D egg feedback in the terrarium/incubator (no screen overlay):
--   growing egg: gentle wobble when hovered
--   ready egg:   stronger shakes every second or so, a soft white glow pulse
--   hatch:       hard shake -> white flash -> your crack animation -> creature pops out
--
--   local fx = EggFX.new(eggModel)
--   fx:setReady(true)
--   fx:hatch(creatureModel, { onCrack = function() playYourCrackAnimation() end, onRevealed = function() openHatchReveal() end })
local RunService = game:GetService("RunService")
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)

local EggFX = {}
EggFX.__index = EggFX

function EggFX.new(egg)
	local self = setmetatable({ egg = egg, base = egg:GetPivot(), ready = false }, EggFX)
	local part = egg:IsA("Model") and (egg.PrimaryPart or egg:FindFirstChildWhichIsA("BasePart", true)) or egg
	local click = part:FindFirstChildOfClass("ClickDetector") or Instance.new("ClickDetector")
	click.MaxActivationDistance = 40
	click.Parent = part
	click.MouseHoverEnter:Connect(function() if not self.ready then self:shake(0.6, 4, 14) end end)
	self.highlight = Instance.new("Highlight")
	self.highlight.FillColor = Color3.new(1, 1, 1)
	self.highlight.OutlineColor = Color3.new(1, 1, 1)
	self.highlight.FillTransparency = 1
	self.highlight.OutlineTransparency = 1
	self.highlight.Parent = egg
	return self
end

-- rock the egg side to side: duration (s), angle (degrees), speed
function EggFX:shake(duration, angle, speed)
	if self.shaking then return end
	self.shaking = true
	local t = 0
	local conn
	conn = RunService.RenderStepped:Connect(function(dt)
		t += dt
		local fade = 1 - math.clamp(t / duration, 0, 1)
		local a = math.sin(t * speed) * math.rad(angle) * fade
		self.egg:PivotTo(self.base * CFrame.Angles(0, 0, a) * CFrame.Angles(a * 0.4, 0, 0))
		if t >= duration then
			conn:Disconnect()
			self.egg:PivotTo(self.base)
			self.shaking = false
		end
	end)
	Sound.play("EggShake", nil, 0.3)
end

function EggFX:setReady(on)
	self.ready = on
	if on and not self.loop then
		self.loop = task.spawn(function()
			while self.ready and self.egg.Parent do
				self:shake(0.7, 10, 30)
				Tween(self.highlight, 0.35, { OutlineTransparency = 0.2, FillTransparency = 0.75 }, Enum.EasingStyle.Sine, Enum.EasingDirection.Out, 0, true)
				task.wait(1.3 + math.random() * 0.6)
			end
			self.loop = nil
		end)
	end
end

function EggFX:hatch(creature, opts)
	opts = opts or {}
	self.ready = false
	-- 1. hard shake
	self.shaking = false
	self:shake(0.8, 16, 45)
	task.wait(0.8)
	-- 2. white flash
	Tween(self.highlight, 0.15, { FillTransparency = 0, OutlineTransparency = 0 }).Completed:Wait()
	-- 3. your 3D crack animation on the egg model
	if opts.onCrack then opts.onCrack() end
	Sound.play("EggHatch")
	-- 4. creature pops out where the egg was
	local pivot = self.base
	self.egg.Parent = nil
	if creature then
		creature:PivotTo(pivot)
		local size = Instance.new("NumberValue")
		size.Value = 0.2
		size.Changed:Connect(function(v) creature:ScaleTo(math.max(0.05, v)) end)
		creature:ScaleTo(0.2)
		creature.Parent = workspace
		Tween(size, 0.45, { Value = 1 }, Enum.EasingStyle.Back).Completed:Connect(function() size:Destroy() end)
		local att = Instance.new("Attachment")
		att.Parent = creature.PrimaryPart or creature:FindFirstChildWhichIsA("BasePart", true)
		local sparks = Instance.new("ParticleEmitter")
		sparks.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		sparks.LightEmission = 1
		sparks.Speed = NumberRange.new(6, 12)
		sparks.Lifetime = NumberRange.new(0.4, 0.8)
		sparks.Size = NumberSequence.new(0.6, 0)
		sparks.SpreadAngle = Vector2.new(180, 180)
		sparks.Enabled = false
		sparks.Parent = att
		sparks:Emit(40)
		game:GetService("Debris"):AddItem(att, 2)
	end
	task.wait(0.5)
	if opts.onRevealed then opts.onRevealed() end
end

return EggFX
