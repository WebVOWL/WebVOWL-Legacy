import d3 from "d3";

export default class DebugMenu {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph;
        /**
         * @type {any[]}
         */
        this.checkboxes = [];
        this.hoverFlag = false;
        /**
         * @type {any}
         */
        this.specialCbx = null;
    }

    setup() {
        const menuEntry = d3.select("#debugMenuHref");

        menuEntry.on("mouseover", () => {
            if (this.hoverFlag === false) {
                const searchMenu = this.graph.options().searchMenu();
                searchMenu.hideSearchEntries();
                this.specialCbx.node().click();
                if (this.graph.editorMode() === false) {
                    d3.select("#useAccuracyHelper").style("color", "#979797");
                    d3.select("#useAccuracyHelper").style("pointer-events", "none");

                    d3.select("#showDraggerObject").style("color", "#979797");
                    d3.select("#showDraggerObject").style("pointer-events", "none");
                } else {
                    d3.select("#useAccuracyHelper").style("color", "#2980b9");
                    d3.select("#useAccuracyHelper").style("pointer-events", "auto");
                }
                this.hoverFlag = true;
            }
        });

        menuEntry.on("mouseout", () => {
            this.hoverFlag = false;
        });

        this.specialCbx = this.addCheckBox(
            "useAccuracyHelper",
            "Use accuracy helper",
            "#useAccuracyHelper",
            this.graph.options().useAccuracyHelper,
            (/** @type {any} */ enabled, /** @type {boolean} */ silent) => {
                if (!enabled) {
                    d3.select("#showDraggerObject").style("color", "#979797");
                    d3.select("#showDraggerObject").style("pointer-events", "none");
                    // @ts-ignore
                    (d3.select("#showDraggerObjectConfigCheckbox").node()).checked = false;
                } else {
                    d3.select("#showDraggerObject").style("color", "#2980b9");
                    d3.select("#showDraggerObject").style("pointer-events", "auto");
                }

                if (silent === true) return;
                this.graph.lazyRefresh();
                this.graph.updateDraggerElements();
            }
        );

        this.addCheckBox(
            "showDraggerObject",
            "Show accuracy helper",
            "#showDraggerObject",
            this.graph.options().showDraggerObject,
            (/** @type {any} */ _enabled, /** @type {boolean} */ silent) => {
                if (silent === true) return;
                this.graph.lazyRefresh();
                this.graph.updateDraggerElements();
            }
        );

        this.addCheckBox(
            "showFPS_Statistics",
            "Show rendering statistics",
            "#showFPS_Statistics",
            this.graph.options().showRenderingStatistic,
            (/** @type {any} */ enabled, /** @type {any} */ _silent) => {
                if (this.graph.options().getHideDebugFeatures() === false) {
                    d3.select("#FPS_Statistics").classed("hidden", !enabled);
                } else {
                    d3.select("#FPS_Statistics").classed("hidden", true);
                }
            }
        );

        this.addCheckBox(
            "showModeOfOperation",
            "Show input modality",
            "#showModeOfOperation",
            this.graph.options().showInputModality,
            (/** @type {any} */ enabled) => {
                if (this.graph.options().getHideDebugFeatures() === false) {
                    d3.select("#modeOfOperationString").classed("hidden", !enabled);
                } else {
                    d3.select("#modeOfOperationString").classed("hidden", true);
                }
            }
        );
    }

    /**
     * @param {string} identifier
     * @param {string | number | boolean | import("d3-selection").ValueFn<HTMLLabelElement, any, string | number | boolean>} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     * @param {{ (enabled: any, silent: boolean): void; (_enabled: any, silent: boolean): void; (enabled: any, _silent: any): void; (enabled: any): void; (arg0: any, arg1: any): void; }} callbackFunction
     */
    addCheckBox(identifier, modeName, selector, onChangeFunc, callbackFunction) {
        const configOptionContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        const configCheckbox = configOptionContainer
            .append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ConfigCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc());

        configCheckbox.on("click", (silent) => {
            const isEnabled = configCheckbox.property("checked");
            onChangeFunc(isEnabled);
            callbackFunction(isEnabled, silent);
        });

        this.checkboxes.push(configCheckbox);

        configOptionContainer
            .append("label")
            .attr("for", identifier + "ConfigCheckbox")
            .text(modeName);

        return configCheckbox;
    }

    /**
     * @param {string} identifier
     * @param {any} value
     */
    setCheckBoxValue(identifier, value) {
        for (const checkbox of this.checkboxes) {
            const cbdId = checkbox.attr("id");
            if (cbdId === identifier) {
                checkbox.property("checked", value);
                break;
            }
        }
    }

    /**
     * @param {any} id
     */
    getCheckBoxValue(id) {
        for (const checkbox of this.checkboxes) {
            const cbdId = checkbox.attr("id");
            if (cbdId === id) {
                return checkbox.property("checked");
            }
        }
    }

    updateSettings() {
        d3.selectAll(".debugOption").classed(
            "hidden",
            this.graph.options().getHideDebugFeatures()
        );

        const silent = true;
        this.checkboxes.forEach((checkbox) => {
            checkbox.on("click")(silent);
        });

        if (this.graph.editorMode() === false) {
            d3.select("#useAccuracyHelper").style("color", "#979797");
            d3.select("#useAccuracyHelper").style("pointer-events", "none");

            d3.select("#showDraggerObject").style("color", "#979797");
            d3.select("#showDraggerObject").style("pointer-events", "none");
        } else {
            d3.select("#useAccuracyHelper").style("color", "#2980b9");
            d3.select("#useAccuracyHelper").style("pointer-events", "auto");
        }
    }
}
