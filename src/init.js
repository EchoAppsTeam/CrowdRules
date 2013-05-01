// get rid of domainPrefix after uploading CrowdRules application on CDN
var domainPrefix = "http://localhost/demo/crowd-rules/src";

Echo.Loader.initApplication({
	"script": domainPrefix + "/crowd-rules.js",
	"component": "Echo.Apps.CrowdRules",
	"backplane": {
		"serverBaseURL": "http://api.echoenabled.com/v1",
		"busName": "jskit"
	},
	"config": {
		"domainPrefix": domainPrefix,
		"target": document.getElementById("content"),
		"appkey": "test.echoenabled.com",
		"rpxAppName": "echo.rpxnow.com"
	}
});
