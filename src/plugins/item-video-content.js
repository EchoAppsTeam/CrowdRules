(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("VideoContent", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"previewMaxWidth": "402px"
};

plugin.init = function() {
	this._unsubscribeMediaGallery();
};

plugin.component.renderers.text = function(element) {
	var data, el, self = this;
	var item = this.component;
	var text = item.get("data.object.content");
	var isAdmin = this.component.user.is("admin");
	// FIXME: remove try/catch before production init
	try {
		data = $.parseJSON(text);
		if (item.config.get("contentTransformations." + item.get("data.object.content_type"), {}).newlines) {
			data.description = data.description.replace(/\n\n+/g, "\n\n");
			data.description = data.description.replace(/\n/g, "&nbsp;<br>");
		}
		data.media = decodeURIComponent(data.media);
		data.user = data.personalName || data.user;
		data.email = isAdmin ? data.personalEmail : "";
		el = $(this.substitute({
			"template": plugin.templates.content(data.previewURL ? "preview" : "full", !!data.media),
			"data": data
		}));
		$("." + this.cssPrefix + "business-name", el).click(function() {
			self.events.publish({
				"topic": "onPermalinkOpen",
				"data": {
					"item": self.component,
					"context": self.component.config.get("context")
				}
			});
		});
		$("." + this.cssPrefix + "previewImg", el)
			.css("max-width", self.config.get("previewMaxWidth"))
			.click(function() {
				var container = $(this).parent();
				container.empty().append(data.media);
				self.component.events.publish({
					"topic": "onRerender"
				});
			});
		if (!isAdmin || !data.email) {
			$("." + this.cssPrefix + "email", el).hide();
		}
	} catch (ex) {
	}
	return element.empty().append(data ? el : text);
};

plugin.component.renderers.date = function(element) {
	var item = this.component;
	return !item.user.is("admin") && item.isRoot()
		? element.hide()
		: this.parentRenderer("date", arguments);
};

plugin.component.renderers.buttons = function(element) {
	var item = this.component;
	element = this.parentRenderer("buttons", arguments);
	if (!item.user.is("admin") && item.isRoot()) {
		element.children(":first").hide();
	}
	return element;
};

plugin.methods._unsubscribeMediaGallery = function() {
	var component = Echo.Utils.getComponent("Echo.StreamServer.Controls.Stream.Item.Plugins.PinboardVisualization");
	if (!component) return;
	component.manifest.renderers.media  = function(element) {
		var plugin = this, item = this.component, handler;
		var mediaItems = plugin.config.get("mediaSelector")(item.get("data.object.content"));
		if (mediaItems.length) {
			var config = $.extend(plugin.config.get("gallery"), {
				"target": element,
				"appkey": item.config.get("appkey"),
				"elements": mediaItems,
				"item": item
			});
			var mediaGallery = new Echo.StreamServer.Controls.Stream.Item.MediaGallery(config);
			$.each(mediaGallery.subscriptionIDs, function(id) {
				var obj = $.grep(Echo.Events._subscriptions["Echo.UserSession.onInvalidate"].global.handlers, function(o) {
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
		} else {
			element.hide();
		}
		return element;
	};
};

plugin.templates.content = function(mode, hasHTML) {
	var embed = mode === "full"
		? "{data:media}"
		: '<img src="{data:previewURL}" class="{plugin.class:previewImg} echo-clickable" title="Click to play video">';
	return '<div class="{plugin.class:container}">' +
		'<div class="{plugin.class:business-name} echo-linkColor">{data:businessName}</div>' +
		'<div class="{plugin.class:posted-by}">Posted by: <span class="echo-linkColor">{data:user}</span> <span class="{plugin.class:email}">({data:email})</span></div>' +
		(hasHTML
			? '<div class="{plugin.class:embed-code}">' + embed + '</div>'
			: '<div class="{plugin.class:link}">Video URL: ' +
				Echo.Utils.hyperlink({
					"href": "{data:link}",
					"caption": "{data:link}",
					"target": "_blank"
				}) +
			'</div>'
		) +
		'<div class="{plugin.class:description}">{data:description}</div>' +
	'</div>';
};

plugin.css =
	'.{plugin.class:business-name} { font: 16px Arial; line-height: 18px; font-weight: bold; cursor: pointer; }' +
	'.{plugin.class:posted-by} { line-height: 16px; margin: 3px 0px 7px 0px; }' +
	'.{plugin.class:description} { margin: 10px 0px; }' +
	'.{plugin.class:embed-code} { margin: 3px 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
