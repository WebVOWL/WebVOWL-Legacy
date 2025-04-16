import d3 from "d3";

/**
 * Contains the logic for connecting the modes with the website.
 *
 * @param graph the graph that belongs to these controls
 * @returns {{}}
 */
export default class ModeMenu {

    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph;

        this.SAME_COLOR_MODE = { text: "Multicolor", type: "same" };
        this.GRADIENT_COLOR_MODE = { text: "Multicolor", type: "gradient" };
        /**
         * @type {{ property: (arg0: string) => any; }[]}
         */
        this.checkboxes = [];
        this.colorModeSwitch = undefined;
    
        this.dynamicLabelWidthCheckBox = undefined;
    }
    
    // getter and setter for the state of color modes
    colorModeState(/** @type {any} */ s) {
        // @ts-ignore
        if (!arguments.length) return this.colorModeSwitch.datum().active;
        // @ts-ignore
        this.colorModeSwitch.datum().active = s;
        return this;
    };

    /**
     * @param {any} val
     */
    setDynamicLabelWidth(val) {
        this.dynamicLabelWidthCheckBox.property("checked", val);
    };

    // getter for checkboxes
    getCheckBoxContainer() {
        return this.checkboxes;
    };

    /**
     * Connects the website with the available graph modes.
     * @param {any} pickAndPin
     * @param {any} nodeScaling
     * @param {any} compactNotation
     * @param {any} colorExternals
     */
    setup(pickAndPin, nodeScaling, compactNotation, colorExternals) {
        const _this = this;
        var menuEntry = d3.select("#m_modes");
        menuEntry.on("mouseover", function () {
            var searchMenu = _this.graph.options.searchMenu();
            searchMenu.hideSearchEntries();
        });
        this.addCheckBoxD("labelWidth", "Dynamic label width", "#dynamicLabelWidth", this.graph.options.dynamicLabelWidth, 1);
        this.addCheckBox("editorMode", "Editing ", "#editMode", this.graph.editorMode);
        this.addModeItem(pickAndPin, "pickandpin", "Pick & pin", "#pickAndPinOption", false);
        this.addModeItem(nodeScaling, "nodescaling", "Node scaling", "#nodeScalingOption", true);
        this.addModeItem(compactNotation, "compactnotation", "Compact notation", "#compactNotationOption", true);
        var container = this.addModeItem(colorExternals, "colorexternals", "Color externals", "#colorExternalsOption", true);
        this.colorModeSwitch = this.addExternalModeSelection(container, colorExternals);
    };

    /**
     * @param {string} identifier
     * @param {string | number | boolean | d3.ValueFn<HTMLLabelElement, any, string | number | boolean>} modeName
     * @param {any} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     * @param {number} updateLvl
     */
    addCheckBoxD(identifier, modeName, selector, onChangeFunc, updateLvl) {
        const _this = this;
        var moduleOptionContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        var moduleCheckbox = moduleOptionContainer.append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc());

        moduleCheckbox.on("click", function (d) {
            var isEnabled = moduleCheckbox.property("checked");
            onChangeFunc(isEnabled);
            // @ts-ignore
            d3.select("#maxLabelWidthSlider").node().disabled = !isEnabled;
            d3.select("#maxLabelWidthvalueLabel").classed("disabledLabelForSlider", !isEnabled);
            d3.select("#maxLabelWidthDescriptionLabel").classed("disabledLabelForSlider", !isEnabled);

            if (updateLvl > 0) {
                _this.graph.animateDynamicLabelWidth();
                // graph.lazyRefresh();
            }
        });
        moduleOptionContainer.append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName);
        if (identifier === "editorMode") {
            moduleOptionContainer.append("label")
                .attr("style", "font-size:10px;padding-top:3px")
                .text("(experimental)");
        }
        this.dynamicLabelWidthCheckBox = moduleCheckbox;
    }

    /**
     * @param {string} identifier
     * @param {string | number | boolean | d3.ValueFn<HTMLLabelElement, any, string | number | boolean>} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     */
    addCheckBox(identifier, modeName, selector, onChangeFunc) {
        const _this = this;
        var moduleOptionContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        var moduleCheckbox = moduleOptionContainer.append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc());

        moduleCheckbox.on("click", function (d) {
            var isEnabled = moduleCheckbox.property("checked");
            onChangeFunc(isEnabled);
            if (isEnabled === true)
                _this.graph.showEditorHintIfNeeded();
        });
        moduleOptionContainer.append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName);
        if (identifier === "editorMode") {
            moduleOptionContainer.append("label")
                .attr("style", "font-size:10px;padding-top:3px")
                .text(" (experimental)");
        }
    }

    /**
     * @param {{ enabled: any; }} module
     * @param {string} identifier
     * @param {string | number | boolean | d3.ValueFn<HTMLLabelElement, { module: any; defaultState: any; }, string | number | boolean>} modeName
     * @param {string} selector
     * @param {boolean} updateGraphOnClick
     */
    addModeItem(module, identifier, modeName, selector, updateGraphOnClick) {
        const _this = this;
        var moduleOptionContainer;
        /**
         * @type {d3.Selection<HTMLInputElement, { module: { enabled: any; }; defaultState: any; }, HTMLElement, any>}
         */
        var moduleCheckbox;

        moduleOptionContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true)
            .datum({ module: module, defaultState: module.enabled });

        moduleCheckbox = moduleOptionContainer.append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", module.enabled);

        // Store for easier resetting all modes
        this.checkboxes.push(moduleCheckbox);

        moduleCheckbox.on("click", function (d, silent) {
            d.module.enabled = moduleCheckbox.property("checked");
            // @ts-ignore
            if (updateGraphOnClick && silent !== true) {
                _this.graph.executeColorExternalsModule();
                _this.graph.executeCompactNotationModule();
                _this.graph.lazyRefresh();
            }
        });

        moduleOptionContainer.append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName);

        return moduleOptionContainer;
    }

    /**
     * @param {any} container
     * @param {{ enabled: any; }} colorExternalsMode
     */
    addExternalModeSelection(container, colorExternalsMode) {
        const _this = this;
        var button = container.append("button").datum({ active: false }).classed("color-mode-switch", true);
        this.applyColorModeSwitchState(button, colorExternalsMode);

        button.on("click", function (/** @type {boolean} */ silent) {
            var data = button.datum();
            data.active = !data.active;
            applyColorModeSwitchState(button, colorExternalsMode);
            if (colorExternalsMode.enabled && silent !== true) {
                _this.graph.executeColorExternalsModule();
                _this.graph.lazyRefresh();
            }
        });

        return button;
    }

    /**
     * @param {any} element
     * @param {any} colorExternalsMode
     */
    applyColorModeSwitchState(element, colorExternalsMode) {
        var isActive = element.datum().active;
        var activeColorMode = this.getColorModeByState(isActive);

        element.classed("active", isActive)
            .text(activeColorMode.text);

        if (colorExternalsMode) {
            colorExternalsMode.colorModeType = activeColorMode.type;
        }
    }

    /**
     * @param {any} isActive
     */
    getColorModeByState(isActive) {
        return isActive ? this.GRADIENT_COLOR_MODE : this.SAME_COLOR_MODE;
    }

    /**
     * Resets the modes to their default.
     */
    reset() {
        this.checkboxes.forEach(function (checkbox) {
            // @ts-ignore
            var defaultState = checkbox.datum().defaultState,
                isChecked = checkbox.property("checked");

            if (isChecked !== defaultState) {
                // @ts-ignore
                checkbox.property("checked", defaultState);
                // Call onclick event handlers programmatically
                // @ts-ignore
                checkbox.on("click")(checkbox.datum());
            }

            // Reset the module that is connected with the checkbox
            // @ts-ignore
            checkbox.datum().module.reset();
        });

        // set the switch to active and simulate disabling
        // @ts-ignore
        this.colorModeSwitch.datum().active = true;
        // @ts-ignore
        this.colorModeSwitch.on("click")();
    };

    // setting manually the values of the filter
    // no update of the gui settings, these are updated in updateSettings
    /**
     * importer functions *
     * @param {any} id
     * @param {any} checked
     */
    setCheckBoxValue(id, checked) {
        for (var i = 0; i < this.checkboxes.length; i++) {
            // @ts-ignore
            var cbdId = this.checkboxes[i].attr("id");

            if (cbdId === id) {
                // @ts-ignore
                this.checkboxes[i].property("checked", checked);
                break;
            }
        }
    };

    /**
     * @param {any} id
     */
    getCheckBoxValue(id) {
        for (var i = 0; i < this.checkboxes.length; i++) {
            // @ts-ignore
            var cbdId = this.checkboxes[i].attr("id");
            if (cbdId === id) {
                return this.checkboxes[i].property("checked");
            }
        }
    };

    /**
     * @param {any} state
     */
    setColorSwitchState(state) {
        // need the !state because we simulate later a click
        this.colorModeState(!state);
    };

    /**
     * @param {any} state
     */
    setColorSwitchStateUsingURL(state) {
        // need the !state because we simulate later a click
        this.colorModeState(!state);
        // @ts-ignore
        this.colorModeSwitch.on("click")(true);
    };


    updateSettingsUsingURL() {
        var silent = true;
        this.checkboxes.forEach(function (checkbox) {
            // @ts-ignore
            checkbox.on("click")(checkbox.datum(), silent);
        });
    };

    updateSettings() {
        var silent = true;
        this.checkboxes.forEach(function (checkbox) {
            // @ts-ignore
            checkbox.on("click")(checkbox.datum(), silent);
        });
        // this simulates onclick and inverts its state
        // @ts-ignore
        this.colorModeSwitch.on("click")(silent);
    };
};

/**
 * @param {any} _button
 * @param {{ enabled: any; }} _colorExternalsMode
 */
function applyColorModeSwitchState(_button, _colorExternalsMode) {
    throw new Error("Function not implemented.");
}

