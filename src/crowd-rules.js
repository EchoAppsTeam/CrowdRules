(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.vars = {
	"query": ""
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
	"component": "Echo.CrowdRules.Controls.AlphabeticalSorter",
	"url": "{config:domainPrefix}/controls/alphabetical-sorter.js"
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}, {
	"plugin": "Echo.StreamServer.Controls.Stream.Item.Vote",
	"url": "{config:domainPrefix}/plugins/vote.js"
}, {
	"plugin": "Echo.StreamServer.Controls.Submit.Plugins.CustomSubmitForm",
	"url": "{config:domainPrefix}/plugins/custom-submit-form.js"
}];

CrowdRules.events = {
	"Echo.CrowdRules.Controls.AlphabeticalSorter.onItemChoose": function(_, args) {
		var self = this;
		var stream = this.get("stream"), id = args.id;
		if (stream && id) {
			if (id === "all") {
				stream.config.set("query", self.get("query"));
			} else {
				stream.config.set("query", self.substitute({
					"template": CrowdRules.templates.query,
					"data": {
						"query": stream.config.get("query"),
						"marker": args.id
					}
				}));
			}
			stream.refresh();
		}
	}
};

CrowdRules.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:auth}"></div>' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:tabs}"></div>' +
	'</div>';

CrowdRules.templates.query =
	'{data:query} markers:"{data:marker}"';

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
			self._toggleSorter(panel, metadata[id].sorter);
			self._toggleStream(panel, metadata[id].stream);
		}
	});
	return element;
};

CrowdRules.methods._toggleStream = function(container, config) {
	var self = this, stream = this.get("stream");
	if (typeof stream === "undefined") {
		new Echo.StreamServer.Controls.Stream($.extend({
			"target": $("<div>"),
			"appkey": self.config.get("appkey"),
			"ready": function() {
				self.set("query", this.config.get("query"));
				self.set("stream", this);
				container.append(this.config.get("target"));
			}
		}, this.config.get("stream"), config));
	} else {
		container.append(stream.config.get("target"));
		// TODO: replace it with extend-like functionality
		$.each(config, function(key, value) {
			stream.config.set(key, value);
		});
		stream.refresh();
	}
};

// TODO: get rid of 'ifs'
CrowdRules.methods._toggleSorter = function(container, config) {
	var self = this, sorter = this.get("sorter");
	if (typeof sorter === "undefined" && config.visible) {
		new Echo.CrowdRules.Controls.AlphabeticalSorter({
			"target": $("<div>"),
			"context": this.config.get("context"),
			"ready": function() {
				self.set("sorter", this);
				container.append(this.config.get("target"));
			}
		});
		return;
	}
	if (sorter && config.visible) {
		container.append(sorter.config.get("target"));
		sorter.refresh();
		return;
	}
	if (sorter && !config.visible) {
		sorter.destroy();
		this.remove("sorter");
		return;
	}
};

//TODO: introduce 'stage' parameter later
CrowdRules.methods._getTabsMetadata = function() {
	return {
		"contestans": {
			"visible": true,
			"sorter": {
				"visible": true
			},
			"stream": {
				"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved",
				"item": {"reTag": false},
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
			"visible": this.user.is("admin"),
			"sorter": {
				"visible": true
			},
			"stream": {
				"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched",
				"item": {"reTag": false},
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
			"sorter": false,
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
