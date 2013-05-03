(function($) {

if (Echo.Router) return;

Echo.Router = function(config) {
	if (!config) return;
	$.extend(this, config);
	this.config.routes = this.config.routes || {};
	$.each(this.config.routes, function(name, route) {
		var params = [];
		var re = route.spec.replace(/({(\w+)})/g, function($0, $1, $2) {
			params.push($2);
			return "([^/]+)";
		});
		route.paramNames = params;
		route.matcher = new RegExp("^" + re + "(?=/|$)");
	});
	this.reOwnRoute = new RegExp("^" + this.config.route.prefix + "(?=/|$)");
	this.parseRoute(this.config.route.path);
};

Echo.Router.prototype.navigate = function(route, options) {
	options = options || {};
	if (!options.absolute) {
		route = this.config.route.prefix + route;
	}
	Echo.URLObserver.navigate(route);
	if (options.reflectHashOnly) return;
	if (options.local) {
		this.applyRoute(route);
	} else {
		Echo.Events.publish({
			"topic": "onRouteChange",
			"data": {
				"route": route
			}
		});
	}
	if (options.targetElement) {
		var offset = $(options.targetElement).offset();
		if (offset && $(window).scrollTop() > offset.top) {
			$("html,body").animate({"scrollTop": offset.top}, 200);
		}
	}
};

Echo.Router.prototype.parseRoute = function(route) {
	var self = this;
	route = route || "";
	route = route.replace(this.config.route.prefix, "");
	this.route = {
		"name": "",
		"path": route,
		"params": {}
	};
	$.each(this.config.routes, function(name, routeSpec) {
		var params = route.match(routeSpec.matcher);
		if (params) {
			self.route.name = name;
			$.each(params.slice(1), function(i, value) {
				self.route.params[routeSpec.paramNames[i]] = value;
			});
			return false; // break
		}
	});
	// if no registered route handler was found we should use default one
	if (!this.route.name) {
		//this.parseRoute(this.config.route.prefix + this.config.route.local.path);
	}
};

Echo.Router.prototype.applyRoute = function(route) {
	if (route) {
		if (!this.reOwnRoute.test(route)) return false;
		this.parseRoute(route);
	}
	this.config.routes[this.route.name].handler.call(this.widget, this.route.params);
	return true;
};

})(Echo.jQuery);
