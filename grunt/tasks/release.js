module.exports = function(grunt) {

	var shared = require("../lib.js").init(grunt);

	var Ftp = require("ftp");
	var fs = require("fs");
	var http = require("http");
	var path = require("path");
	var _ = grunt.utils._;

	var FtpUploader = function(config) {
		var self = this;
		this.config = config;
		this.client = new Ftp({
			host: config.auth.host,
			port: config.auth.port,
			connTimeout: 600000 // 10 minutes
		});
		this.client.on("connect", function() { self.start(); });
		this.client.connect();
	};

	FtpUploader.prototype.start = function() {
		var self = this;
		this.client.auth(this.config.auth.user, this.config.auth.password, function(err) {
			if (err) {
				self._error(err);
				return;
			}

			self.queue = [];
			var processedDirs = {};
			var dirs = [];
			var files = [];
			var recursiveAdd = function(dir) {
				var name = "/";
				var parts = dir.split("/");
				// remove first and last elements because they are empty
				parts.pop();
				parts.shift();
				_.each(parts, function(n) {
					name += n + "/";
					if (!processedDirs[name]) {
						processedDirs[name] = true;
						dirs.push(name);
					}
				});
			};
			_.each(self.config.uploads, function(upload) {
				var baseSrcPath = grunt.template.process(upload.baseSrcPath);
				var dest = grunt.template.process(upload.dest);
				if (shared.config("env") === "staging") {
					dest = "/tests/release" + dest;
				}
				var src = grunt.file.expandFiles(baseSrcPath + upload.src);
				src.sort();
				_.each(src, function(srcName) {
					var name = srcName.replace(baseSrcPath, "")
					var destName = dest + name;
					files.push({
						"src": srcName,
						"dest": destName
					});
					recursiveAdd(path.dirname(destName) + "/");
				});
			});
			dirs.sort();
			_.each(dirs, function(dir) {
				self.enqueue("makeDir", dir);
			});
			_.each(files, function(file) {
				self.enqueue("uploadFile", file);
			});
			!shared.config("debug") && grunt.verbose.writeln("Starting upload");
			self.currentStep = 1;
			self.totalSteps = self.queue.length;
			self._next();
		});
	};

	FtpUploader.prototype.enqueue = function() {
		var args = _.toArray(arguments);
		var name = args.shift();
		this.queue.push(function() {
			this["_" + name].apply(this, args);
		});
	};

	FtpUploader.prototype._uploadFile = function(file) {
		var self = this;
		this._log(file.dest);
		if (shared.config("debug")) {
			this._next();
			return;
		}
		this.client.put(fs.createReadStream(file.src), file.dest, function(err) {
			if (err) {
				self._error(err);
			} else {
				self._next();
			}
		});
	};

	FtpUploader.prototype._makeDir = function(name) {
		var self = this;
		this._log(name);
		if (shared.config("debug")) {
			this._next();
			return;
		}
		this.client.mkdir(name, function() {
			self._next();
		});
	};

	FtpUploader.prototype._next = function() {
		if (!this.queue.length) {
			this.config.complete();
			return;
		}
		this.queue.shift().call(this);
	};

	FtpUploader.prototype._log = function(name) {
		grunt.log.writeln(this.currentStep++ + "/" + this.totalSteps + ": " + name);
	};

	FtpUploader.prototype._error = function(text) {
		grunt.log.error(text);
		this.client.end();
		this.config.complete(false);
	};

	grunt.registerInitTask("release", "Release", function() {
		var config = grunt.config("local");
		if (!config || !config.release) {
			grunt.fail.fatal("No configuration for this task.");
		}
		if (!_.contains(["production", "staging"], shared.config("env"))) {
			grunt.fail.fatal("Release can be performed only in \"production\" and \"staging\" environment.");
		}
		// we are pushing code to production so we must delete development configuration
		if (shared.config("env") === "production") {
			delete config.domain;
		} else {
			config.domain = "echosandbox.com/tests/release/apps/echo/crowd-rules";
		}
		var target = this.args[0];
		// TODO: check if we have modified files, we must not release this
		if (!this.args.length) {
			var tasks = [
				"default",
				"release:app"
			];
			if (shared.config("env") === "production") {
				tasks.push("release:purge:CrowdRules");
			}
			shared.config("release", true);
			grunt.task.run(tasks);
			return;
		}

		if (!shared.config("release")) {
			grunt.fail.warn("Release steps shouldn't be executed separately but only as a part of whole release process.");
		}

		// release step can't be build step at the same time
		shared.config("build", null);
		console.time(target.yellow);

		var _complete = this.async();
		var done = function() {
			console.timeEnd(target.yellow);
			_complete();
		};
		var version = grunt.config("pkg.version");
		var majorVersion = version.split(".")[0];
		switch (target) {
			case "purge":
				purgeCDN(["apps/echo/crowd-rules/"], this.args.slice(1).join(), config.release.purger, done);
				break;
			default:
				var uploads = config.release.targets;
				_.each(this.args, function(arg) {
					uploads = uploads[arg];
				});
				if (!uploads || !uploads.length) {
					grunt.log.writeln("Nothing to upload for target ".yellow + target);
					done();
					return;
				}
				var location = shared.config("env") === "production" ? "cdn" : "sandbox";
				console.log("Releasing to " + location);
				new FtpUploader({
					"complete": done,
					"auth": config.release.auth[location],
					"uploads": uploads
				});
				break;
		}
	});

	function purgeCDN(paths, labels, config, done) {
		var xml =
			'<?xml version="1.0" encoding="utf-8"?>' +
			'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
				'<soap:Header>' +
					'<AuthHeader xmlns="http://www.llnw.com/Purge">' +
						'<Username>' + config.user + '</Username>' +
						'<Password>' + config.password + '</Password>' +
					'</AuthHeader>' +
				'</soap:Header>' +
				'<soap:Body>' +
					'<CreatePurgeRequest xmlns="http://www.llnw.com/Purge">' +
					'<request>' +
						'<EmailType>detail</EmailType>' +
						'<EmailSubject>[JS SDK] [Limelight] Code pushed to CDN (' + (labels || "manual purge") + ')</EmailSubject>' +
						'<EmailTo>' + config.emailTo + '</EmailTo>' +
						'<EmailCc>' + (config.emailCC || "") + '</EmailCc>' +
						'<EmailBcc></EmailBcc>' +
						'<Entries>' +
							paths.map(function(path) {
								return '<PurgeRequestEntry>' +
									'<Shortname>' + config.target.name + '</Shortname>' +
									'<Url>' + config.target.url.replace("{path}", path) + '</Url>' +
									'<Regex>true</Regex>' +
								'</PurgeRequestEntry>';
							}).join("") +
						'</Entries>' +
					'</request>' +
					'</CreatePurgeRequest>' +
				'</soap:Body>' +
			'</soap:Envelope>';
		if (shared.config("debug")) {
			console.log(arguments[0], arguments[1]);
			console.log(xml);
			done();
			return;
		}
		var req = http.request({
			"host": config.host,
			"path": config.path,
			"method": "POST",
			"headers": {
				"Content-Type": "text/xml"
			}
		}, function(response) {
			if (response.statusCode === 200) {
				grunt.log.ok();
				done();
			} else if (response.statusCode === 500) {
				response.on("data", function (text) {
					grunt.log.writeln(text);
					grunt.fail.fatal("Can't purge");
				});
			} else {
				grunt.fail.fatal("Can't purge: " + response.statusCode + " error");
			}
		});
		req.on("error", function(e) {
			grunt.fail.fatal("Problem with request: " + e.message);
		});
		req.write(xml);
		req.end();
	};
};
