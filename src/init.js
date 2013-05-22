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
		"stageIndex": typeof stage !== "undefined" ? stage : 0
	}
});
