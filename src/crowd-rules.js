(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.vars = {
	"query": "",
	"metadata": {}
};

CrowdRules.config = {
	"submit": {},
	"stream": {},
	"finalistMarker": "Finalist",
	"targetURL": "http://example.com/crowdrules",
	"stageIndex": 0
};

CrowdRules.init = function() {
	this.set("metadata", this._getMetadata()[this.config.get("stageIndex")]);
	this.render();
	this.ready();
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
	"plugin": "Echo.StreamServer.Controls.Stream.Item.MarkerButton",
	"url": "{config:domainPrefix}/plugins/marker-button.js"
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
						"query": self.get("query"),
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
		// control for testing purposes, get rid of it asap
		'<div class="{class:test}">' +
			'<input class="{class:stage}" value="{config:stageIndex}" type="text" />' +
			'<button class="{class:chooseStage}">Choose stage</button>' +
		'</div>' +
		// end of test control
		'<div class="{class:auth}"></div>' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:tabs}"></div>' +
	'</div>';

CrowdRules.templates.query =
	'{data:query} markers:"alpha:{data:marker}"';

// test control render, get rid of it asap
CrowdRules.renderers.chooseStage = function(element) {
	var self = this;
	return element.on("click", function() {
		self.config.set("stageIndex", self.view.get("stage").val());
		self.refresh();
	});
};

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
	var metadata = this.get("metadata")["submit"];
	metadata.visible && new Echo.StreamServer.Controls.Submit($.extend({
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
	var metadata = this.get("metadata")["tabs"];
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
		this.set("query", stream.config.get("query"));
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

CrowdRules.methods._getMetadata = function() {
	return [{
// Stage 0
"tabs": {
	"contestans": {
		"visible": true,
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved " +
				"sortOrder:likesDescending ",
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
	}
},
"submit": {
	"visible": true
}
// End of Stage0
}, {
// Stage 1
"tabs": {
	"contestans": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved " +
				"sortOrder:likesDescending ",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "Moderation"
			}, {
				"name": "Reply"
			}, {
				"name": "MarkerButton",
				"marker": this.config.get("finalistMarker")
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Constentans"
		}
	},
	"constentants-curation": {
		"visible": false, // should we display Curation on Stage 1 ?
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "Vote",
				"readOnly": true
			}]
		},
		"tab": {
			"id": "constentants-curation",
			"label": "Constentants-Curation"
		}
	},
	"finalists": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " markers: " + this.config.get("finalistMarker"),
			"plugins": [{
				"name": "MarkerButton",
				"marker": this.config.get("finalistMarker")
			}, {
				"name": "Vote",
				"readOnly": true
			}]
		},
		"tab": {
			"id": "finalists",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
}
// End of Stage 1
}, {
// Stage 2
"tabs": {
	"finalists": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " markers: " + this.config.get("finalistMarker"),
			"plugins": [{
				"name": "Vote"
			}]
		},
		"tab": {
			"id": "finalists",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
}
// End of Stage 2
}];
};

CrowdRules.css =
	'.{class:tabs} > ul.nav { margin-bottom: 0px; }';

Echo.App.create(CrowdRules);

})(Echo.jQuery);
