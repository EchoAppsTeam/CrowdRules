Echo.Loader.initApplication({
	"scripts": {
		"dev": "http://cdn.echoenabled.com/apps/echo/crowd-rules/dev/crowd-rules.pack.js",
		"prod": "http://cdn.echoenabled.com/apps/echo/crowd-rules/crowd-rules.pack.js"
	},
	"component": "Echo.Apps.CrowdRules",
	"backplane": {
		"serverBaseURL": "http://api.echoenabled.com/v1",
		"busName": "cnbc"
	},
	"config": {
		"target": document.getElementById("echo-crowd-rules-app-content"),
		"appkey": "echo.echo.streamserver.cnbc.prod",
		"rpxAppName": "cnbc-echo",
		"targetURL": "http://cnbc.com/crowdrules",
		"stageIndex": typeof stage !== "undefined" ? stage : 0,
		"ready": function() {
			if (/(wwww\.)?cnbc\.com/.test(document.domain)) {
				Echo.jQuery("<iframe>")
					.attr({
						"width": 1,
						"height": 1,
						"frameboarder": 0,
						"style": "display:none",
						"src": "http://2187941.fls.doubleclick.net/activityi;src=2187941;type=cnbcp125;cat=crowd771;ord=" + (Math.random() * 10000000000000) + "?"
					})
					.insertAfter(this.config.get("target"));
			}
		}
	}
});
