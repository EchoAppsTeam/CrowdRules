(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("ItemWinner", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onDataReceive": function(_, args) {
		if (args.type === "initial") {
			// add flag to first item
			args.entries[0].winner = true
		}
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("ItemWinner", "Echo.StreamServer.Controls.Stream.Item");

plugin.config = {
	"cssClass": ""
};

plugin.component.renderers.container = function(element) {
	this.parentRenderer("container", arguments);
	if (this.component.get("data.winner")) {
		element.addClass(this.config.get("cssClass"));
	};
	return element;
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
