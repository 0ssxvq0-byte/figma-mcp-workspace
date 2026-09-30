-- Plays UI sounds by name (IDs live in UIConfig.Sounds). Missing IDs are silently skipped.
local SoundService = game:GetService("SoundService")
local Debris = game:GetService("Debris")
local Config = require(script.Parent.UIConfig)

local Sound = {}
local templates = {}
local last = {}

function Sound.play(name, pitch, minGap)
	local id = Config.Sounds[name]
	if not id or id == 0 then return end
	local now = os.clock()
	if minGap and last[name] and now - last[name] < minGap then return end
	last[name] = now
	local t = templates[name]
	if not t then
		t = Instance.new("Sound")
		t.SoundId = "rbxassetid://" .. tostring(id)
		t.Volume = Config.Volume[name] or Config.DefaultVolume
		templates[name] = t
	end
	local s = t:Clone()
	s.PlaybackSpeed = pitch or (0.96 + math.random() * 0.08)   -- a little variation so repeats don't sound robotic
	s.Parent = SoundService
	s:Play()
	Debris:AddItem(s, math.max(2, (s.TimeLength or 1) + 0.5))
end

return Sound
