(function($) {

if (Echo.URLObserver) return;

Echo.URLObserver = function() {};

var hashStrip = /^#*/;
var started = false;
var isExplorer = /msie [\w.]+/;
var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!document.documentMode || document.documentMode <= 7));

Echo.URLObserver.getFragment = function(fragment) {
	if (fragment == null) {
		fragment = window.location.hash;
	}
	return decodeURIComponent(fragment.replace(hashStrip, ""));
};

Echo.URLObserver.start = function() {
	if (started) return;
	started = true;
	var fragment = this.getFragment();
	if (oldIE) {
		this.iframe = $('<iframe src="about:blank" tabindex="-1" />').hide().appendTo("body")[0].contentWindow;
		this.navigate(fragment);
	}

	var self = this;
	var checkUrl = function() {	self.checkUrl(); };
	if ("onhashchange" in window && !oldIE) {
		$(window).bind("hashchange", checkUrl);
	} else {
		setInterval(checkUrl, 50);
	}

	this.fragment = fragment;
};

Echo.URLObserver.stop = function() {
	location.hash = "!";
	if (!started) return;
	started = false;
	delete this.iframe;
	delete this.fragment;
	if ("onhashchange" in window && !oldIE) {
		$(window).unbind("hashchange");
	}
};

Echo.URLObserver.checkUrl = function() {
	var current = this.getFragment();
	if (current == this.fragment && this.iframe) {
		current = this.getFragment(this.iframe.location.hash);
	}
	if (current == this.fragment || current == decodeURIComponent(this.fragment)) {
		return;
	}
	if (this.iframe) this.navigate(current);
	this.fragment = current;
	Echo.Events.publish({
		"topic": "onRouteChange",
		"data": {
			"route": current
		}
	});
};

// function does not trigger a 'hashchange' event
Echo.URLObserver.navigate = function(fragment) {
	var frag = (fragment || "").replace(hashStrip, "");
	if (this.fragment == frag || this.fragment == decodeURIComponent(frag)) return;
	window.location.hash = this.fragment = frag;
	if (this.iframe && (frag != this.getFragment(this.iframe.location.hash))) {
		this.iframe.document.open().close();
		this.iframe.location.hash = frag;
	}
};

})(Echo.jQuery);
