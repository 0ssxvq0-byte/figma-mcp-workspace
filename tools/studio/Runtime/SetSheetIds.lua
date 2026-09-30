-- Paste your 14 sheet IDs in one go (command bar, View > Command Bar):
--
--   require(game.StarterGui.UI_Core.Runtime.SetSheetIds)({
--       Sheet_01 = 111111, Sheet_02 = 222222, Sheet_03 = 333333, Sheet_04 = 444444, Sheet_05 = 555555,
--       Sheet_06 = 666666, Sheet_07 = 777777, Sheet_08 = 888888, Sheet_09 = 999999, Sheet_10 = 101010,
--       Sheet_11 = 111011, Sheet_12 = 121212, Sheet_13 = 131313, Sheet_Studs = 141414,
--   })
--
-- It writes the IDs into UI_Core.SheetIds and shows the images in Studio's edit view straight away.
local Images = require(script.Parent.Images)

return function(ids)
	local core = script:FindFirstAncestor("UI_Core")
	local folder = core and core:FindFirstChild("SheetIds")
	if not folder then warn("SetSheetIds: UI_Core.SheetIds not found"); return end
	for name, id in pairs(ids) do
		local v = folder:FindFirstChild(name)
		if v then v.Value = tostring(id) else warn("SetSheetIds: unknown sheet " .. tostring(name)) end
	end
	local gui = core.Parent
	local linked, waiting, names = Images.applyAll(gui, folder)
	print(("SetSheetIds: %d images linked, %d still waiting"):format(linked, waiting))
	for _, n in ipairs(names) do warn("  still missing an ID: " .. n) end
end
