--[[
	ResolveImageIds (run once in Studio's COMMAND BAR, View > Command Bar)

	upload_assets.py gives Decal IDs. ImageLabels need the Image ID inside each Decal.
	This loads every Decal, reads its image, and writes ReplicatedStorage.TerrariumUI.Modules.AssetIds for you.

	Before running: ReplicatedStorage.TerrariumUI.Modules must contain AssetIds_Decals (from upload_assets.py)
	and an AssetIds ModuleScript (any content; it is overwritten). Rojo sets both up for you.
]]
local InsertService = game:GetService("InsertService")
local modules = game:GetService("ReplicatedStorage"):WaitForChild("TerrariumUI"):WaitForChild("Modules")
local decals = require(modules:WaitForChild("AssetIds_Decals"))

local keys = {}
for key in pairs(decals) do table.insert(keys, key) end
table.sort(keys)

local out, failed = {}, {}
for i, key in ipairs(keys) do
	local ok, model = pcall(InsertService.LoadAsset, InsertService, decals[key])
	local texture
	if ok and model then
		local decal = model:FindFirstChildWhichIsA("Decal", true)
		texture = decal and decal.Texture
		model:Destroy()
	end
	local id = texture and texture:match("%d+")
	if id then
		table.insert(out, string.format("\t[%q] = \"rbxassetid://%s\",", key, id))
	else
		table.insert(failed, key)
		table.insert(out, string.format("\t[%q] = \"rbxassetid://%d\", -- could not resolve; this is the Decal ID", key, decals[key]))
	end
	if i % 25 == 0 then print(("ResolveImageIds: %d / %d"):format(i, #keys)) task.wait() end
end

local target = modules:FindFirstChild("AssetIds") or Instance.new("ModuleScript")
target.Name = "AssetIds"
target.Source = "-- Image IDs for every exported asset (written by ResolveImageIds)\nreturn {\n" .. table.concat(out, "\n") .. "\n}\n"
target.Parent = modules
print(("ResolveImageIds: wrote %d IDs, %d failed"):format(#keys - #failed, #failed))
for _, k in ipairs(failed) do warn("Not resolved: " .. k) end
