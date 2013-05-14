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
	"targetURL": "http://cnbc.com/crowdrules",
	"stageIndex": 0,
	"identityManager": {
		"width": 270,
		"height": 300,
		"title": "Sign in...",
		"url": ""
	},
	"finalist": {
		"marker": "Finalist"
	},
	// TODO: define this object before stage 4
	"lifestreamTargets": {
		//permalink_id : targetURL
	},
	"sharing": {
		"appName": "",
		"activity": {
			"prompt": "Share your vote:",
			"content": "I just voted for '{data:businessName}' on '{data:domain}'",
			"page": {
				"title": "Crowd Rules",
				"description": "Each week, \"Crowd Rules\" features three small businesses that compete in front of an audience of 100 that votes to decide who wins a much-needed $50,000 prize."
			}
		}
	}
};

CrowdRules.config.normalizer = {
	"identityManager": function(o) {
		o.url = o.url || "http://cdn.echoenabled.com/apps/echo/crowd-rules/third-party/login.html?app=" + this.get("rpxAppName") + "&token_url=http%3A%2F%2Fapps.echoenabled.com%2Fv2%2Fjanrain%2Fwaiting.html&bp_channel=";
		return o;
	},
	"sharing": function(o) {
		o.appId = o.appId || this.get("rpxAppId");
		o.appName = o.appName || this.get("rpxAppName");
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
	if (!this.user.is("admin")) {
		var handler = this._removeUserValidationFrom(this);
		this._removeUserValidationFrom(Echo.Loader.canvases[0]);
		this.events.subscribe({
			"topic": "Echo.UserSession.onInvalidate",
			"context": "global",
			"handler": function(topic, data) {
				if (!this.user.is("admin")) {
					var stream = this.get("stream", {});
					$.map(stream.threads || [], function(root) {
						root.render();
					});
				} else {
					handler.apply(this, arguments);
				}
			}
		});
	}
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
				stream.config.set("query", "markers:\"alpha:" + key + "\" " + query);
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
	'<div class="{class:intro}"></div>' +
	'<div class="{class:container} {class:stage}{config:stageIndex}">' +
		'<div class="{class:main}">' +
			'<div class="{class:mainWrapper}">' +
				'<div class="{class:header}">' +
					'<div class="{class:title}"></div>' +
					'<div class="{class:auth}"></div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="{class:content}">' +
					'<div class="{class:submit}"></div>' +
					'<div class="{class:contestants}"></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{class:right}">' +
			'<div class="{class:rightWrapper}"></div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>' +
	'<div class="{class:footer}">' +
		'<img src="http://cdn.echoenabled.com/apps/echo/crowd-rules/images/crowd-rules-challenge-footer-960x50.jpg" width="960" height="50">' +
	'</div>';

CrowdRules.templates.admin =
	'<div class="{class:container}">' +
		'<div class="{class:main}">' +
			'<div class="{class:mainWrapper}">' +
				'<div class="{class:header}">' +
					'<div class="{class:title}"></div>' +
					'<div class="{class:auth}"></div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="{class:content}">' +
					'<div class="echo-clear"></div>' +
					'<div class="{class:tabs}"></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{class:right}">' +
			'<div class="{class:rightWrapper}"></div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>' +
	'<div class="{class:footer}">' +
		'<img src="http://cdn.echoenabled.com/apps/echo/crowd-rules/images/crowd-rules-challenge-footer-960x50.jpg" width="960" height="50">' +
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
				'<div class="{class:finalistActivityTitle}"></div>' +
				'<div class="{class:finalistActivityStream}"></div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>' +
	'<div class="{class:footer}">' +
		'<img src="http://cdn.echoenabled.com/apps/echo/crowd-rules/images/crowd-rules-challenge-footer-960x50.jpg" width="960" height="50">' +
	'</div>';

CrowdRules.renderers.container = function(element) {
	if ((this.config.get("stageIndex") > 2
		&& /video\/[\d-]+/.test(window.location.hash))) {
		element.addClass(this.cssPrefix + "withSidebar");
	}
	return element;
};

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
	var metadata = this.get("metadata.tabs.contestants.stream", {
		"plugins": []
	});
	metadata.plugins.push({
		"name": "WithoutMore"
	});
	metadata.plugins = $.grep(metadata.plugins, function(plugin) {
		return plugin.name !== "ItemWinner";
	});
	this._toggleStream(element, $.extend(true, metadata, {
		"query": this.substitute({
			"template": "url:http://{data:domain}/ECHO/item/{data:id} {data:rest}",
			"data": {
				"id": fragment.replace(/[^\d-]+/, ""),
				"domain": Echo.Utils.parseURL(this.config.get("targetURL")).domain || "example.com",
				"rest": "itemsPerPage:1 children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved"
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
	var metadata = this.get("metadata.submit");
	metadata.visible && new Echo.StreamServer.Controls.Submit($.extend({
		"target": element,
		"appkey": this.config.get("appkey"),
		"targetURL": this.config.get("targetURL"),
		"labels": {
			"post": "Submit"
		},
		"plugins": [{
			"name": "CustomSubmitForm"
		}]
	}, this.config.get("submit")));
	return element;
};

CrowdRules.renderers.intro = function(element) {
	var metadata = this.get("metadata.intro");
	return metadata.visible
		? (
			Echo.Utils.addCSS(metadata.css || "", "intro-stage-" + this.config.get("stageIndex")),
			element.empty().append(metadata.content)
		)
		: element.hide();
};

CrowdRules.renderers.title = function(element) {
	return element.empty().append(this.get("metadata.title"));
};

CrowdRules.renderers.contestants = function(element) {
	var self = this, metadata = this.get("metadata.tabs.contestants");
	if (!metadata.visible) {
		return element.hide();
	}
	element.empty();
	this._toggleSorter(element, metadata.sorter);
	this._toggleStream(element, metadata.stream);
	return element;
};

CrowdRules.renderers.tabs = function(element) {
	var self = this;
	var metadata = this.get("metadata.tabs");
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
	if (!stream || this.config.get("stageIndex") < 3) return element.empty();
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
	if (!this.permalinkId || this.config.get("stageIndex") < 3) return element.empty();
	this.finalistStream = new Echo.StreamServer.Controls.Stream({
		"target": element.empty(),
		"appkey": this.config.get("appkey"),
		"item": {
			"reTag": false
		},
		"query": this.substitute({
			"template": "childrenof:{data:target} {data:rest}",
			"data": {
				"target": this.config.get("lifestreamTargets." + this.permalinkId, this.substitute({
					"template": "http://{data:domain}/ECHO/item/{self:permalinkId}",
					"data": {
						"domain": Echo.Utils.parseURL(this.config.get("targetURL")).domain || "example.com"
					}
				})),
				"rest": "itemsPerPage:5 children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved"
			}
		})
	});
	return element;
};

CrowdRules.methods._removeUserValidationFrom = function() {
	var self = this, handler;
	var topic = "Echo.UserSession.onInvalidate";
	$.map(Array.prototype.slice.call(arguments), function(inst) {
		$.each(inst.subscriptionIDs, function(id) {
			var obj = $.grep(Echo.Events._subscriptions[topic].global.handlers, function(o) {
				return o.id === id;
			})[0];
			if (obj && obj.id) {
				Echo.Events.unsubscribe({
					"handlerId": obj.id
				});
				handler = obj.handler;
				return false;
			}
		});
	});
	return handler;
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
	this._removeUserValidationFrom(this.stream);
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
"title": this.user.is("admin") ? "Contestants" : "Submit your business",
"tabs": {
	"contestants": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestants",
			"label": "Contestants"
		}
	},
	"constentants-curation": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched,SystemFlagged user.state:Untouched,ModeratorApproved safeHTML:permissive children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
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
	"visible": !this.user.is("admin")
},
"intro": {
	"visible": true,
	"content":
		'<div class="echo-crowd-rules-intro1-sectionA">' +
			'<div class="echo-crowd-rules-intro1-section-textbox">' +
				'<div class="echo-crowd-rules-intro1-section-title">Could your small business use $50,000? All it takes is the ability to win over the crowd!</div>' +
				'<div style="padding-top: 1em;" class="echo-crowd-rules-intro1-section-title">From now until May 27th, you can enter your business in the Crowd Rules $50,000 Challenge.</div>' +
				'<iframe style="padding-top: 26px;" width="880" height="495" src="http://www.youtube.com/embed/h0gpE4WHpqI" frameborder="0" allowfullscreen></iframe>' +
			'</div>' +
		'</div>' +
		'<div class="echo-crowd-rules-intro1-sectionB">' +
			'<div class="echo-crowd-rules-intro1-section-textbox">' +
				'<div class="echo-crowd-rules-intro1-section-title">Step 1</div>' +
				'<div class="echo-crowd-rules-intro1-section-textbox-content">Create a <strong>1-2 minute video</strong> about your small business. Tell us about your company, what you would do with $50,000 and why you deserve to win the cash. Then upload to YouTube and copy the URL.</div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-crowd-rules-intro1-sectionC">' +
			'<div class="echo-crowd-rules-intro1-section-textbox">' +
				'<div class="echo-crowd-rules-intro1-section-title">Step 2</div>' +
				'<div class="echo-crowd-rules-intro1-section-textbox-content">Click “<strong>Login</strong>” below. Once done, you will be able to enter your small business by filling out the requested information and pasting the URL to your video. When everything is done, simply click “<strong>Submit</strong>”.</div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-crowd-rules-intro1-sectionD">' +
			'<div class="echo-crowd-rules-intro1-section-textbox">' +
				'<div class="echo-crowd-rules-intro1-section-title">Step 3</div>' +
				'<div class="echo-crowd-rules-intro1-section-textbox-content">Check back on <strong>May 28th</strong> to see if you’ve made the list of businesses eligible to receive funding and then start soliciting support. Alert your family, your friends, your customers, your neighbors – anybody and everybody – because only the 10 teams with the most votes will have the ability to make it to the final round!</div>' +
			'</div>' +
		'</div>',
	"css":
		'.echo-crowd-rules-intro1-section-textbox { width: 556px; font-size: 20px; line-height: 32px; font-family: arial, sans-serif; padding: 50px 0 50px 45px; }' +
		'.echo-crowd-rules-intro1-section-textbox-content { padding-top: 1em; color: #6b6b7b; }' +
		'.echo-crowd-rules-intro1-sectionA .echo-crowd-rules-intro1-section-textbox { margin: 0 40px 0 45px; padding-left: 0; width: auto; line-height: 36px; }' +
		'.echo-crowd-rules-intro1-sectionA .echo-crowd-rules-intro1-section-textbox-content { padding-top: 0; }' +
		'.echo-crowd-rules-intro1-section-title { font-size: 28px; font-weight: bold; color: #424257; }' +
		'.echo-crowd-rules-intro1-sectionA, .echo-crowd-rules-intro1-sectionB, .echo-crowd-rules-intro1-sectionC, .echo-crowd-rules-intro1-sectionD { background-repeat:no-repeat; background-position:bottom; }' +
		'.echo-crowd-rules-intro1-sectionA { background-image:url("http://cdn.echoenabled.com/apps/echo/crowd-rules/images/sectionA-background.png"); }' +
		'.echo-crowd-rules-intro1-sectionB { background-image:url("http://cdn.echoenabled.com/apps/echo/crowd-rules/images/sectionB-background.jpg"); }' +
		'.echo-crowd-rules-intro1-sectionC { background-image:url("http://cdn.echoenabled.com/apps/echo/crowd-rules/images/sectionC-background.png"); }' +
		'.echo-crowd-rules-intro1-sectionD { background-image:url("http://cdn.echoenabled.com/apps/echo/crowd-rules/images/sectionD-background.jpg"); }'
	}
// End of Stage 0
},{
// Stage 1
"title": "Contestants",
"tabs": {
	"contestants": {
		"visible": true,
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Moderation"
			}, {
				"name": "Vote",
				"launcher": authLauncher,
				"sharing": this.config.get("sharing")
			}, {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestants",
			"label": "Contestants"
		}
	},
	"constentants-curation": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": true
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:Untouched,SystemFlagged user.state:Untouched,ModeratorApproved safeHTML:permissive children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
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
	"visible": false
},
"intro": {
	"visible": false,
	"content": "Stage 2 'Voting' description"
}
// End of Stage 1
}, {
// Stage 2
"title": "Top 10 Contestants",
"tabs": {
	"contestants": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "WithoutMore"
			}, {
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "Moderation"
			}, $.extend({}, this.config.get("finalist"), {
				"name": "FinalistButton"
			}), {
				"name": "VideoContent"
			}]
		},
		"tab": {
			"id": "contestants",
			"label": "Top 10 Contestants"
		}
	},
	"finalists": {
		"visible": this.user.is("admin"),
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 markers:" + this.config.get("finalist.marker") +  " state:ModeratorApproved safeHTML:permissive sortOrder:likesDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"plugins": [{
				"name": "Vote",
				"readOnly": true
			}, {
				"name": "VideoContent"
			}, $.extend({}, this.config.get("finalist"), {
				"name": "FinalistButton"
			})]
		},
		"tab": {
			"id": "finalists",
			"label": "Finalists Curation"
		}
	}
},
"submit": {
	"visible": false
},
"intro": {
	"visible": false,
	"content": "Stage 3 'Finalists' description"
}
// End of Stage 2
}, {
// Stage 3
"title": "Finalists",
"tabs": {
	"contestants": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 markers:" + this.config.get("finalist.marker") + " state:ModeratorApproved,CommunityFlagged safeHTML:permissive sortOrder:flagsDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Vote",
				"engine": "flags",
				"launcher": authLauncher,
				"sharing": this.config.get("sharing")
			}, {
				"name": "VideoContent"
			}, {
				"name": "Moderation"
			}]
		},
		"tab": {
			"id": "contestants",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
},
"intro": {
	"visible": false,
	"content": "Stage 4 'Final voting' description"
}
// End of Stage 3
}, {
// Stage 4
"title": "Finalists",
"tabs": {
	"contestants": {
		"visible": true,
		"sorter": {
			"visible": false
		},
		"stream": {
			"query": "childrenof:" + this.config.get("targetURL") + " itemsPerPage:10 markers:" + this.config.get("finalist.marker") + " state:ModeratorApproved,CommunityFlagged safeHTML:permissive sortOrder:flagsDescending children:0 state:Untouched,ModeratorApproved user.state:Untouched,ModeratorApproved",
			"item": {"reTag": false},
			"plugins": [{
				"name": "Vote",
				"engine": "flags",
				"readOnly": true,
				"launcher": authLauncher
			}, {
				"name": "VideoContent"
			}, {
				"name": "Moderation"
			}, {
				"name": "ItemWinner",
				"cssClass": this.cssPrefix + "itemWinner"
			}]
		},
		"tab": {
			"id": "contestants",
			"label": "Finalists"
		}
	}
},
"submit": {
	"visible": false
},
"intro": {
	"visible": false,
	"content": "Stage 5 'Winner' description"
}
// End of Stage 4
}];
};

