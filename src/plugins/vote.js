(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("Vote", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"readOnly": false, // if 'readOnly' is true then user cannot vote
	"launcher": $.noop
};

plugin.labels = {
	"vote": "Vote",
	"voted": "Voted",
	"unvote": "Unvote"
};

plugin.init = function() {
	if (!this.component.isRoot()) return false;
	this.extendTemplate("insertAfter", "avatar", plugin.templates.main);
};

plugin.templates.main =
	'<div class="{plugin.class:container}">' +
		'<div class="{plugin.class:votesCount} badge"></div>' +
		'<div class="{plugin.class:vote} btn btn-mini btn-primary">{plugin.label:vote}</div>' +
	'</div>';

plugin.renderers.vote = function(element) {
	var self = this, item = this.component;
	var voted = this._hasVoted();
	element.off("click").off("hover");
	if (!item.user.is("logged") || this.config.get("readOnly")) {
		this.config.get("launcher")(element);
		return element.css({"opacity": 0.3});
	}
	if (voted) {
		element.removeClass("btn-primary")
			.addClass("btn-success active")
			.empty()
			.append(this.labels.get("voted"))
			.hover(function() {
				element.addClass("btn-danger")
					.removeClass("btn-success btn-primary")
					.empty().append(self.labels.get("unvote"));
			}, function() {
				element.removeClass("btn-danger")
					.addClass(voted ? "btn-success" : "btn-primary")
					.empty().append(self.labels.get("voted"));
			})
			.click(function() {
				self._sendActivity("Unlike", item);
			});
	} else {
		element.removeClass("btn-success btn-danger active")
			.on("click", function() {
				self._sendActivity("Like", item);
			});
	}
	return element;
};

plugin.renderers.votesCount = function(element) {
	var voted = this._hasVoted();
	var votesCount = this.component.get("data.object.accumulators.likesCount", 0);
	var cssClass = voted ? "btn-success" : (votesCount ? "btn-primary" : "");
	if (cssClass) element.addClass(cssClass);
	else element.removeClass("btn-success btn-primary");
	return element
		.empty()
		.append(votesCount);
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
	'.{plugin.class:container} { width: 53px; text-align: center; }' +
	'.{plugin.class:votesCount} { margin-bottom: 5px; }'

Echo.Plugin.create(plugin);

})(Echo.jQuery);
