-- Small semi-transparent pop-ups that float over an incubator (or the creature/egg on it).
-- Cloned from the templates in UI_Incubator into a BillboardGui. They pop in when shown and out when hidden.
--
--   local popup = IncubatorPopup.new(incubatorPart)
--   popup:set("Incubating", { title = "Moss Egg", rarity = "COMMON", timeLeft = "2m 14s", progress = 0.62, skipPrice = 15 })
--   popup:set("Ready", { title = "Moss Egg" })          popup:set("Locked", { title = "Incubator 3", cost = "50K" })
--   popup:show() / popup:hide()                         popup.onAction:Connect(function(state) ... end)  -- Skip / Hatch / Unlock
local Tween = require(script.Parent.Tween)
local Sound = require(script.Parent.Sound)

local IncubatorPopup = {}
IncubatorPopup.__index = IncubatorPopup
local templates

local HEADER = { Incubating = "Header_Incubating", Ready = "Header_Ready", Locked = "Header_Locked" }
local BUTTON = { Incubating = "Btn_Skip", Ready = "Btn_Hatch", Locked = "Btn_Unlock" }

function IncubatorPopup.init(playerGui)
	local sg = playerGui:WaitForChild("UI_Incubator")
	sg.Enabled = false
	templates = {}
	for _, h in ipairs(sg.Root:GetChildren()) do
		for state, header in pairs(HEADER) do
			if h:FindFirstChild(header, true) then templates[state] = h end
		end
	end
end

function IncubatorPopup.new(adornee)
	local self = setmetatable({}, IncubatorPopup)
	local bb = Instance.new("BillboardGui")
	bb.Name = "IncubatorPopup"
	bb.Adornee = adornee
	bb.Size = UDim2.fromScale(6, 3.8)            -- studs; matches the 300 x 190 design
	bb.StudsOffset = Vector3.new(0, 4.5, 0)
	bb.LightInfluence = 0
	bb.AlwaysOnTop = true
	bb.MaxDistance = 40
	bb.ResetOnSpawn = false
	bb.Enabled = false
	bb.Parent = game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")
	self.gui = bb
	self.scale = Instance.new("UIScale")
	self.event = Instance.new("BindableEvent")
	self.onAction = self.event.Event
	return self
end

local function textsIn(g)
	local list = {}
	for _, d in ipairs(g:GetDescendants()) do if d:IsA("TextLabel") then table.insert(list, d) end end
	table.sort(list, function(a, b)
		if math.abs(a.AbsolutePosition.Y - b.AbsolutePosition.Y) > 4 then return a.AbsolutePosition.Y < b.AbsolutePosition.Y end
		return a.AbsolutePosition.X < b.AbsolutePosition.X
	end)
	return list
end

function IncubatorPopup:set(state, data)
	data = data or {}
	if self.state ~= state then
		if self.card then self.card:Destroy() end
		local card = templates[state]:Clone()
		card.AnchorPoint = Vector2.new(0.5, 0.5)
		card.Position = UDim2.fromScale(0.5, 0.5)
		card.Size = UDim2.fromScale(1, 1)
		card.Visible = true
		self.scale.Parent = card
		card.Parent = self.gui
		self.card, self.state = card, state
		local btn = card:FindFirstChild(BUTTON[state], true)
		if btn then btn.Activated:Connect(function() Sound.play("Click"); self.event:Fire(state) end) end
		self.fill = card:FindFirstChild("Bar_Fill_Gold_9Slice", true) or card:FindFirstChild("Bar_Fill_Green_9Slice", true)
	end
	-- text order in each template: header title (+ rarity chip), then timer/cost, then button label
	local t = textsIn(self.card)
	if data.title and t[1] then t[1].Text = data.title end
	if state == "Incubating" then
		if data.rarity and t[2] then t[2].Text = data.rarity end
		if data.timeLeft and t[3] then t[3].Text = data.timeLeft end
		if data.skipPrice and t[#t] then t[#t].Text = tostring(data.skipPrice) end
		if self.fill and data.progress then
			self.fullX = self.fullX or self.fill.Size.X.Scale / 0.62
			Tween(self.fill, 0.3, { Size = UDim2.fromScale(self.fullX * math.clamp(data.progress, 0.03, 1), self.fill.Size.Y.Scale) })
		end
	elseif state == "Locked" and data.cost then
		for _, l in ipairs(t) do if l.Text:match("%d") and l ~= t[1] then l.Text = data.cost end end
	end
end

function IncubatorPopup:show()
	if self.gui.Enabled then return end
	self.gui.Enabled = true
	self.scale.Scale = 0.5
	Tween(self.scale, 0.3, { Scale = 1 }, Enum.EasingStyle.Back)
end

function IncubatorPopup:hide()
	if not self.gui.Enabled then return end
	Tween(self.scale, 0.18, { Scale = 0 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In).Completed:Connect(function()
		self.gui.Enabled = false
	end)
end

-- show only while the local player is within `range` studs
function IncubatorPopup:autoShow(range)
	task.spawn(function()
		local player = game:GetService("Players").LocalPlayer
		while self.gui.Parent do
			local char = player.Character
			local root = char and char:FindFirstChild("HumanoidRootPart")
			local adornee = self.gui.Adornee
			if root and adornee then
				local pos = adornee:IsA("Model") and adornee:GetPivot().Position or adornee.Position
				if (root.Position - pos).Magnitude <= (range or 14) then self:show() else self:hide() end
			end
			task.wait(0.2)
		end
	end)
end

function IncubatorPopup:destroy() self.gui:Destroy() end

return IncubatorPopup
