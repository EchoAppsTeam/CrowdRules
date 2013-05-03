(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.vars = {
	"query": "",
	"route": null,
	"metadata": {}
};

CrowdRules.config = {
	"submit": {},
	"stream": {
		"labels": {
			"emptyStream": "No videos at this time..."
		}
	},
	"route": {
		"prefix": "!",
		"path": "",
		"local": {
			"prefix": "/CrowdRules",
			"path": "/demo"
		}
	},
	"finalistMarker": "Finalist",
	"targetURL": "http://example.com/crowdrules",
	"stageIndex": 0
};

CrowdRules.config.normalizer = {
	"route": function(route) {
		if (route.local) {
			route.prefix = (route.prefix || "") + route.local.prefix;
		}
		return route;
	}
};

CrowdRules.init = function() {
	this.set("metadata", this._getMetadata()[this.config.get("stageIndex")]);
	this._initRouter();
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
	"plugin": "Echo.StreamServer.Controls.Stream.WithoutMore",
	"url": "{config:domainPrefix}/plugins/without-more.js"
}, {
	"plugin": "Echo.StreamServer.Controls.Submit.Plugins.CustomSubmitForm",
	"url": "{config:domainPrefix}/plugins/custom-submit-form.js"
}, {
	"plugin": "Echo.StreamServer.Controls.Stream.Item.Plugins.VideoContent",
	"url": "{config:domainPrefix}/plugins/item-video-content.js"
}, {
	"component": "Echo.URLObserver",
	"url": "{config:domainPrefix}/url-observer.js"
}, {
	"component": "Echo.Router",
	"url": "{config:domainPrefix}/router.js"
}];

CrowdRules.events = {
	"Echo.CrowdRules.Controls.AlphabeticalSorter.onItemChoose": function(_, args) {
		var self = this;
		var stream = this.get("stream"), key = args.key;
		if (stream && key) {
			var query = self.get("query");
			if (key === "all") {
				stream.config.set("query", query);
			} else {
				// TODO: more flexible solution is needed
				stream.config.set("query", query.replace(
					"children:1",
					"markers:\"alpha:" + key + "\" children:1"
				));
			}
			stream.refresh();
		}
	},
	"onRouteChange": function(topic, params) {
		this.router.applyRoute(params.route);
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

CrowdRules.templates.permalinkPage = 
	'<div class="{class:permalonkStream}"></div>';

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

CrowdRules.routes = {};

CrowdRules.routes.video = {
	"spec": "/video/{id}",
	"handler": function(params) {
		this.showVideo(params.id);
	}
};

CrowdRules.methods._initRouter = function() {
	this.router = new Echo.Router({
		"widget": this,
		"config": {
			"route": $.extend({
				"path": Echo.URLObserver.getFragment()
			}, this.config.get("route")),
			"routes": this._manifest("routes")
		}
	});
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
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:off " +
				"sortOrder:likesDescending children:1",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "Reply"
			}, {
				"name": "Vote"
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Contestants"
		}
	},
	"constentants-curation": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched safeHTML:off children:1",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "constentants-curation",
			"label": "Contestants Curation"
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
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:off " +
				"sortOrder:likesDescending children:1",
			"item": {"reTag": false},
			"plugins": [{
				"name": "WithoutMore"
			}, {
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "Moderation"
			}, {
				"name": "Reply"
			}, {
				"name": "MarkerButton",
				"marker": this.config.get("finalistMarker")
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Contestants"
		}
	},
	"finalists": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:off markers: " +
				this.config.get("finalistMarker") + " sortOrder:likesDescending children:1",
			"plugins": [{
				"name": "MarkerButton",
				"marker": this.config.get("finalistMarker")
			}, {
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "VideoContent"
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
			"query": "childrenof: " + this.config.get("targetURL") + " itemsPerPage: 10 state:ModeratorApproved safeHTML:off markers: " +
				this.config.get("finalistMarker") + " sortOrder:likesDescending children:1",
			"plugins": [{
				"name": "Vote"
			}, {
				"name": "VideoContent"
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
	'.{class:container} { padding: 20px; }' +
	'.{class:tabs} { margin-top: 10px; }' +
	'.{class:container} .echo-streamserver-controls-stream-header{ display: none; }' +
	'.{class:container} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-avatar { display: none; }' +
	'.{class:container} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-authorName { display: none; }' +
	'.{class:container} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-frame > div.echo-clear{ clear: left; }' +
	'.{class:container} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-plugin-Moderation-status { display: none; }' +
	'.{class:tabs} > ul.nav { margin-bottom: 0px; }';

Echo.App.create(CrowdRules);

})(Echo.jQuery);
