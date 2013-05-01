(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.vars = {
	"stream": undefined
};

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
}, {
	"loaded": function() {
		return Echo.Plugin.isDefined("Echo.StreamServer.Controls.Stream.Item.Vote");
	},
	// TODO: change the URL
	"url": "{config:domainPrefix}/plugins/vote.js"
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
	var metadata = this._getTabsMetadata();
	new Echo.GUI.Tabs({
		"target": element,
		"entries": $.map(metadata, function(entry) { return entry.visible && entry.tab }),
		"show": function(tab, panel, id, index) {
			var stream = self.get("stream");
			var params = metadata[id].stream;
			if (typeof stream === "undefined") {
				new Echo.StreamServer.Controls.Stream($.extend({
					"target": panel,
					"appkey": self.config.get("appkey"),
				}, this.config.get("stream"), params));
			} else {
				// TODO: replace it with extend-like functionality
				$.each(params, function(key, value) {
					stream.config.set(key, value);
				});
				stream.refresh();
			}
		}
	});
	return element;
};

//TODO: introduce 'stage' parameter later
CrowdRules.methods._getTabsMetadata = function() {
	return {
		"contestans": {
			"visible": true,
			"stream": {
				"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved children state: ModeratorApproved",
				"plugins": [{
					"name": "Like"
				}, {
					"name": "Moderation"
				}, {
					"name": "Reply"
				}]
			},
			"tab": {
				"id": "contestans",
				"label": "Constentans"
			}
		},
		"constentants-curation": {
			"visible": true,
			"stream": {
				"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched",
				"plugins": [{
					"name": "Moderation"
				}]
			},
			"tab": {
				"id": "constentants-curation",
				"label": "Constentants-Curation"
			}
		},
		// TODO: complete this tab's metadata later
		"finalists": {
			"visible": false,
			"stream": {
				"query": "childrenof: " + this.config.get("targetURL"),
				"plugins": []
			},
			"tab": {
				"id": "finalists",
				"label": "Finalists"
			}
		}
	}
};

CrowdRules.css = "";

Echo.App.create(CrowdRules);

})(Echo.jQuery);
