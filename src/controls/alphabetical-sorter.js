(function(jQuery) {
"use strict";

var $ = jQuery;

if (!Echo.CrowdRules) Echo.CrowdRules = {};

if (!Echo.CrowdRules.Controls) Echo.CrowdRules.Controls = {};

var sorter = Echo.Control.manifest("Echo.CrowdRules.Controls.AlphabeticalSorter");

if (Echo.Control.isDefined(sorter)) return;

sorter.labels = {
	"allItems": "ALL",
	"othersItems": "OTHERS"
};

sorter.vars = {
	"items": [],
	"activeItem": ""
};

sorter.init = function() {
	this._assembleItems();
	this.render();
	this.ready();
};

sorter.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:subcontainer}">' +
			'<div id="{class:item-all}" class="echo-clickable {class:item} {class:allItems}">{label:allItems}</div>' +
			'<div id="{class:item-others}" class="echo-clickable {class:item} {class:othersItems}">{label:othersItems}</div>' +
			'<div class="{class:items}"></div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

sorter.templates.items =
	'<div class="{class:sortItemsContainer}"></div>' +
	'<div class="echo-clear"></div>';

sorter.templates.item =
	'<div id="{data:id}" class="echo-clickable {class:item} {class:sortItem}">{data:title}</div>';

sorter.renderers.allItems = function(element) {
	var self = this;
	this.set("activeItem", element);
	return element
		.addClass(this.cssPrefix + "activeItem")
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this));
		});
};

sorter.renderers.othersItems = function(element) {
	var self = this;
	return element
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this));
		});
};

sorter.renderers.items = function(element) {
	return element
		.empty()
		.append(this.view.fork().render({
			"template": sorter.templates.items
		}));
};

sorter.renderers.sortItemsContainer = function(element) {
	var self = this, view = this.view.fork();
	element.empty();
	$.map(this.get("items"), function(item) {
		if (!~$.inArray(item.id, [self._constructItemId("all"), self._constructItemId("others")])) {
			element.append(view.render({
				"template": sorter.templates.item,
				"data": item
			}));
		}
	});
	return element;
};

sorter.renderers.sortItem = function(element) {
	var self = this;
	return element
		.css({
			"width": (1 / (this.get("items").length - 2) * 100) + "%"
		})
		.off("click")
		.on("click", function() {
			self._itemClickHandler($(this));
		});
};

sorter.methods._itemClickHandler = function(clickedItem) {
	var self = this, activeItem = this.get("activeItem");
	if (this.get("activeItem").attr("id") !== clickedItem.attr("id")) {
		$.each(this.get("items"), function(key, item) {
			if (item.id === clickedItem.attr("id")) {
				self.get("activeItem").removeClass(self.cssPrefix + "activeItem");
				self.set("activeItem", clickedItem);
				clickedItem.addClass(self.cssPrefix + "activeItem");
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
		"id": this._constructItemId(this.labels.get("allItems").toLowerCase()),
		"key": this.labels.get("allItems").toLowerCase(),
		"title": this.labels.get("allItems"),
		"handler": handler
	});
	for (var i = 97; i <= 122; i++) {
		var key = String.fromCharCode(i);
		items.push({
			"id": this._constructItemId(key),
			"key": key,
			"title": key.toUpperCase(),
			"handler": handler
		});
	};
	items.push({
		"id": this._constructItemId(this.labels.get("othersItems").toLowerCase()),
		"key": this.labels.get("otherItems").toLowerCase(),
		"title": this.labels.get("othersItems"),
		"handler": handler
	});
	this.set("items", items);
};

sorter.methods._constructItemId = function(id) {
	return this.cssPrefix + "item-" + id;
};

sorter.css =
	// common containers
	'.{class:container} { line-height: 40px; padding: 10px; border-bottom: 1px solid #dddddd; }' +
	'.{class:subcontainer} { overflow: hidden; }' +
	// item styles
	'.{class:item} { font: 10px Arial; font-weight: normal; text-align: center; float: left; color: #0088CC; text-decoration: none; }' +
	'.{class:item}:hover { text-decoration: underline; }' +
	'.{class:activeItem} { color: #555555; font-weight: bold; }' +
	'.{class:activeItem}:hover { text-decoration: none; }' +
	// items containers
	'.{class:items} { margin: 0px 80px 0px 60px; }' +
	'.{class:othersItems} { width: 70px; float: right; border-left: 1px solid #dddddd; }' +
	'.{class:allItems} { float: left; width: 50px; border-right: 1px solid #dddddd; }';

Echo.Control.create(sorter);

})(Echo.jQuery);
