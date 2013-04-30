(function(jQuery) {
"use strict";

var $ = jQuery;

var CrowdRules = Echo.App.manifest("Echo.Apps.CrowdRules");

if (Echo.App.isDefined("Echo.Apps.CrowdRules")) return;

CrowdRules.templates.main =
	'<div id="{class:container}"></div>';

CrowdRules.renderers.container = function(element) {
	return element;
};

CrowdRules.css = "";

Echo.App.create(CrowdRules);

})(Echo.jQuery);
