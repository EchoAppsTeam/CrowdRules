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
	"component": "Echo.StreamServer.Controls.Stream",
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
}, {
	"component": "Echo.IdentityServer.Controls.Auth",
	"url": "{config:cdnBaseURL.sdk}/identityserver.pack.js"
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}, {
	"plugin": "Echo.StreamServer.Controls.Stream.Item.Vote",
	"url": "{config:domainPrefix}/plugins/vote.js"
}, {
	"plugin": "Echo.StreamServer.Controls.Stream.AlphabeticalSorter",
	"url": "{config:domainPrefix}/plugins/alphabetical-sorter.js"
}, {
	"plugin": "Echo.StreamServer.Controls.Submit.Plugins.CustomSubmitForm",
	"url": "{config:domainPrefix}/plugins/custom-submit-form.js"
}];

CrowdRules.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:auth}"></div>' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:tabs}"></div>' +
	'</div>';

CrowdRules.renderers.auth = function(element) {
	var identityManagerItem = {
		"width": 400,
		"height": 250,
		"url": "https://" + this.config.get("rpxAppName") + "/openid/embed?flags=stay_in_window,no_immediate&token_url=http%3A%2F%2Fechoenabled.com%2Fapps%2Fjanrain%2Fwaiting.html&bp_channel="
	};
	new Echo.IdentityServer.Controls.Auth({
		"target": element,
		"appkey": this.config.get("appkey"),
		"identityManager": {
			"login": identityManagerItem,
			"signup": identityManagerItem
		}
	});
	return element;
};

CrowdRules.renderers.submit = function(element) {
	new Echo.StreamServer.Controls.Submit($.extend({
		"target": element,
		"appkey": this.config.get("appkey"),
		"targetURL": this.config.get("targetURL"),
		"plugins": [{
			"name": "CustomSubmitForm"
		}]
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
				"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved",
				"plugins": [{
					"name": "Moderation"
				}, {
					"name": "Reply"
				}, {
					"name": "Vote"
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
