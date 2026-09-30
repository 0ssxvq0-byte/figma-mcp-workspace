-- Build a Terrarium UI settings. Fill in the sound IDs (see README "Sound effects" for what to search for).
return {
	Sounds = {
		Hover = 0,          -- soft tick when the mouse moves onto a button
		Click = 0,          -- bubbly pop on press
		Open = 0,           -- whoosh when a panel slides up
		Close = 0,          -- short reverse whoosh
		Notify = 0,         -- light chime for toasts
		Banner = 0,         -- drum hit / horn for the Wilds banners
		CoinGain = 0,       -- coin clink(s) for Shillings gained
		CoinSpend = 0,      -- softer clink for Shillings spent
		LevelUp = 0,        -- rising sparkle for a Bioactivity milestone
		Scroll = 0,         -- very quiet tick while scrolling
		EggShake = 0,       -- wooden rattle for eggs
		EggHatch = 0,       -- crack + sparkle burst
		RareHatch = 0,      -- fanfare for Legendary / Mythic
		Error = 0,          -- low buzz for "not enough Shillings" etc.
		Equip = 0,          -- click-thunk for equipping backdrops
		Claim = 0,          -- reward jingle for Daily Rewards
	},
	Volume = { Hover = 0.25, Scroll = 0.15, Click = 0.5 },  -- anything missing uses DefaultVolume
	DefaultVolume = 0.5,

	-- motion
	PanelOpenTime = 0.45,
	PanelCloseTime = 0.3,
	HoverScale = 1.06,
	PressScale = 0.9,
	RaySpeed = 18,               -- degrees per second
	ToastTime = 3,
	BannerTime = 4,
	HudFadeTransparency = 0.6,   -- how see-through the HUD gets while editing the terrarium

	-- the RemoteEvent the HUD uses to travel (created by the TerrariumNavigation server script)
	TravelRemote = "TerrariumTravel",
}
