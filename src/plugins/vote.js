(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("Vote", "Echo.StreamServer.Controls.Stream.Item.Vote");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {};

plugin.labels = {};

plugin.css = '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
