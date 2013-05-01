(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.config = {
	"submit": {}
};

CrowdRules.dependencies = [{
	"loaded": function() {
		return Echo.Control.isDefined("Echo.StreamServer.Controls.Stream") &&
			Echo.Control.isDefined("Echo.StreamServer.Controls.Subsmit");
	},
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
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
		"targetURL": "http://example.com/crowdrules"
	}, this.config.get("submit")));
	return element;
};

CrowdRules.renderers.tabs = function(element) {
	return element;
};

CrowdRules.css = "";

Echo.App.create(CrowdRules);

})(Echo.jQuery);
