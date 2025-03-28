let css = require("css"),
	fs = require("fs"),
	filePath = "../../src/webvowl/css/vowl.css";

fs.readFile(filePath, { encoding: "utf8" }, function (err, data) {
	if (err) {
		console.log(err);
	} else {
		console.log("// inline vowl styles");
		console.log(convertCssToD3Rules(data));
		console.log("\n// remove inline vowl styles");
		console.log(createInlineStyleRemoveCommand(data));
	}
});

function createInlineStyleRemoveCommand(cssText) {
	let selectors = [],
		obj = css.parse(cssText),
		rules = obj.stylesheet.rules;

	rules.forEach(function (rule) {
		if (rule.type === "rule") {
			selectors = selectors.concat(rule.selectors);
		}
	});

	return "d3.selectAll(\"".concat(selectors.join(", "), "\")");
}

function convertCssToD3Rules(cssText) {
	let d3Rules = "",
		obj = css.parse(cssText),
		rules = obj.stylesheet.rules;


	rules.forEach(function (rule) {
		if (rule.type === "rule") {
			let builder = d3RuleBuilder(),
				selectors = rule.selectors,
				declarations = rule.declarations,
				declaration;

			builder.selectors(selectors);
			for (let i = 0, l = declarations.length; i < l; i++) {
				declaration = declarations[i];
				if (declaration.type === "declaration") {
					builder.addRule(declaration.property, declaration.value);
				}
			}

			d3Rules = d3Rules.concat(builder.build(), "\n");
		}
	});

	return d3Rules;
}

function d3RuleBuilder() {
	let builder = {},
		selector = "",
		rules = [];

	builder.selectors = function (selectors) {
		if (!arguments.length) return selector;

		if (selectors instanceof Array) {
			selector = selectors.join(", ");
		} else {
			selector = selectors;
		}

		return builder;
	};

	builder.addRule = function (name, value) {
		rules.push({ name: name, value: value });
		return builder;
	};

	builder.build = function () {
		let result = "setStyleSensitively(\"" + selector + "\", [";

		for (let i = 0, l = rules.length; i < l; i++) {
			if (i > 0) {
				result = result.concat(", ");
			}
			let rule = rules[i];
			result = result.concat("{name:\"", rule.name, "\", value:\"", rule.value, "\"}");
		}
		result = result.concat("]);");

		return result;
	};

	return builder;
}
