(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("VideoContent", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.component.renderers.text = function(element) {
	var text = this.component.get("data.object.content");
	var data, el, self = this;
	// FIXME: remove try/catch before production init
	try {
		data = $.parseJSON(text);
		el = $(this.substitute({
			"template": plugin.templates.content,
			"data": data
		}));
		$(this.substitute({"template": ".{plugin.class:business-name}"}), el).click(function() {
			self.events.publish({
				"topic": "onPermalinkOpen",
				"data": {
					"item": self.component
				}
			});
		});
	} catch (ex) {
	}
	return element.empty().append(
		data
			? el
			: text
	);
};

plugin.templates.content =
	'<div class="{plugin.class:container}">' +
		'<div class="{plugin.class:business-name} echo-linkColor">{data:businessName}</div>' +
		'<div class="{plugin.class:posted-by}">Posted by: <span class="echo-linkColor">{data:user}</span></div>' +
		'<div class="{plugin.class:embed-code}">{data:media}</div>' +
		'<div class="{plugin.class:description}">{data:description}</div>' +
	'</div>';

plugin.css =
	'.{plugin.class:business-name} { font: 16px Arial; line-height: 18px; font-weight: bold; cursor: pointer; }' +
	'.{plugin.class:posted-by} { line-height: 16px; }' +
	'.{plugin.class:embed-code} { margin: 3px 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
