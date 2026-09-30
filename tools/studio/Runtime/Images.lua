-- Every UI image lives on one of a few sprite sheets. Each ImageLabel remembers its sheet (attribute "Sheet")
-- and its crop (ImageRectOffset / ImageRectSize). This fills in the sheet IDs you pasted into UI_Core.SheetIds.
--
-- In Studio's command bar, to see the images while editing (run once after pasting the IDs):
--   require(game.StarterGui.UI_Core.Runtime.Images).applyAll(game.StarterGui)
local Images = {}
local map = require(script.Parent.ImageMap)

local function sheetFolder()
	local core = script:FindFirstAncestor("UI_Core")
	return core and core:FindFirstChild("SheetIds")
end

-- "123", "rbxassetid://123" or a full URL all work
function Images.url(sheet, ids)
	ids = ids or sheetFolder()
	local v = ids and ids:FindFirstChild(sheet)
	local n = v and tostring(v.Value):match("(%d+)%s*$")
	return n and ("rbxassetid://" .. n) or ""
end

-- point an ImageLabel/ImageButton at any exported image by its key (e.g. "00_Shared/Sparkle")
function Images.apply(gui, key)
	local e = map.images[key]
	if not e then warn("Images: unknown key " .. tostring(key)); return false end
	gui:SetAttribute("Sheet", e.sheet)
	gui:SetAttribute("ImageKey", key)
	if e.sheet ~= "Sheet_Studs" then
		gui.ImageRectOffset = Vector2.new(e.x, e.y)
		gui.ImageRectSize = Vector2.new(e.w, e.h)
	end
	gui.Image = Images.url(e.sheet)
	return true
end

-- pieces that shouldn't get a placeholder box while their sheet has no ID yet
local NO_BOX = { "Glow", "Rays", "Vine", "Sparkle", "Burst", "Dim", "Trail", "Pointer", "Tick" }
local function placeholder(d, on)
	if on then
		for _, w in ipairs(NO_BOX) do if d.Name:find(w) then return end end
		local h = 0
		for i = 1, #d.Name do h = (h * 31 + d.Name:byte(i)) % 360 end
		d.BackgroundColor3 = Color3.fromHSV(h / 360, 0.35, 0.75)
		d.BackgroundTransparency = 0.55
	elseif d:GetAttribute("Placeholder") then
		d.BackgroundTransparency = 1
	end
	d:SetAttribute("Placeholder", on or nil)
end

-- returns (images linked, images still waiting for a sheet ID, names of sheets without an ID)
function Images.applyAll(root, ids)
	ids = ids or sheetFolder() or (root:FindFirstChild("UI_Core", true) and root:FindFirstChild("UI_Core", true):FindFirstChild("SheetIds"))
	local linked, waiting, missing = 0, 0, {}
	for _, d in ipairs(root:GetDescendants()) do
		local sheet = d:GetAttribute("Sheet")
		if sheet and (d:IsA("ImageLabel") or d:IsA("ImageButton")) then
			local url = Images.url(sheet, ids)
			d.Image = url
			if url == "" then
				waiting += 1
				missing[sheet] = true
				placeholder(d, true)
			else
				linked += 1
				placeholder(d, false)
			end
		end
	end
	local names = {}
	for sheet in pairs(missing) do table.insert(names, sheet) end
	table.sort(names)
	return linked, waiting, names
end

return Images
