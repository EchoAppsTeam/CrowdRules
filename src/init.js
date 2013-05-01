// get rid of domainPrefix after uploading CrowdRules application on CDN
var domainPrefix = "";

var identityManagerItem = {
	"width": 400,
	"height": 250,
	"url": "https://echo.rpxnow.com/openid/embed?flags=stay_in_window,no_immediate&token_url=http%3A%2F%2Fechoenabled.com%2Fapps%2Fjanrain%2Fwaiting.html&bp_channel="
};

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
		"submit": {
			"plugins": [{
				"name": "FormAuth",
				"identityManager": {
					"login": identityManagerItem,
					"signup": identityManagerItem
				}
			}]
		}
	}
});
