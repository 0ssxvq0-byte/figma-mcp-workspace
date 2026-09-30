-- Server side of the HUD travel buttons (Script in ServerScriptService).
-- My Terrarium -> the player's own terrarium, Shop -> the Keeper, Upgrades -> the upgrades NPC.
-- Edit getDestination() to match how your plots and NPCs are named.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local remote = Instance.new("RemoteEvent")
remote.Name = "TerrariumTravel"
remote.Parent = ReplicatedStorage

local function getDestination(player, where)
	if where == "Terrarium" then
		-- e.g. workspace.Plots.<PlayerName>.Spawn  (a part in front of the player's terrarium)
		local plots = workspace:FindFirstChild("Plots")
		local plot = plots and plots:FindFirstChild(player.Name)
		return plot and plot:FindFirstChild("Spawn")
	elseif where == "Keeper" then
		return workspace:FindFirstChild("NPCs") and workspace.NPCs:FindFirstChild("KeeperStand")
	elseif where == "Upgrades" then
		return workspace:FindFirstChild("NPCs") and workspace.NPCs:FindFirstChild("UpgradesStand")
	end
end

local lastUse = {}
remote.OnServerEvent:Connect(function(player, where)
	if typeof(where) ~= "string" then return end
	if lastUse[player] and os.clock() - lastUse[player] < 1 then return end   -- no spamming
	lastUse[player] = os.clock()
	local target = getDestination(player, where)
	local char = player.Character
	if target and char and char.PrimaryPart then
		char:PivotTo(target.CFrame + Vector3.new(0, 3, 0))
	end
end)

game:GetService("Players").PlayerRemoving:Connect(function(p) lastUse[p] = nil end)
