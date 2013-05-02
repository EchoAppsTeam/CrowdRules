(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("MarkerButton", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {};

plugin.labels = {};

plugin.init = function() {};

plugin.css = '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
