--[[
	BUILD A TERRARIUM UI — read me (this script is disabled; it's just notes)

	1. IMAGES: upload the PNGs in the "Sheets" folder of the ZIP (View > Asset Manager > Bulk Import).
	   Right-click each one > Copy Asset ID, and paste it into the StringValue with the same name in
	   StarterGui > UI_Core > SheetIds (Sheet_01 ... Sheet_13, Sheet_Studs). That's the only manual step.

	2. SEE THEM WHILE EDITING: paste this in the command bar (View > Command Bar) and press Enter:
	     require(game.StarterGui.UI_Core.Runtime.Images).applyAll(game.StarterGui)
	   (In Play mode the images load by themselves.)

	3. PLAY (F5). Click the HUD buttons, walk to the terrarium / Keeper / Upgrades stands and incubators,
	   and try the test keys: 1-9, 0, H, E (see UIDemo). Delete UIDemo and WorldDemo when you move to your game.

	MOVING TO YOUR GAME: copy every UI_ ScreenGui (and UI_Core) from StarterGui into your game's StarterGui,
	and TerrariumNavigation into ServerScriptService. Everything else in this place is only for testing.

	Every ScreenGui: StarterGui.UI_<Screen> > Root > pieces. Images keep their sheet in the "Sheet" attribute and
	their crop in ImageRectOffset/ImageRectSize. Text is real TextLabels. The scripts are in UI_Core.Runtime.
]]
