// TODO: all strings should be place in the labels!
(function(jQuery) {
"use strict";

var $ = jQuery;

if (!Echo.CrowdRules) Echo.CrowdRules = {};

if (!Echo.CrowdRules.Controls) Echo.CrowdRules.Controls = {};

var sorter = Echo.Control.manifest("Echo.CrowdRules.Controls.AlphabeticalSorter");

if (Echo.Control.isDefined(sorter)) return;

sorter.vars = {
	"items": [],
	"currentItemId": ""
};

sorter.init = function() {
	this._assembleItems();
	this.render();
	this.ready();
};

sorter.templates.main =
	'<div class="{class:container}">' +
		'<div id="all" class="{class:allItems}">ALL</div>' +
		'<div class="{class:items}"></div>' +
		'<div id="other" class="{class:otherItems}">OTHER</div>' +
	'</div>';

sorter.templates.item =
	'<span id="{data:id}" class="{class:item}"> {data:title} </span>';

sorter.renderers.allItems = function(element) {
	var self = this;
	return element
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this).attr("id"));
		});
};

sorter.renderers.otherItems = function(element) {
	var self = this;
	return element
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this).attr("id"));
		});
};

sorter.renderers.items = function(element) {
	var self = this;
	element.empty();
	$.map(this.get("items"), function(item) {
		if (!~$.inArray(item.id, ["all", "other"])) {
			// TODO: can we use view.fork() there (instead of substitute) ?
			element.append($(self.substitute({
				"template": sorter.templates.item,
				"data": item
			})).off("click").on("click", function() {
				self._itemClickHandler($(this).attr("id"));
			}));
		}
	});
	return element;
};

sorter.methods._itemClickHandler = function(clickedItemId) {
	var self = this;
	if (this.get("currentItemId") !== clickedItemId) {
		$.each(this.get("items"), function(key, item) {
			if (item.id === clickedItemId) {
				self.set("currentItemId", item.id);
				item["handler"].call(item);
				return false;
			}
		});
	}
};

sorter.methods._assembleItems = function() {
	var items = [], self = this;
	var handler = function() {
		self.events.publish({
			"topic": "onItemChoose",
			"data": this
		});
	};
	items.push({
		"id": "all",
		"title": "ALL",
		"handler": handler
	});
	for (var i = 97; i <= 122; i++) {
		var key = String.fromCharCode(i);
		items.push({
			"id": key,
			"title": key.toUpperCase(),
			"handler": handler
		});
	};
	items.push({
		"id": "other",
		"title": "OTHER",
		"handler": handler
	});
	this.set("items", items);
	this.set("currentItemId", "all");
};

sorter.css = '';
/*	'.{class:allItems} { float: left; }' +
	'.{class:items} { float: left; }' +
	'.{class:otherItems} { float: left; }';
*/
Echo.Control.create(sorter);

})(Echo.jQuery);
