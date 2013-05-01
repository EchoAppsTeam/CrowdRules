(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("Vote", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.labels = {};

plugin.init = function() {
	if (!this.component.isRoot()) return false;
	this.extendTemplate("insertAfter", "avatar", plugin.templates.main);
};

plugin.templates.main =
	'<div class="{plugin.class:container}">' +
		'<div class="echo-clickable {plugin.class:vote}">' +
			'<i class="icon-chevron-up"></i>' +
		'</div>' +
		'<div class="{plugin.class:votesCount}"></div>' +
		'<div class="echo-clickable {plugin.class:unvote}">' +
			'<i class="icon-chevron-down"></i>' +
		'</div>' +
	'</div>';

plugin.renderers.vote = function(element) {
	var self = this, item = this.component;
	element.off("click");
	if (!item.user.is("logged") || this._hasVoted()) {
		return element.css({"opacity": 0.3});
	}
	return element.on("click", function() {
		self._sendActivity("Like", item);
	});
};

plugin.renderers.unvote = function(element) {
	var self = this, item = this.component;
	element.off("click");
	if (!item.user.is("logged") || !this._hasVoted()) {
		return element.css({"opacity": 0.3});
	}
	return element.on("click", function() {
		self._sendActivity("Unlike", item);
	});
};

plugin.renderers.votesCount = function(element) {
	return element
		.empty()
		.append(this.component.get("data.object.accumulators.likesCount", 0));
};

plugin.methods._hasVoted = function() {
	var hasVoted = false, item = this.component;
	$.each(item.get("data.object.likes"), function(key, entry) {
		if (item.user.has("identity", entry.actor.id)) {
			hasVoted = true;
			return false;
		}
	});
	return hasVoted;
};

$.map(["_sendActivity", "_sendRequest", "_publishEventComplete"], function(method) {
	plugin.methods[method] = Echo.StreamServer.Controls.Stream.Item.Plugins.Like.manifest.methods[method];
});

plugin.css =
	'.{plugin.class:vote} { text-align: center; }' +
	'.{plugin.class:unvote} { text-align: center; }' +
	'.{plugin.class:votesCount} { text-align: center; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
