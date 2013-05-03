(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("CustomSubmitForm", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"videoMaxWidth": 250 // in px
};

plugin.labels = {
	"businessNameHint": "Your Business name",
	"videoURLHint": "Your video URL",
	"descriptionHint": "Description of the Business",
	"processingMedia": "Processing media link. Please wait...",
	"noMediaFound": "No media content was detected. The link will be displayed as is."
};

plugin.init = function() {
	var self = this;

	// replace the whole template
	this.extendTemplate("replace", "container", plugin.templates.main);

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
			"description": valueOf("description")
		});
		args.postData.content.push(
			submit._getActivity("tag", submit._getASURL("marker"), "alpha:" + marker)
		);
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		var self = this;
		// reset fields after successful submission...
		$.map(["businessName", "videoURL", "description"], function(name) {
			self.view.render({"name": name});
		});
		this.set("mediaContent", "");
		this.view.get("videoPreview").hide();
	}
};

plugin.templates.main =
	'<div class="{class:container}">' +
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
			'<div class="{class:postContainer}">' +
				'<div class="btn echo-primaryFont {class:postButton}"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

plugin.component.renderers.name =
plugin.component.renderers.text = function(element) {
	return element.val("-"); // define fake value to pass validations
};

plugin.component.renderers.postButton = function(element) {
	this.parentRenderer("postButton", arguments);
// TODO: disable button if the user is not logged in?
//	if (!this.component.user.is("logged")) {
//		element.attr("disabled", true).off("click");
//	}
	return element;
};

plugin.renderers.businessName = function(element) {
	return this._putHint(element, "businessName");
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
			"url": link,
			"maxwidth": self.config.get("videoMaxWidth"),
			"format": "json"
		}, function(response) {
			preview.empty();
			response = response || {};
			switch (response.type) {
				case "video":
					self.set("mediaContent", response.html);
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
	return this._putHint(element, "description");
};

plugin.methods._putHint = function(element, label) {
	return element.val("").blur().iHint({
		"text": this.labels.get(label + "Hint"),
		"className": "echo-secondaryColor"
	});
};

plugin.css =
	'.echo-sdk-ui .echo-streamserver-controls-submit-mandatory { border: 1px solid red; }' +
	'.{class:postContainer} { float: left; }' +
	'.echo-sdk-ui input[type="text"].{plugin.class:input}, .echo-sdk-ui textarea.{plugin.class:input} { outline: 0 !important; box-shadow: none !important; padding: 0px; margin: 0px; border: 0px; width: 100%; }' +
	'.echo-sdk-ui .echo-streamserver-controls-submit-plugin-CustomSubmitForm-input.echo-secondaryColor { color: #DDDDDD; }' +
	'.echo-streamserver-controls-submit-plugin-CustomSubmitForm-noMediaFound { color: red; }' +
	'.{plugin.class:inputContainer} { margin: 5px 0px; padding: 3px 5px; border: 1px solid #DDDDDD; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
