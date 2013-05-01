(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("AlphabeticalSorter", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.labels = {};

plugin.init = function() {};

plugin.css = '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
