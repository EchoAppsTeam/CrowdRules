(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("MarkerButton", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"name": "FinalistButton",
	"marker": "",
	"postfix": "",
	"attributes": {}
};

plugin.labels = {
	"unmarkedTitle": "Make a Finalist",
	"markedTitle": "Exclude from finalists",
	"markingTitle": "Making a Finalist..."
};

plugin.init = function() {
	this.component.addButtonSpec(this.config.get("name"), this._assembleButton());
};

plugin.methods._assembleButton = function() {
	var self = this, item = this.component;
	var handler = function() {
		item.block(self.labels.get("markingTitle"));
		var requestsCount = 2;
		var callbacks = {
			"success": function() {
				requestsCount--;
				if (requestsCount === 0) self.requestDataRefresh();
			},
			"error": function() {}
		};
		self._markItem(item, callbacks);
		self._duplicateItem(item, self.config.get("postfix"), self.config.get("attributes"), callbacks);
	};
	return function() {
		var item = this;
		return {
			"name": self.config.get("name"),
			"label": self.labels.get((self._isMarked() ? "marked" : "unmarked") + "Title"),
			"visible": item.user.is("admin") && !self._isMarked() && item.isRoot(),
			"callback": handler
		}
	};
};

plugin.methods._markItem = function(item, callbacks) {
	var self = this;
	this._sendRequest({
		"content": this._prepareActivity("mark", self._getObjectContent("marker", self.config.get("marker"))),
		"appkey": item.config.get("appkey"),
		"sessionID": item.user.get("sessionID"),
		"target-query": item.config.get("parent.query")
	}, function(response) {
		callbacks.success();
	}, function(response) {
		callbacks.error();
	});
};

plugin.methods._duplicateItem = function(item, postfix, attributes, callbacks) {
	var self = this, target = item.get("data.target.id") + postfix;
	var get = function(field) {
		var obj = item.get("data.object." + field);
		var handlers = {
			// add more type handlers here if it's needed
			"array": function() {
				return obj.length ? "undefined" : obj.join(", ");
			}
		};
		return handlers[typeof obj] ? handlers[typeof obj]() : obj;
	};
	this._sendRequest({
		"content": [].concat(
			this._prepareActivity("post", this._getObjectContent("comment", get("content")), target),
			this._prepareActivity("mark", this._getObjectContent("marker", get("markers")), target),
			this._prepareActivity("tag", this._getObjectContent("tag", get("tags")), target)
		),
		"appkey": item.config.get("appkey"),
		"sessionID": item.user.get("sessionID")
	}, function(response) {
		self._sendRequest({
			"content": self._prepareActivity("update", attributes, response.objectID),
			"appkey": item.config.get("appkey"),
			"sessionID": item.user.get("sessionID")
		});
		callbacks.success();
	}, function(response) {
		callbacks.error();
	});
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

plugin.methods._getObjectContent = function(type, content) {
	return !(content && type) ? undefined :  {
		"objectTypes": [this._getASURL(type)],
		"content": content
	};
};

plugin.methods._prepareActivity = function(verb, data, target) {
	return (!data) ? [] : {
		"actor": {
			"objectTypes": [this._getASURL("person")],
			"name": this.component.user.get("name"),
			"avatar": ""
		},
		"object": data,
		"source": this.component.config.get("source"),
		"verbs": [this._getASURL(verb)],
		"targets": [{
			"id": target ? target : this.component.get("data.object.id")
		}]
	};
};

plugin.methods._getASURL = function(postfix) {
	return "http://activitystrea.ms/schema/1.0/" + postfix;
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