CrowdRules.css =
	'.{class:container} { font-size: 14px; line-height: 20px; padding: 20px; margin-top: 30px; }' +
	'.{class:submit}, .{class:header} { margin-bottom: 20px; }' +
	'.{class:auth} { float: right; }' +
	'.{class:title} { color: #424257; font: 28px Arial; line-height: 32px; font-weight: bold; float: left; }' +
	'.{class:contestants} { border-top: 1px solid #dddddd; }' +
	'.{class:content} { margin-top: 10px; }' +
	'.{class:footer} { width: 960px; height: 50px; }' +
	'.{class:main}, .{class:right} { float: left; }' +
	'.{class:right} { display: none; }' +
	'.{class:main} { width: 100%; }' +
	'.{class:stage0} .{class:mainWrapper} { margin: 0 auto;  width: 600px; }' +
	'.{class:withSidebar} .{class:mainWrapper} { margin-right: 350px; margin-left: 25px; }' +
	'.{class:withSidebar} .{class:right} { display: block; margin-left: -350px; }' +
	'.{class:rightWrapper} { width: 290px; margin-left: 40px; padding: 50px 20px 0 0; }' +
	'.{class:finalistActivityTitle} { font-size: 14px; margin-bottom: 10px; }' +
	'.{class:finalistActivityTitle} span { font-size: 14px; font-weight: bold; }' +
	'.{class:itemWinner} { background-color: #ffff99; }' +
	// auth control styles
	'.{class:main} .echo-identityserver-controls-auth-logout { font-size: 12px; line-height: 26px; margin-left: 10px; }' +
	'.{class:main} .echo-identityserver-controls-auth-name { font-size: 14px; }' +
	// stream control styles
	'.{class:container} .echo-streamserver-controls-stream-item-button { font-weight: normal!important; }' +
	'.{class:main} .echo-streamserver-controls-stream { margin-left: 175px; width: 570px; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-plugin-Reply-replyForm .echo-streamserver-controls-submit { width: auto; margin-left: 68px; }' +
	'.{class:withSidebar} .{class:main} .echo-streamserver-controls-stream, .{class:withSidebar} .{class:main} .echo-streamserver-controls-submit { width: auto; margin-left: 0; }' +
	'.{class:main} .echo-streamserver-controls-stream-header { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-avatar { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-authorName { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-frame > div.echo-clear { clear: left; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-depth-0 .echo-streamserver-controls-stream-item-plugin-Moderation-status { display: none; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-subwrapper { margin-left: 78px; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-avatar-wrapper { margin-right: -78px; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-container-child { margin-right: 78px; }' +
	'.{class:right} .echo-streamserver-controls-stream-header { display: none; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-subwrapper { margin-left: 46px; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-avatar-wrapper { margin-right: -46px; }' +
	'.{class:right} .echo-streamserver-controls-stream-item-avatar { width: 36px; }' +
	'.{class:main} .echo-streamserver-controls-stream-item-plugin-VideoContent-description { padding-right: 75px; }' +
	'.{class:container} a.echo-streamserver-controls-stream-item-button, .{class:container} a.echo-streamserver-controls-stream-item-button span { color: #c6c6c6; }' +
	'.{class:container} a.echo-streamserver-controls-stream-item-button:hover, .{class:container} a.echo-streamserver-controls-stream-item-button.echo-linkColor, .{class:container} a.echo-streamserver-controls-stream-item-button span:hover, .{class:container} a.echo-streamserver-controls-stream-item-button span.echo-linkColor { color: #476cb8; }' +
	// override CNBC page styles
	'#franchiseHeader, #page_header { height: 100px!important; }' +
	// bootstrap components styles
	'.{class:container} .btn, .{class:container} .btn:hover { background-image: none!important; height: auto!important; }' +
	'.{class:tabs} > ul.nav { margin-bottom: 0px; }' +
	'.{class:viewContestants} div { margin-left: 25px; }' +
	'.{class:permalinkContainer} { margin-top: 20px; }' +
	'.echo-sdk-ui .echo-control-message { padding: 45px; }' +
	'.echo-sdk-ui .{class:container} a, .echo-sdk-ui .{class:container} a * { color: #476CB8; }' +
	'.echo-sdk-ui h3 { text-transform: none; }';

Echo.App.create(CrowdRules);

})(Echo.jQuery);
