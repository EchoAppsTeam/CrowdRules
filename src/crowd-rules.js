(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.vars = {
	"auth": null,
	"authWaitingQueue": [],
	"query": "",
	"fragment": "",
	"metadata": {}
};

CrowdRules.config = {
	"submit": {},
	"stream": {
		"labels": {
			"emptyStream": "No videos at this time..."
		}
	},
	"targetURL": "http://test.cnbc.com/crowdrules",
	"stageIndex": 0,
	"identityManager": {
		"width": 270,
		"height": 200,
		"title": "Sign in...",
		"url": ""
	},
	"finalist": {
		"marker": "Finalist",
		"postfix": "/finalists",
		"attributes": {
			"state": "ModeratorApproved"
		}
	}
};

CrowdRules.config.normalizer = {
	"identityManager": function(o) {
		o.url = o.url || "http://cdn.echoenabled.com/apps/echo/crowd-rules/third-party/login.html?app=" + this.get("rpxAppName") + "&token_url=http%3A%2F%2Fapps.echoenabled.com%2Fv2%2Fjanrain%2Fwaiting.html&bp_channel=";
		return o;
	}
};

CrowdRules.labels = {
	"viewContestants": "View all contestants",
	"enterBusiness": "Submit your business",
	"finalistLifestream": "Finalist lifestream: "
};

CrowdRules.init = function() {
	this.set("metadata", this._getMetadata()[this.config.get("stageIndex")]);
	this.render();
	this.ready();
	$(window).off("hashchange")
		.on("hashchange", $.proxy(this.refresh, this));
};

CrowdRules.destroy = function() {
	$.map([this.get("stream"), this.get("finalistStream")], function(stream) {
		if (stream) stream.refresh();
	});
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
	"Echo.StreamServer.Controls.Stream.Item.Plugins.VideoContent.onPermalinkOpen": function(topic, args) {
		var stream = this.get("stream");
		var item = stream.items[args.item.data.unique];
		this.permalinkId = item.get("data.object.id").replace(/[^\d-]+/g, "");
		this._navigate("/video/" + this.permalinkId);
	}
};

CrowdRules.methods.template = function() {
	var self = this;
	return this._manifest("templates")[
		/video\/[\d-]+/.test(window.location.hash)
			? "permalink" : (self.user.is("admin") ? "admin" : "user")
	];
};

CrowdRules.templates.user =
	'<div class="{class:container}">' +
		'<div class="{class:main}">' +
			'<div class="{class:mainWrapper}">' +
				'<div class="{class:header}">' +
					'<div class="{class:auth}"></div>' +
					'<div class="{class:title}"></div>' +
					'<div class="{class:submitToggleButtonContainer}">' +
						'<div class="btn btn-mini {class:submitToggleButton}">{label:enterBusiness}</div>' +
					'</div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="{class:userContent}">' +
					'<div class="{class:submit}"></div>' +
					'<div class="{class:content}"></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{class:right}">' +
			'<div class="{class:rightWrapper}">' +
				'<div class="{class:adContainer}"><h1>Ad Unit</h1></div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

CrowdRules.templates.admin =
	'<div class="{class:container}">' +
		'<div class="{class:main}">' +
			'<div class="{class:mainWrapper}">' +
				'<div class="{class:adminContent}">' +
					'<div class="{class:auth}" style="float: right;"></div>' +
					'<div class="{class:tabs}"></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{class:right}">' +
			'<div class="{class:rightWrapper}">' +
				'<div class="{class:adContainer}"><h1>Ad Unit</h1></div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

CrowdRules.templates.permalink =
	'<div class="{class:container}">' +
		'<div class="{class:main}">' +
			'<div class="{class:mainWrapper}">' +
				'<div class="{class:auth}"></div>' +
				'<div class="{class:viewContestants}">' +
					'<div class="btn btn-mini">{label:viewContestants}</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
				'<div class="{class:permalinkContainer}"></div>' +
			'</div>' +
		'</div>' +
		'<div class="{class:right}">' +
			'<div class="{class:rightWrapper}">' +
				'<div class="{class:adContainer}"><h1>Ad Unit</h1></div>' +
				'<div class="{class:finalistActivityTitle}"></div>' +
				'<div class="{class:finalistActivityStream}"></div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

CrowdRules.renderers.submitToggleButton = function(element) {
	var self = this;
	var metadata = this.get("metadata")["submit"];
	element.off("click");
	if (this.user.is("logged")) {
		element.on("click", function() {
			element.removeClass("active");
			var container = self.view.get("submit");
			container.toggle();
			if (container.is(":visible")) {
				element.addClass("active");
			}
		});
	} else {
		element.addClass("disabled");
		self.addAuthPopupLauncher(element);
	}
	return metadata.visible ? element : element.hide();
};

CrowdRules.methods.addAuthPopupLauncher = function(element) {
	var self = this;
	var assemble = function() {
		self.auth._assembleIdentityControl("login", element);
	};
	this.auth ? assemble() : this.authWaitingQueue.push(assemble);
};

CrowdRules.renderers.permalinkContainer = function(element) {
	var self = this;
	var fragment = this._getFragment();
	var metadata = this.get("metadata.tabs.contestans.stream", {
		"plugins": []
	});
	metadata.plugins.push({
		"name": "WithoutMore"
	});
	this._toggleStream(element, $.extend(true, metadata, {
		"query": this.substitute({
			"template": "url:http://{data:domain}/ECHO/item/{data:id} {data:rest}",
			"data": {
				"id": fragment.replace(/[^\d-]+/, ""),
				"domain": Echo.Utils.parseURL(this.config.get("targetURL")).domain || "example.com",
				"rest": "itemsPerPage:1 children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved"
			}
		})
	}));
	return element;
};

CrowdRules.renderers.viewContestants = function(element) {
	return element.click(function() {
		window.location.hash = "!";
	});
};

CrowdRules.renderers.auth = function(element) {
	var self = this;
	var identityManagerItem = this.config.get("identityManager");
	new Echo.IdentityServer.Controls.Auth({
		"target": element,
		"appkey": this.config.get("appkey"),
		"identityManager": {
			"login": identityManagerItem,
			"signup": identityManagerItem
		},
		"ready": function() {
			self.auth = this;
			$.map(self.authWaitingQueue, function(callback) { callback(); });
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
		"labels": {
			"post": "Submit your Entry"
		},
		"plugins": [{
			"name": "CustomSubmitForm"
		}]
	}, this.config.get("submit")));
	return element;
};

CrowdRules.renderers.title = function(element) {
	var metadata = this.get("metadata")["tabs"];
	element.empty();
	// TODO: more flexible solution to fetch data is needed
	$.each(metadata, function(key, entry) {
		element.append(entry.tab.label);
		return false;
	});
	return element;
};

CrowdRules.renderers.content = function(element) {
	var self = this, metadata = this.get("metadata")["tabs"];
	element.empty();
	// TODO: more flexible solution to fetch data is needed
	$.each(metadata, function(key, entry) {
		self._toggleSorter(element, entry.sorter);
		self._toggleStream(element, entry.stream);
		return false;
	});
	return element;
};

CrowdRules.renderers.tabs = function(element) {
	var self = this;
	var metadata = this.get("metadata")["tabs"];
	this.tabs = new Echo.GUI.Tabs({
		"target": element,
		"entries": $.map(metadata, function(entry) { return entry.visible && entry.tab }),
		"show": function(tab, panel, id, index) {
			self._toggleSorter(panel, metadata[id].sorter);
			self._toggleStream(panel, metadata[id].stream);
		}
	});
	return element;
};

CrowdRules.renderers.finalistActivityTitle = function(element) {
	var self = this;
	var stream = this.get("stream"), businessName;
	if (!stream || this.config.get("stageIndex") < 2) return element.empty();
	$.map(["Echo.StreamServer.Controls.Stream.onRender", "Echo.StreamServer.Controls.Stream.onRefresh"], function(topic) {
		var handlerId = Echo.Events.subscribe({
			"topic": topic,
			"context": stream.config.get("context"),
			"handler": function(topic, args) {
				self.events.unsubscribe({"handlerId": handlerId});
				try {
					businessName = $.parseJSON(stream.threads[0].get("data.object.content")).businessName;
					element.empty().append(self.labels.get("finalistLifestream") + "<span>" + businessName + "</span>");
				} catch(e) {}
			}
		});
	});
	return element;
};

CrowdRules.renderers.finalistActivityStream = function(element) {
	if (!this.permalinkId) {
		this.permalinkId = this._getFragment().replace(/[^\d-]+/g, "");
	}
	if (!this.permalinkId || this.config.get("stageIndex") < 2) return element.empty();
	this.finalistStream = new Echo.StreamServer.Controls.Stream({
		"target": element.empty(),
		"appkey": this.config.get("appkey"),
		"item": {
			"reTag": false
		},
		"query": this.substitute({
			"template": "childrenof:http://{data:domain}/ECHO/item/{self:permalinkId} {data:rest}",
			"data": {
				"domain": Echo.Utils.parseURL(this.config.get("targetURL")).domain || "example.com",
				"rest": "itemsPerPage:5 children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved"
			}
		})
	});
	return element;
};

CrowdRules.methods._getFragment = function(fragment) {
	if (typeof fragment === "undefined") {
		fragment = window.location.hash;
	}
	return decodeURIComponent(fragment.replace(/^#*/, ""));
};

CrowdRules.methods._navigate = function(fragment) {
	var frag = (fragment || this._getFragment()).replace(/^#*/, "");
	if (this.fragment === frag || this.fragment === decodeURIComponent(frag)) return;
	this.fragment = frag;
	window.location.hash = "!" + frag;
	this.refresh();
};

CrowdRules.methods._toggleStream = function(container, config) {
	var self = this, stream = this.get("stream");
	if (typeof stream === "undefined") {
		this.stream = new Echo.StreamServer.Controls.Stream($.extend({
			"target": $("<div>"),
			"appkey": this.config.get("appkey"),
			"context": this.config.get("context"),
			"ready": function() {
				self.set("query", this.config.get("query"));
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
	var authLauncher = $.proxy(this.addAuthPopupLauncher, this);
	var identityManagerItem = this.config.get("identityManager");
	return [{
// Stage 0
"tabs": {
	"contestans": {
		"visible": true,
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "Reply",
				"nestedPlugins": [{
					"name": "FormAuth",
					"submitPermissions": "forceLogin",
					"identityManager": {
						"login": identityManagerItem,
						"signup": identityManagerItem
					}
				}]
			}, {
				"name": "Vote",
				"launcher": authLauncher
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
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched,SystemFlagged user.state:Untouched,ModeratorApproved safeHTML:permissive children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
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
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "WithoutMore"
			}, {
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "Moderation"
			}, {
				"name": "Reply",
				"nestedPlugins": [{
					"name": "FormAuth",
					"submitPermissions": "forceLogin",
					"identityManager": {
						"login": identityManagerItem,
						"signup": identityManagerItem
					}
				}]
			}, $.extend({}, this.config.get("finalist"), {
				"name": "FinalistButton"
			}), {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Top 10 Contestants"
		}
	},
	"finalists": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + this.config.get("finalist.postfix") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"plugins": [{
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "VideoContent"
			}, {
				"name": "Moderation",
				"itemActions": ["delete"],
				"userActions": [],
				"labels": {
					"deleteButton": "Exclude from finalists",
					"changingStatusToModeratorDeleted": "Excluding..."
				}
			}]
		},
		"tab": {
			"id": "finalists",
			"label": "Finalists Curation"
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
	"contestans": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + this.config.get("finalist.postfix") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:1 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Reply",
				"nestedPlugins": [{
					"name": "FormAuth",
					"submitPermissions": "forceLogin",
					"identityManager": {
						"login": identityManagerItem,
						"signup": identityManagerItem
					}
				}]
			}, {
				"name": "Vote",
				"launcher": authLauncher
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
}
// End of Stage 2
}, {
// Stage 3
"tabs": {
	"contestans": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + this.config.get("finalist.postfix") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Vote",
				"readOnly": true,
				"launcher": authLauncher
			}, {
				"name": "VideoContent"
			}, {
				"name": "ItemWinner",
				"cssClass": this.cssPrefix + "itemWinner"
			}]
		},
		"tab": {
			"id": "contestans",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
}
// End of Stage 3
}];
};

CrowdRules.css =
	'.{class:container} { padding: 20px; margin-bottom: 50px; }' +
	'.{class:submit} { display: none; margin-bottom: 20px; }' +
	'.{class:auth} { float: right; }' +
	'.{class:title} { color: #555555; font: 26px Arial; line-height: 18px; font-weight: bold; padding-left: 5px;  float: left; }' +
	'.{class:content} { border-top: 1px solid #dddddd; }' +
	'.{class:userContent} { margin-top: 10px; }' +
	'.{class:main}, .{class:right} { float: left; }' +
	'.{class:main} { width: 100%; }' +
	'.{class:mainWrapper} { margin-right: 225px; }' +
	'.{class:right} { margin-left: -225px; }' +
	'.{class:rightWrapper} { width: 200px; margin-left: 25px; }' +
	'.{class:finalistActivityTitle} { font-size: 14px; }' +
	'.{class:finalistActivityTitle} span { font-size: 14px; font-weight: bold; }' +
	'.{class:itemWinner} { background-color: #ffff99; }' +
	// FIXME: temporary CSS rules. remove me!
	'.{class:adContainer} { border: 1px dashed #000; text-align: center; height: 300px; padding-top: 100px; margin-bottom: 30px; }' +
	// auth control styles
	'.{class:main} .echo-identityserver-controls-auth-logout { font-size: 12px; line-height: 26px; margin-left: 10px; }' +
	'.{class:main} .echo-identityserver-controls-auth-name { font-size: 14px; }' +
	// stream control styles
	'.{class:main} .echo-streamserver-controls-stream-header{ display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-avatar { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-authorName { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-frame > div.echo-clear{ clear: left; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-plugin-Moderation-status { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-subwrapper { margin-left: 78px; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-avatar-wrapper { margin-right: -78px; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-subwrapper { margin-left: 46px; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-avatar-wrapper { margin-right: -46px; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-avatar { width: 36px; }' +
	// bootstrap components styles
	'.{class:container} .btn, .{class:container} .btn:hover { background-image: none!important; height: auto!important; }' +
	'.{class:tabs} > ul.nav { margin-bottom: 0px; }' +
	'.{class:viewContestants} div { margin-left: 25px; }' +
	'.{class:permalinkContainer} { margin-top: 20px; }' +
	'.echo-sdk-ui .echo-control-message { padding: 45px; }' +
	'.echo-sdk-ui div.{class:submitToggleButton} { letter-spacing: normal;  float: left; margin-left: 20px; }' +
	'.echo-sdk-ui .{class:container} a { color: #476CB8; }';

Echo.App.create(CrowdRules);

})(Echo.jQuery);
