(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("FinalistButton", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"name": "FinalistButton",
	"marker": "Finalist"
};

plugin.labels = {
	"unmarkedTitle": "Make a Finalist",
	"unmarkedChangingStatus": "Making a Finalist...",
	"markedTitle": "Exclude from finalists",
	"markedChangingStatus": "Excluding from finalists..."
};

plugin.init = function() {
	this.component.addButtonSpec(this.config.get("name"), this._assembleButton());
};

plugin.methods._assembleButton = function() {
	var self = this, item = this.component;
	var callback = function() {
		item.block(self.labels.get((self._isMarked() ? "marked" : "unmarked") + "ChangingStatus"))
		self._sendRequest({
			"content": self._prepareActivity(
				self._isMarked() ? "unmark" : "mark",
				"markers",
				self.config.get("marker")
			),
			"appkey": item.config.get("appkey"),
			"sessionID": item.user.get("sessionID"),
			"target-query": item.config.get("parent.query")
		}, function(response) {
			// publish onComplete event if it's necessary
			self.requestDataRefresh();
			item.unblock();
		}, function(response) {
			// publish onError event if it's necessary
			item.unblock();
		});
	};
	return function() {
		var item = this;
		return {
			"name": self.config.get("name"),
			"label": self.labels.get((self._isMarked() ? "marked" : "unmarked") + "Title"),
			"visible": item.user.is("admin") && item.isRoot(),
			"callback": callback
		}
	};
};

plugin.methods._isMarked = function() {
	var self = this, item = this.component;
	var isMarked = false;
	$.each(item.get("data.object.markers", []), function(key, marker) {
		if (marker === self.config.get("marker")) {
			isMarked = true;
			return false;
		}
	});
	return isMarked;
};

plugin.methods._prepareActivity = function(verb, type, data) {
	return (!data) ? [] : {
		"object": {
			"objectTypes": ["http://activitystrea.ms/schema/1.0/" + type],
			"content": data
		},
		"source": this.component.config.get("source"),
		"verbs": ["http://activitystrea.ms/schema/1.0/" + verb],
		"targets": [{
			"id": this.component.get("data.object.id")
		}]
	};
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

plugin.css = '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
