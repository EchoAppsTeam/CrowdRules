// TODO: all strings should be place in the labels!
(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("AlphabeticalSorter", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {};

plugin.labels = {};

plugin.init = function() {
	this.set("items", []);
	this.set("query", this.component.config.get("query"));
	this._assembleItems();
	this.extendTemplate("insertBefore", "header", plugin.templates.main);
};

plugin.templates.main =
	'<div class="{plugin.class:container}">' +
		'<div id="all" class="{plugin.class:allItems}">ALL</div>' +
		'<div class="{plugin.class:items}"></div>' +
		'<div id="other" class="{plugin.class:otherItems"}>OTHER</div>' +
	'</div>';

plugin.templates.item =
	'<span id="{data:id}" class="{plugin.class:item}"> {data:title} </span>';

plugin.renderers.allItems = function(element) {
	var self = this;
	return element
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this).attr("id"));
		});
};

plugin.renderers.otherItems = function(element) {
	var self = this;
	return element
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this).attr("id"));
		});
};

plugin.renderers.items = function(element) {
	var self = this;
	element.empty();
	$.map(this.get("items"), function(item) {
		if (!~$.inArray(item.id, ["all", "other"])) {
			// TODO: can we use view.fork() there (instead of substitute) ?
			element.append($(self.substitute({
				"template": plugin.templates.item,
				"data": item
			})).off("click").on("click", function() {
				self._itemClickHandler($(this).attr("id"));
			}));
		}
	});
	return element;
};

plugin.methods._itemClickHandler = function(clickedItemId) {
	var self = this, stream = this.component;
	if (this.get("currentItemId") !== clickedItemId) {
		$.each(this.get("items"), function(key, item) {
			if (item.id === clickedItemId) {
				self.set("currentItemId", item.id);
				item["handler"].call(item);
				return false;
			}
		});
		stream.refresh();
	}
};

plugin.methods._assembleItems = function() {
	var items = [], self = this, stream = this.component;
	items.push({
		"id": "all",
		"title": "ALL",
		"handler": function() {
			stream.config.set("query", self.get("query"));
		}
	});
	for (var i = 97; i <= 122; i++) {
		var key = String.fromCharCode(i);
		items.push({
			"id": key,
			"title": key.toUpperCase(),
			"handler": function() {
				stream.config.set("query", self._addMarkerToQuery(self.get("query"), this.id));
			}
		});
	};
	items.push({
		"id": "other",
		"title": "OTHER",
		"handler": function() {
			stream.config.set("query", self._addMarkerToQuery(self.get("query"), this.id));
		}
	});
	this.set("items", items);
	this.set("currentItemId", "all");
};

plugin.methods._addMarkerToQuery = function(query, marker) {
	return query + " markers:\"alpha:" + marker + "\"";
};

plugin.css =
	'.{plugin.class:allItems} { float: left; }' +
	'.{plugin.class:items} { float: left; }' +
	'.{plugin.class:otherItems} { float: left; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
