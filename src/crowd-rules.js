(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.config = {
	"submit": {},
	"stream": {},
	"targetURL": "http://example.com/crowdrules"
};

CrowdRules.dependencies = [{
	"loaded": function() {
		return Echo.Control.isDefined("Echo.StreamServer.Controls.Stream") &&
			Echo.Control.isDefined("Echo.StreamServer.Controls.Subsmit");
	},
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

CrowdRules.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:tabs}"></div>' +
	'</div>';

CrowdRules.renderers.submit = function(element) {
	new Echo.StreamServer.Controls.Submit($.extend({
		"target": element,
		"appkey": this.config.get("appkey"),
		"targetURL": this.config.get("targetURL")
	}, this.config.get("submit")));
	return element;
};

CrowdRules.renderers.tabs = function(element) {
	var self = this;
	new Echo.GUI.Tabs({
		"target": element,
		"entries": [{
			"id": "contestants",
			"label": "Contestants",
		}, {
			"id": "constentans-curation",
			"label": "Constentants Curation",
		}, {
			"id": "finalists",
			"label": "Finalists"
		}],
		"show": function(tab, panel, id, index) {
			new Echo.StreamServer.Controls.Stream($.extend({
				"target": panel,
				"appkey": self.config.get("appkey"),
				"query": "childrenof: " + self.config.get("targetURL")
			}, this.config.get("stream")));
		}
	});
	return element;
};

CrowdRules.css = "";

Echo.App.create(CrowdRules);

})(Echo.jQuery);
