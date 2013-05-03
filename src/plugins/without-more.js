(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("WithoutMore", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {};

plugin.init = function() {};

plugin.component.renderers.more = function(element)  {
	return element.hide();
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
