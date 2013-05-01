(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("CustomSubmitForm", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.labels = {
	"businessNameHint": "Your Business name",
	"videoURLHint": "Your video URL",
	"descriptionHint": "Description of the Business",
};

plugin.init = function() {
	var self = this;

	// replace the whole template
	this.extendTemplate("replace", "container", plugin.template)

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
		var content =
		'<div class="video-container">' +
			'<div class="business-name">' + businessName + '</div>' +
			'<div class="posted-by">Posted by: ' + submit.user.get("name") + '</div>' +
			'<div class="video-embed-code">' + valueOf("videoURL") + '</div>' +
			'<div class="video-description">' + valueOf("description") + '</div>' +
		'</div>';
		args.postData.content[0].object.content = content;
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
	}
};

plugin.template =
	'<div class="{class:container}">' +
		'<div>' +
			'<input class="{plugin.class:businessName} {plugin.class:input}" type="text">' +
		'</div>' +
		'<div>' +
			'<input class="{plugin.class:videoURL} {plugin.class:input}" type="text">' +
		'</div>' +
		'<div class="{plugin.class:videoPreview}"></div>' +
		'<div>' +
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
	return this._putHint(element, "videoURL");
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
	'.{class:postContainer} { float: left; margin-bottom: 20px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
