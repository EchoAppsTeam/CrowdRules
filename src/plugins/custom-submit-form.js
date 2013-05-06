(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("CustomSubmitForm", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"descriptionLimit": 1000,
	"videoMaxWidth": 480, // in px
	"confirmationDisplayTimeout": 5000 // 5 sec
};

plugin.labels = {
	"businessNameHint": "Your Business name",
	"videoURLHint": "Your video URL",
	"descriptionHint": "Description of the Business",
	"processingMedia": "Processing media link. Please wait...",
	"noMediaFound": "No media content was detected. The link will be displayed as is.",
	"submitConfirmation": "Thanks, your video has been submitted for consideration.",
	"counterText": "Description limit is {limit} characters, {typed} typed so far."
};

plugin.init = function() {
	var self = this;

	// replace the whole template
	this.extendTemplate("replace", "container", plugin.templates.main);

	// validator to define non-empty values for the name and text values
	this.component.addPostValidator(function() {
		self.component.view.get("name").val("-");
		self.component.view.get("text").val("-");
		return true;
	}, "high");

	// define validators for the newly added fields
	this.component.addPostValidator(function() {
		var valid = true;
		$.each(["businessName", "videoURL", "description"], function (i, field) {
			valid = !self.component.highlightMandatory(self.view.get(field));
			return valid;
		});
		return valid;
	}, "low");
};

plugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this, submit = this.component;
		var valueOf = function(name) {
			return self.view.get(name).val();
		};
		var businessName = valueOf("businessName");
		var firstChar = businessName.charAt(0).toLowerCase();
		var marker = /[a-z]/.test(firstChar) ? firstChar : "other";
		args.postData.content[0].object.content = Echo.Utils.objectToJSON({
			"businessName": businessName,
			"user": submit.user.get("name"),
			"media": self.get("mediaContent", ""),
			"previewURL": self.get("previewURL", ""),
			"videoWidth": self.config.get("videoMaxWidth"),
			"previewWidth": self.get("previewWidth", ""),
			"description": valueOf("description")
		});
		args.postData.content.push(
			submit._getActivity("tag", submit._getASURL("marker"), "alpha:" + marker)
		);
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		var self = this, confirmation = this.view.get("confirmation");
		// reset fields after successful submission...
		$.map(["businessName", "videoURL", "description"], function(name) {
			self.view.render({"name": name});
		});
		this.set("mediaContent", "");
		this.view.get("videoPreview").hide();
		this.view.render({"name": "charsCounter"});
		confirmation.show();
		setTimeout(function() {
			confirmation.hide();
		}, this.config.get("confirmationDisplayTimeout"));
	}
};

plugin.templates.main =
	'<div class="{class:container}">' +
		'<div class="alert alert-success {plugin.class:confirmation}">' +
			'{plugin.label:submitConfirmation}' +
		'</div>' +
		'<div class="{plugin.class:inputContainer}">' +
			'<input class="{plugin.class:businessName} {plugin.class:input}" type="text">' +
		'</div>' +
		'<div class="{plugin.class:inputContainer}">' +
			'<input class="{plugin.class:videoURL} {plugin.class:input}" type="text">' +
		'</div>' +
		'<div class="{plugin.class:videoPreview}"></div>' +
		'<div class="{plugin.class:inputContainer}">' +
			'<textarea class="{plugin.class:description} {plugin.class:input}"></textarea>' +
		'</div>' +

		// define the set of "hidden" fields to pass Submit validation
		'<input type="hidden" class="{class:text}">' +
		'<input type="hidden" class="{class:name}">' +
		'<input type="hidden" class="{class:tags}">' +
		'<input type="hidden" class="{class:markers}">' +

		'<div class="{class:controls}">' +
			'<div class="{plugin.class:charsCounter}"></div>' +
			'<div class="{class:postContainer}">' +
				'<div class="btn echo-primaryFont {class:postButton}"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

plugin.renderers.businessName = function(element) {
	return this._putHint(element, "businessName");
};

plugin.renderers.charsCounter = function(element) {
	var limit = this.config.get("descriptionLimit", 0);
	var typed = this.view.get("description").val().length;
	var label = this.labels.get("counterText", {
		"typed": typed,
		"left": Math.max(limit - typed, 0),
		"limit": limit
	});
	return element.text(label);
};

plugin.renderers.videoURL = function(element) {
	var self = this;
	this._putHint(element, "videoURL");
	element.bind({"blur": function() {
		var link = $.trim(element.val());
		var preview = self.view.get("videoPreview");
		// do not resolve the same link twice
		if (!link) {
			preview.empty().hide();
			return;
		}
		if (self.get("lastProcessedLink") === link) return;
		self.set("lastProcessedLink", link);
		preview.show().html('<span>' + self.labels.get("processingMedia") + '</span>');
		$.get("http://api.embed.ly/1/oembed", {
			"key": "20f6f47f7e584690ac9c29524a43fa55",
			"url": link,
			"maxwidth": self.config.get("videoMaxWidth"),
			"format": "json"
		}, function(response) {
			preview.empty();
			response = response || {};
			switch (response.type) {
				case "video":
					self.set("previewURL", response.thumbnail_url);
					self.set("previewWidth", response.thumbnail_width);
					self.set("mediaContent", encodeURIComponent(response.html));
					preview.append(response.html);
					break;
				default:
					self.set("mediaContent", link);
					preview.append('<span class="echo-streamserver-controls-submit-plugin-CustomSubmitForm-noMediaFound">' + self.labels.get('noMediaFound') + '</span>');
			}
		}, "jsonp");
	}});
	return element;
};

plugin.renderers.description = function(element) {
	this._putHint(element, "description");
	var self = this;
	var limit = this.config.get("descriptionLimit", 0);
	var handler = function() {
		if (limit) {
			var text = element.val();
			if (text.length <= limit) {
				self.set("text", text);
			} else if (text.length > limit) {
				element.val(self.get("text"));
				return;
			}
		}
		self.view.render({"name": "charsCounter"});
        };
        return element.on("blur focus keyup keypress", handler);
};

plugin.methods._putHint = function(element, label) {
	return element.val("").blur().iHint({
		"text": this.labels.get(label + "Hint"),
		"className": "echo-secondaryColor"
	});
};

plugin.css =
	'.echo-sdk-ui .echo-streamserver-controls-submit-mandatory { border: 1px solid red; }' +
	'.echo-sdk-ui input[type="text"].{plugin.class:input}, .echo-sdk-ui textarea.{plugin.class:input} { outline: 0 !important; box-shadow: none !important; padding: 0px; margin: 0px; border: 0px; width: 100%; }' +
	'.echo-sdk-ui .echo-streamserver-controls-submit-plugin-CustomSubmitForm-input.echo-secondaryColor { color: #DDDDDD; }' +
	'.echo-sdk-ui .{plugin.class:confirmation}.alert { font-weight: bold; margin: 10px 0px; }' +
	'.echo-sdk-ui .{class:postButton} { letter-spacing: normal; }' +
	'.echo-sdk-ui .{plugin.class:confirmation} { display: none; }' +
	'.echo-streamserver-controls-submit-plugin-CustomSubmitForm-noMediaFound { color: red; }' +
	'.{plugin.class:charsCounter} { float: left; margin: 5px 0px 0px 2px; font-size: 12px; color: #555555; }' +
	'.{plugin.class:inputContainer} { margin: 5px 0px; padding: 3px 5px; border: 1px solid #DDDDDD; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
