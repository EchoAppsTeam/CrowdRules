module.exports = function(grunt) {
	"use strict";

	var shared = require("./grunt/lib.js").init(grunt);

	var _ = grunt.utils._;
	var path = require("path");

	var dirs = {
		"build": "build",
		"src": "src",
		"dest": "web",
		"dist": "web"
	};

	var sources = {
		"app": {
			"js": [
				"<%= dirs.src %>/**/*.js"
			],
			"html": [
				"<%= dirs.src %>/**/*.html"
			],
			"images": [
				"<%= dirs.src %>/**/*.png",
				"<%= dirs.src %>/**/*.jpg",
				"<%= dirs.src %>/**/*.gif"
			]
		},
		"demo": ["demo/**"]
	};

	var destinations = {
		"app": {
			"min": "<%= dirs.dest %>",
			"dev": "<%= dirs.dest %>/dev",
			"final": "<%= dirs.dest %>"
		}
	};

	var packs = {
		"app": {
			"src": [
				"**/!(init)*.js"
			],
			"dest": "crowd-rules.pack.js"
		}
	};

	var _config = {
		dirs: dirs,
		sources: sources,
		destinations: destinations,
		packs: packs,
		pkg: "<json:package.json>",
		local: "<json:grunt/local.json>",
		clean: {
			build: [
				"<%= dirs.build %>"
			],
			nonpacks: [
				"<%= dirs.build %>/controls",
				"<%= dirs.build %>/plugins",
				"<%= dirs.build %>/crowd-rules.js"
			],
			all: [
				"<%= dirs.dist %>",
				"<config:clean.build>"
			]
		},
		patch: {
			"init": {
				files: [
					"<%= dirs.build %>/init.js",
				],
				patcher: "urlsInit"
			},
			"urls": {
				files: [
					"<%= dirs.build %>/crowd-rules.js"
				],
				patcher: "urls"
			},
			"demo": {
				files: [
					"<%= dirs.build %>**/*.html"
				],
				patcher: "urls"
			}
		},
		copy: {},
		min: {},
		concat: {},
		uglify: {
			codegen: {
				ascii_only: true
			}
		}
	};

	grunt.initConfig(_config);

	// tasks

	grunt.loadNpmTasks("grunt-contrib");
	grunt.loadTasks("grunt/tasks");

	grunt.registerTask("default", "clean:all build:app");

	grunt.registerTask("build", "Go through all stages of building some target/system", function(target, stage) {
		if (!stage) {
			var tasks = ["build:" + target + ":dev"];
			if (shared.config("env") !== "dev") {
				tasks.push("build:" + target + ":min");
			}
			tasks.push("build:" + target + ":final");
			grunt.task.run(tasks);
			return;
		}
		grunt.config("copy", {});
		grunt.config("min", {});
		grunt.config("concat", {});
		shared.config("build", {
			"target": target,
			"stage": stage
		});
		_makeCopySpec();
		var tasks = "";
		switch (stage) {
			case "dev":
				_makeConcatSpec();
				tasks = "copy:js copy:html patch:init patch:urls concat clean:nonpacks copy:build";
				break;
			case "min":
				_makeMinSpec();
				_makeConcatSpec();
				tasks = "copy:js copy:html patch:init patch:urls min concat clean:nonpacks copy:build";
				break;
			case "final":
				tasks = "copy:images copy:demo patch:demo copy:build";
				break;
		}
		grunt.task.run(tasks + " clean:build");
	});

	grunt.registerMultiTask("patch", "Patching files", function() {
		var self = this;
		var files = this.data.files;
		var config = grunt.config("local");
		grunt.file.expandFiles(files).map(function(file) {
			grunt.log.write("Patching \"" + file + "\"...");
			var src = grunt.file.read(file);
			src = patchers[self.data.patcher](src, config);
			grunt.file.write(file, src);
			grunt.log.ok();
		});
	});

	var patchers = {
		"urlsInit": function(src, config) {
			var env = shared.config("env");
			if (env !== "production") {
				src = src.replace(
					/cdn\.echoenabled\.com\/apps\/echo\/crowd-rules/g,
					config.domain
				);
			}
			return src;
		},
		"urls": function(src, config) {
			var env = shared.config("env");
			if (env !== "production") {
				src = src.replace(
					/cdn\.echoenabled\.com\/apps\/echo\/crowd-rules/g,
					function(str, p) {
						return config.domain + (env === "dev" && src.slice(p + str.length, p + str.length + 7) !== "/images" ? "/dev" : "")
					}
				);
			}
			return src;
		}
	};

	var reRelative = new RegExp(dirs.src + "/");

	function _makeCopySpec() {
		var target = shared.config("build.target");
		var stage = shared.config("build.stage");
		var spec = {};
		if (stage === "final") {
			spec["images"] = {
				"files": {
					 "<%= dirs.build %>": grunt.config("sources." + target + ".images")
				},
				"options": {
					"basePath": "<config:dirs.src>"
				}
			};
			spec["demo"] = {
				"files": {
					"<%= dirs.build %>": grunt.config("sources.demo")
				},
				"options": {
					"basePath": "demo"
				}
			};
		} else {
			spec["js"] = {
				"files": {
					"<%= dirs.build %>": grunt.config("sources." + target + ".js")
				},
				"options": {
					"basePath": "<config:dirs.src>"
				}
			};
			spec["html"] = {
				"files": {
					"<%= dirs.build %>": grunt.config("sources." + target + ".html")
				},
				"options": {
					"basePath": "<config:dirs.src>"
				}
			};
		}
		spec["build"] = {
			"files": {},
			"options": {
				"basePath": "<config:dirs.build>"
			}
		};
		spec["build"].files[grunt.config("destinations." + target + "." + stage)] = ["<%= dirs.build %>/**"];
		grunt.config("copy", spec);
	};

	function _makeMinSpec() {
		var spec = {};
		var copy = grunt.config("copy");
		_.each(copy.js.files, function(src, dest) {
			grunt.file.expandFiles(src).map(function(name) {
				name = name.replace(reRelative, "");

				// exclude JS files from "third-party"
				// folder from minification
				if (/third-party/.test(name)) return;

				spec[name] = {
					"src": "<%= dirs.build %>/" + name,
					"dest": "<%= dirs.build %>/" + name
				};
			});
		});
		grunt.config("min", spec);
	};

	function _makeConcatSpec() {
		var target = shared.config("build.target");
		var stage = shared.config("build.stage");
		var spec = {};
		var prependDir = function(name) {
			return "<%= dirs.build %>/" + name;
		};
		_.each(grunt.config("packs"), function(pack, key) {
			spec[key] = {
				"src": pack.src.map(prependDir),
				"dest": "<%= dirs.build %>/" + pack.dest
			};
		});
		grunt.config("concat", spec);
	};
};
