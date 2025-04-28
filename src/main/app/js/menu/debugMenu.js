import Graph from "../../../webvowl/js/graph"

export default class DebugMenu {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {d3.Selection<HTMLInputElement, any, HTMLElement, any>[]}
         */
        this.checkboxes = []
        this.hoverFlag = false
        /**
         * @type {d3.Selection<HTMLInputElement, any, HTMLElement, any> | null}
         */
        this.specialCbx = null
    }

    setup() {
        const menuEntry = d3.select("#debugMenuHref")
        menuEntry.on("mouseover", () => {
            if (!this.hoverFlag) {
                const searchMenu = this.graph.options.searchMenu
                searchMenu.hideSearchEntries()
                this.specialCbx.node().click()
                if (this.graph.editorMode === false) {
                    d3.select("#useAccuracyHelper").style("color", "#979797")
                    d3.select("#useAccuracyHelper").style(
                        "pointer-events",
                        "none",
                    )

                    d3.select("#showDraggerObject").style("color", "#979797")
                    d3.select("#showDraggerObject").style(
                        "pointer-events",
                        "none",
                    )
                } else {
                    d3.select("#useAccuracyHelper").style("color", "#2980b9")
                    d3.select("#useAccuracyHelper").style(
                        "pointer-events",
                        "auto",
                    )
                }
                this.hoverFlag = true
            }
        })

        menuEntry.on("mouseout", () => {
            this.hoverFlag = false
        })

        this.specialCbx = this.addCheckBox(
            "useAccuracyHelper",
            "Use accuracy helper",
            "#useAccuracyHelper",
            (val) => {
                if (val === undefined)
                    return this.graph.options.useAccuracyHelper
                else this.graph.options.useAccuracyHelper = val
            },
            (/** @type {boolean} */ enabled, /** @type {boolean} */ silent) => {
                if (!enabled) {
                    d3.select("#showDraggerObject").style("color", "#979797")
                    d3.select("#showDraggerObject").style(
                        "pointer-events",
                        "none",
                    )
                    // @ts-ignore
                    d3
                        .select("#showDraggerObjectConfigCheckbox")
                        .node().checked = false
                } else {
                    d3.select("#showDraggerObject").style("color", "#2980b9")
                    d3.select("#showDraggerObject").style(
                        "pointer-events",
                        "auto",
                    )
                }

                if (silent) {
                    return
                }
                this.graph.lazyRefresh()
                this.graph.updateDraggerElements()
            },
        )
        this.addCheckBox(
            "showDraggerObject",
            "Show accuracy helper",
            "#showDraggerObject",
            (val) => {
                if (val === undefined)
                    return this.graph.options.showDraggerObject
                else this.graph.options.showDraggerObject = val
            },
            (
                /** @type {boolean} */ _enabled,
                /** @type {boolean} */ silent,
            ) => {
                if (silent) {
                    return
                }
                this.graph.lazyRefresh()
                this.graph.updateDraggerElements()
            },
        )
        this.addCheckBox(
            "showFPS_Statistics",
            "Show rendering statistics",
            "#showFPS_Statistics",
            (val) => {
                if (val === undefined)
                    return this.graph.options.showRenderingStatistic
                else this.graph.options.showRenderingStatistic = val
            },
            (/** @type {boolean} */ enabled, /** @type {any} */ _silent) => {
                if (!this.graph.options.hideDebugOptions) {
                    d3.select("#FPS_Statistics").classed("hidden", !enabled)
                } else {
                    d3.select("#FPS_Statistics").classed("hidden", true)
                }
            },
        )
        this.addCheckBox(
            "showModeOfOperation",
            "Show input modality",
            "#showModeOfOperation",
            (val) => {
                if (val === undefined)
                    return this.graph.options.showInputModality
                else this.graph.options.showInputModality = val
            },
            (enabled) => {
                if (!this.graph.options.hideDebugOptions) {
                    d3.select("#modeOfOperationString").classed(
                        "hidden",
                        !enabled,
                    )
                } else {
                    d3.select("#modeOfOperationString").classed("hidden", true)
                }
            },
        )
    }

    /**
     * @param {string} identifier
     * @param {any} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     * @param {(enabled: boolean, silent: boolean) => void} callbackFunction
     */
    addCheckBox(
        identifier,
        modeName,
        selector,
        onChangeFunc,
        callbackFunction,
    ) {
        const configOptionContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true)
        const configCheckbox = configOptionContainer
            .append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ConfigCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc())
        configCheckbox.on("click", (silent) => {
            const isEnabled = configCheckbox.property("checked")
            onChangeFunc(isEnabled)
            callbackFunction(isEnabled, silent)
        })

        this.checkboxes.push(configCheckbox)
        configOptionContainer
            .append("label")
            .attr("for", identifier + "ConfigCheckbox")
            .text(modeName)
        return configCheckbox
    }

    /**
     * @param {string} identifier
     * @param {boolean} value
     */
    setCheckBoxValue(identifier, value) {
        for (const checkbox of this.checkboxes) {
            const cbdId = checkbox.attr("id")
            if (cbdId === identifier) {
                checkbox.property("checked", value)
                break
            }
        }
    }

    /**
     * @param {string} id
     */
    getCheckBoxValue(id) {
        for (const checkbox of this.checkboxes) {
            const cbdId = checkbox.attr("id")
            if (cbdId === id) {
                return checkbox.property("checked")
            }
        }
    }

    updateSettings() {
        d3.selectAll(".debugOption").classed(
            "hidden",
            this.graph.options.hideDebugOptions,
        )

        const silent = true
        this.checkboxes.forEach((checkbox) => {
            checkbox.on("click")(silent)
        })

        if (!this.graph.editorMode) {
            d3.select("#useAccuracyHelper").style("color", "#979797")
            d3.select("#useAccuracyHelper").style("pointer-events", "none")

            d3.select("#showDraggerObject").style("color", "#979797")
            d3.select("#showDraggerObject").style("pointer-events", "none")
        } else {
            d3.select("#useAccuracyHelper").style("color", "#2980b9")
            d3.select("#useAccuracyHelper").style("pointer-events", "auto")
        }
    }
}
