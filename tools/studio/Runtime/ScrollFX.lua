-- Smooth mouse-wheel scrolling, a custom scrollbar using the exported track/thumb, a soft tick sound,
-- and cards that pop in as they scroll into view. Call ScrollFX.attach(scrollingFrame) on each list.
local UserInputService = game:GetService("UserInputService")
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)

local ScrollFX = {}

function ScrollFX.attach(frame, assets)
	frame.ScrollBarThickness = 0
	frame.ElasticBehavior = Enum.ElasticBehavior.Always
	frame.ScrollingDirection = Enum.ScrollingDirection.Y
	frame.ScrollBarImageTransparency = 1
	-- custom scrollbar beside the list
	local track = Instance.new("ImageLabel")
	track.Name = "ScrollTrack"; track.BackgroundTransparency = 1
	track.Image = assets and assets["00_Shared/Scrollbar_Track"] or ""
	track.ScaleType = Enum.ScaleType.Slice; track.SliceCenter = Rect.new(4, 4, 4, 4)
	track.AnchorPoint = Vector2.new(0, 0); track.Size = UDim2.new(0, 8, 1, 0); track.Position = UDim2.new(1, 6, 0, 0)
	track.Parent = frame.Parent
	local thumb = track:Clone(); thumb.Name = "ScrollThumb"
	thumb.Image = assets and assets["00_Shared/Scrollbar_Thumb"] or ""
	thumb.Position = UDim2.fromScale(0, 0); thumb.Size = UDim2.fromScale(1, 0.3); thumb.Parent = track
	track.Position = UDim2.new(frame.Position.X.Scale + frame.Size.X.Scale, 6, frame.Position.Y.Scale, 0)
	track.Size = UDim2.new(0, 8, frame.Size.Y.Scale, frame.Size.Y.Offset)

	local lastTick = 0
	local function update()
		local canvas = frame.AbsoluteCanvasSize.Y
		local view = frame.AbsoluteWindowSize.Y
		local frac = canvas > view and view / canvas or 1
		thumb.Size = UDim2.fromScale(1, frac)
		local maxY = math.max(1, canvas - view)
		thumb.Position = UDim2.fromScale(0, (1 - frac) * math.clamp(frame.CanvasPosition.Y / maxY, 0, 1))
		if math.abs(frame.CanvasPosition.Y - lastTick) > 90 then
			lastTick = frame.CanvasPosition.Y
			Sound.play("Scroll", nil, 0.06)
		end
	end
	frame:GetPropertyChangedSignal("CanvasPosition"):Connect(update)
	frame:GetPropertyChangedSignal("AbsoluteCanvasSize"):Connect(update)
	update()

	-- smooth wheel scrolling on PC (touch keeps Roblox's own momentum scrolling)
	if not UserInputService.TouchEnabled then
		local target = frame.CanvasPosition.Y
		local hovering = false
		frame.MouseEnter:Connect(function() hovering = true; frame.ScrollingEnabled = false; target = frame.CanvasPosition.Y end)
		frame.MouseLeave:Connect(function() hovering = false; frame.ScrollingEnabled = true end)
		UserInputService.InputChanged:Connect(function(input)
			if hovering and input.UserInputType == Enum.UserInputType.MouseWheel then
				local maxY = math.max(0, frame.AbsoluteCanvasSize.Y - frame.AbsoluteWindowSize.Y)
				target = math.clamp(target - input.Position.Z * 120, 0, maxY)
				Tween(frame, 0.35, { CanvasPosition = Vector2.new(0, target) }, Enum.EasingStyle.Quint)
			end
		end)
	end

	-- cards pop in the first time they come into view
	local seen = {}
	local function reveal()
		local top, bottom = frame.AbsolutePosition.Y, frame.AbsolutePosition.Y + frame.AbsoluteWindowSize.Y
		for _, c in ipairs(frame:GetChildren()) do
			if c:IsA("GuiObject") and not seen[c] then
				local y = c.AbsolutePosition.Y
				if y < bottom and y + c.AbsoluteSize.Y > top then
					seen[c] = true
					local s = c:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", c)
					s.Scale = 0.85
					Tween(s, 0.3, { Scale = 1 }, Enum.EasingStyle.Back)
				end
			end
		end
	end
	frame:GetPropertyChangedSignal("CanvasPosition"):Connect(reveal)
	task.defer(reveal)
end

return ScrollFX
