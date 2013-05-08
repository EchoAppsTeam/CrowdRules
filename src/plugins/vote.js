(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("Vote", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"readOnly": false, // if 'readOnly' is true then user cannot vote
	"launcher": $.noop,
	"sharing": {},
	"sharingActions": ["Like"]
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

plugin.dependencies = [{
	"loaded": function() { return !!window.RPXNOW; },
	"url": ("https:" === document.location.protocol ?
		"https://" : "http://static.") + "rpxnow.com/js/lib/rpx.js"
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
	var cssClass = voted && !this.config.get("readOnly")
		? "btn-success"
		: (votesCount ? "btn-primary" : "");
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
	var activity = {
		"verbs": ["http://activitystrea.ms/schema/1.0/" + name.toLowerCase()],
		"targets": [{"id": item.get("data.object.id")}]
	};
	if (actor && actor.id) {
		activity.author = actor.id;
	}

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
		if (plugin._isSharingEnabled(name)) {
			plugin._shareContent(item);
		}
		plugin.requestDataRefresh();
	}, function(response) {
		plugin._publishEventComplete({
			"name": name,
			"state": "Error",
			"response": response
		});
	});
};

plugin.methods._isSharingEnabled = function(action) {
	return ~$.inArray(action, this.config.get("sharingActions"))
		 && this.config.get("sharing.appId") && this.config.get("sharing.xdReceiver");
};

plugin.methods._shareContent = function(item) {
	var self = this;
	RPXNOW.init({
		"appId": self.config.get("sharing.appId"),
		"xdReceiver": self.config.get("sharing.xdReceiver")
	});
	RPXNOW.loadAndRun(["Social"], function() {
		var activity = new RPXNOW.Social.Activity(
			self.config.get("sharing.activity.prompt"),
			self._prepareSharingContent(item),
			self.config.get("sharing.activity.url", window.location.href)
		);
		RPXNOW.Social.publishActivity(self._prepareSharingActivity(activity));
	});
};

plugin.methods._prepareSharingContent = function(item) {
	var content = $.parseJSON(item.get("data.object.content"));
	return this.substitute({
		"template": this.config.get("sharing.activity.content"),
		"data": $.extend({
			"domain": window.location.host
		}, content)
	});
};

plugin.methods._prepareSharingActivity = function(activity) {
	activity.setDescription(this.config.get("sharing.activity.page.description"));
	activity.setTitle(this.config.get("sharing.activity.page.title"));
	return activity;
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
