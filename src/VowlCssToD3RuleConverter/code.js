import { parse } from "css"
import { readFile } from "fs"
const filePath = "../main/app/css/vowl.css"

readFile(filePath, { encoding: "utf8" }, function (err, data) {
    if (err) {
        console.log(err)
    } else {
        console.log("// inline vowl styles")
        console.log(convertCssToD3Rules(data))
        console.log("\n// remove inline vowl styles")
        console.log(createInlineStyleRemoveCommand(data))
    }
})

/**
 * @param {string} cssText
 */
function createInlineStyleRemoveCommand(cssText) {
    /**
     * @type {string[]}
     */
    let selectors = []
    const obj = parse(cssText)
    const rules = obj.stylesheet.rules

    for (const rule of rules) {
        if (rule.type === "rule") {
            selectors = selectors.concat(rule.selectors)
        }
    }
    return 'd3.selectAll("'.concat(selectors.join(", "), '")')
}

/**
 * @param {string} cssText
 */
function convertCssToD3Rules(cssText) {
    let d3Rules = ""
    const obj = parse(cssText)
    const rules = obj.stylesheet.rules

    for (const rule of rules) {
        if (rule.type === "rule") {
            const builder = d3RuleBuilder()
            const selectors = rule.selectors
            const declarations = rule.declarations

            builder.selectors(selectors)
            for (let i = 0, l = declarations.length; i < l; i++) {
                const declaration = declarations[i]
                if (declaration.type === "declaration") {
                    builder.addRule(declaration.property, declaration.value)
                }
            }
            d3Rules += builder.build() + "\n"
        }
    }
    return d3Rules
}

function d3RuleBuilder() {
    const builder = {}
    let selector = ""
    /**
     * @type {{ name: string, value: any }[]}
     */
    const rules = []

    builder.selectors = function (/** @type {string | any[]} */ selectors) {
        if (!arguments.length) return selector

        if (selectors instanceof Array) {
            selector = selectors.join(", ")
        } else {
            selector = selectors
        }

        return builder
    }

    builder.addRule = function (
        /** @type {string} */ name,
        /** @type {any} */ value,
    ) {
        rules.push({ name: name, value: value })
        return builder
    }

    builder.build = function () {
        let result = 'setStyleSensitively("' + selector + '", ['

        for (let i = 0, l = rules.length; i < l; i++) {
            if (i > 0) {
                result = result.concat(", ")
            }
            const rule = rules[i]
            result = result.concat(
                '{name:"',
                rule.name,
                '", value:"',
                rule.value,
                '"}',
            )
        }
        return result.concat("]);")
    }
    return builder
}
