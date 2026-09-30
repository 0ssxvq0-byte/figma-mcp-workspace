-- Small TweenService helper: Tween(obj, time, props, style?, direction?, repeats?, reverses?) -> Tween (already playing)
local TweenService = game:GetService("TweenService")
return function(obj, t, props, style, dir, repeats, reverses)
	local tw = TweenService:Create(obj, TweenInfo.new(t, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out, repeats or 0, reverses or false), props)
	tw:Play()
	return tw
end
