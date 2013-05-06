// get rid of domainPrefix after uploading CrowdRules application on CDN
var domainPrefix = "";

Echo.Loader.initApplication({
	"script": domainPrefix + "/crowd-rules.js",
	"component": "Echo.Apps.CrowdRules",
	"backplane": {
		"serverBaseURL": "http://api.echoenabled.com/v1",
		"busName": "cnbc"
	},
	"config": {
		"domainPrefix": domainPrefix,
		"target": document.getElementById("echo-crowd-rules-app-content"),
		"appkey": "echo.echo.streamserver.cnbc.prod",
		"rpxAppName": "cnbc-echo.rpxnow.com"
	}
});
