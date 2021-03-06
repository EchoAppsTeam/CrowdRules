(function(jQuery) {
"use strict";

// prepare Janrain object to support sharing functionality
(function() {
	if (typeof window.janrain !== 'object') window.janrain = {};
	if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};
	if (typeof window.janrain.settings.share !== 'object') window.janrain.settings.share = {};
	if (typeof window.janrain.settings.packages !== 'object') janrain.settings.packages = [];
	janrain.settings.packages.push('share');
	janrain.ready = true;
})();

var $ = jQuery;

var plugin = Echo.Plugin.manifest("Vote", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"engine": "likes", // likes || flags
	"readOnly": false, // if 'readOnly' is true then user cannot vote
	"launcher": $.noop,
	"sharing": {}
};

plugin.labels = {
	"vote": "Vote",
	"voted": "Voted",
	"unvote": "Unvote"
};

plugin.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() {
			(this.deferredActivity || $.noop)();
			delete this.deferredActivity;
		}
	}
};

plugin.init = function() {
	if (!this.component.isRoot()) return false;
	this.set("engine", this._getEngineData());
	this.extendTemplate("insertAfter", "avatar", plugin.templates.main);
};

plugin.dependencies = [{
	"loaded": function() { return !!window.janrain.engage; },
	// TODO: replace appName with '{config:appName}'-style placeholder
	"url": (document.location.protocol === 'https:')
		? "https://rpxnow.com/js/lib/cnbc-echo/widget.js"
		: "http://widget-cdn.rpxnow.com/js/lib/cnbc-echo/widget.js"
}];

plugin.templates.main =
	'<div class="{plugin.class:container}">' +
		'<div class="{plugin.class:votesCount} badge"></div>' +
		'<div class="{plugin.class:vote} btn btn-mini btn-primary">{plugin.label:vote}</div>' +
	'</div>';

plugin.renderers.vote = function(element) {
	var self = this, item = this.component;
	if (this.config.get("readOnly")) {
		return element.hide();
	}
	var voted = this._hasVoted();
	element.off("click").off("hover");
	if (!item.user.is("logged") || this.config.get("readOnly")) {
		this.config.get("launcher")(element);
		return element.off("click.deferred").on("click.deferred", function() {
			self.deferredActivity = function() {
				if (self._hasVoted()) return;
				self._sendActivity(self.get("engine.action"), item);
			};
		}).css({"opacity": 0.3});
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
				self._sendActivity(self.get("engine.cancel"), item);
			});
	} else {
		element.removeClass("btn-success btn-danger active")
			.on("click", function() {
				self._sendActivity(self.get("engine.action"), item);
			});
	}
	return element;
};

plugin.renderers.votesCount = function(element) {
	var voted = this._hasVoted();
	var votesCount = this.component.get("data.object.accumulators." + this.get("engine.key") + "Count", 0);
	var cssClass = voted && !this.config.get("readOnly")
		? "btn-success"
		: (votesCount ? "btn-primary" : "");
	if (cssClass) element.addClass(cssClass);
	else element.removeClass("btn-success btn-primary");
	return element
		.empty()
		.append(votesCount);
};

plugin.methods._getEngineData = function() {
	return {
		"likes": {
			"key": "likes",
			"action": "Like",
			"cancel": "Unlike",
			"sharingActions": ["Like"]
		},
		"flags": {
			"key": "flags",
			"action": "Flag",
			"cancel": "Unflag",
			"sharingActions": ["Flag"]
		}
	}[this.config.get("engine")];
};

plugin.methods._hasVoted = function() {
	var hasVoted = false, item = this.component;
	$.each(item.get("data.object." + this.get("engine.key")), function(key, entry) {
		if (item.user.has("identity", entry.actor.id)) {
			hasVoted = true;
			return false;
		}
	});
	return hasVoted;
};

plugin.methods._sendRequest = function(data, callback, errorCallback) {
	Echo.StreamServer.API.request({
		"endpoint": "submit",
		"secure": this.config.get("useSecureAPI", false, true),
		"submissionProxyURL": this.component.config.get("submissionProxyURL"),
		"onData": callback,
		"onError": errorCallback,
		"data": data
	}).send();
};

plugin.methods._sendActivity = function(name, item, actor) {
	var plugin = this;
	var activity = this._prepareActivity.apply(this, arguments);
	this._sendRequest({
		"content": activity,
		"appkey": item.config.get("appkey"),
		"sessionID": item.user.get("sessionID"),
		"target-query": item.config.get("parent.query")
	}, function(response) {
		plugin._publishEventComplete({
			"name": name,
			"state": "Complete",
			"response": response
		});
		plugin.requestDataRefresh();
		if (plugin._isSharingEnabled(name)) {
			plugin._shareVote(item);
		}
	}, function(response) {
		plugin._publishEventComplete({
			"name": name,
			"state": "Error",
			"response": response
		});
	});
};

plugin.methods._prepareActivity = function(name, item, actor) {
	var activity = {
		"verbs": ["http://activitystrea.ms/schema/1.0/" + name.toLowerCase()],
		"targets": [{"id": item.get("data.object.id")}]
	};
	if (actor && actor.id) {
		activity.author = actor.id;
	}
	return activity;
};

plugin.methods._isSharingEnabled = function(action) {
	return janrain && janrain.ready && ~$.inArray(action, this.get("engine.sharingActions"));
};

plugin.methods._shareVote = function(item) {
	var activity = janrain.engage.share;
	// TODO: handle $.paseJSON exceptions
	var data = $.parseJSON(item.get("data.object.content"));
	activity.setMessage(this.substitute({
		"template": this.config.get("sharing.activity.content"),
		"data": $.extend({
			"domain": window.location.host
		}, data)
	}));
	activity.setUrl(this.config.get("sharing.activity.url", window.location.href));
	activity.setDescription(this.config.get("sharing.activity.page.description"));
	activity.setTitle(this.config.get("sharing.activity.page.title"));
	activity.show();
};

plugin.methods._publishEventComplete = function(args) {
	var item = this.component;
	this.events.publish({
		"topic": "on" + args.name + args.state,
		"data": {
			"item": {
				"data": item.get("data"),
				"target": item.config.get("target")
			},
			"response": args.response
		}
	});
};

plugin.css =
	'.{plugin.class:container} { width: 53px; text-align: center; padding-top: 10px; }' +
	'.{plugin.class:votesCount} { margin-bottom: 5px; }'

Echo.Plugin.create(plugin);

})(Echo.jQuery);
