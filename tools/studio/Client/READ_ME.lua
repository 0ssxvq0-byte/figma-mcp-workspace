--[[
	BUILD A TERRARIUM UI — START HERE (this script is disabled; it's just notes)

	THE UI IS ALREADY BUILT. It just needs its pictures linked:

	1. Save/publish this place (File > Publish to Roblox). Asset Manager needs a saved place.
	2. View > Asset Manager > Bulk Import > select the 14 PNG files from the Sheets folder.
	3. In Asset Manager, right-click each imported image > Copy Asset ID.
	4. Paste all 14 in one go: open the command bar (View > Command Bar), paste this, fill in your numbers, Enter:
	     require(game.StarterGui.UI_Core.Runtime.SetSheetIds)({
	         Sheet_01 = 0, Sheet_02 = 0, Sheet_03 = 0, Sheet_04 = 0, Sheet_05 = 0, Sheet_06 = 0, Sheet_07 = 0,
	         Sheet_08 = 0, Sheet_09 = 0, Sheet_10 = 0, Sheet_11 = 0, Sheet_12 = 0, Sheet_13 = 0, Sheet_Studs = 0,
	     })
	   (The names must match the file names. Or paste each ID by hand into StarterGui > UI_Core > SheetIds.)
	5. Press Play (F5). Open the Output window (View > Output): you should see "[UI] 'N images linked" and
	   "[UI] ready". Save the place again.

	WHAT YOU SEE BEFORE STEP 4: text, and coloured boxes where the pictures will go. That is expected.
	Studio's edit view also shows every enabled ScreenGui at once; the scripts tidy that up in Play mode.

	IN PLAY MODE: click the HUD buttons, walk to the terrarium / stands / incubators / egg, and use the test keys:
	  1 good toast  2 error toast  3 Wilds banner  4 safe banner  5 rare-hatch announcement  6 event starts
	  7 / 8 Shillings up / down  9 Bioactivity +10  0 Hatch Reveal (cycles rarities)  H Hatch Reveal, tank full
	  E egg flies into the Eggs button

	MOVING TO YOUR GAME: copy every UI_ ScreenGui (including UI_Core) into your game's StarterGui, and
	TerrariumNavigation into ServerScriptService. Delete UIDemo and WorldDemo.
]]
