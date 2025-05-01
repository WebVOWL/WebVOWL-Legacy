import Graph from "../../../webvowl/js/graph"
import ColorExternalsSwitch from "../../../webvowl/js/modules/filters/colorExternalsSwitch"
import CompactNotationSwitch from "../../../webvowl/js/modules/filters/compactNotationSwitch"
import NodeScalingSwitch from "../../../webvowl/js/modules/filters/nodeScalingSwitch"
import PickAndPin from "../../../webvowl/js/modules/pickAndPin"

export default class ModeMenu {
    SAME_COLOR_MODE = { text: "Multicolor", type: "same" }
    GRADIENT_COLOR_MODE = { text: "Multicolor", type: "gradient" }

    /**
     * Contains the logic for connecting the modes with the website.
     * @param {Graph} graph the graph that belongs to these controls
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {{ property: (arg0: string) => any; }[]}
         */
        this.checkboxes = []
        this.colorModeSwitch = undefined
        /**
         * @type {d3.Selection<HTMLInputElement, any, any, undefined> | undefined}
         */
        this.dynamicLabelWidthCheckBox = undefined
    }

    get colorModeState() {
        return this.colorModeSwitch.datum().active
    }

    set colorModeState(s) {
        this.colorModeSwitch.datum().active = s
    }

    /**
     * @param {boolean} val
     */
    setDynamicLabelWidth(val) {
        this.dynamicLabelWidthCheckBox.property("checked", val)
    }

    getCheckBoxContainer() {
        return this.checkboxes
    }

    /**
     * Connects the website with the available graph modes.
     * @param {PickAndPin} pickAndPin
     * @param {NodeScalingSwitch} nodeScaling
     * @param {CompactNotationSwitch} compactNotation
     * @param {ColorExternalsSwitch} colorExternals
     */
    setup(pickAndPin, nodeScaling, compactNotation, colorExternals) {
        const menuEntry = d3.select("#m_modes")
        menuEntry.on("mouseover", () => {
            const searchMenu = this.graph.options.searchMenu
            searchMenu.hideSearchEntries()
        })
        this.addCheckBoxUpdateLevel(
            "labelWidth",
            "Dynamic label width",
            "#dynamicLabelWidth",
            (val) => {
                if (val === undefined)
                    return this.graph.options.dynamicLabelWidth
                else this.graph.options.dynamicLabelWidth = val
            },
            1,
        )
        this.addCheckBox("editorMode", "Editing ", "#editMode", (val) => {
            if (val === undefined) return this.graph.editorMode
            else this.graph.editorMode = val
        })
        this.addModeItem(
            pickAndPin,
            "pickandpin",
            "Pick & pin",
            "#pickAndPinOption",
            false,
        )
        this.addModeItem(
            nodeScaling,
            "nodescaling",
            "Node scaling",
            "#nodeScalingOption",
            true,
        )
        this.addModeItem(
            compactNotation,
            "compactnotation",
            "Compact notation",
            "#compactNotationOption",
            true,
        )
        const container = this.addModeItem(
            colorExternals,
            "colorexternals",
            "Color externals",
            "#colorExternalsOption",
            true,
        )
        this.colorModeSwitch = this.addExternalModeSelection(
            container,
            colorExternals,
        )
    }

    /**
     * @param {string} identifier
     * @param {string} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     * @param {number} updateLvl
     */
    addCheckBoxUpdateLevel(
        identifier,
        modeName,
        selector,
        onChangeFunc,
        updateLvl,
    ) {
        const moduleOptionContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true)
        const moduleCheckbox = moduleOptionContainer
            .append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc())

        moduleCheckbox.on("click", () => {
            const isEnabled = moduleCheckbox.property("checked")
            onChangeFunc(isEnabled)
            d3.select("#maxLabelWidthSlider").node().disabled = !isEnabled
            d3.select("#maxLabelWidthvalueLabel").classed(
                "disabledLabelForSlider",
                !isEnabled,
            )
            d3.select("#maxLabelWidthDescriptionLabel").classed(
                "disabledLabelForSlider",
                !isEnabled,
            )
            if (updateLvl > 0) {
                this.graph.animateDynamicLabelWidth()
                // graph.lazyRefresh();
            }
        })
        moduleOptionContainer
            .append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName)
        if (identifier === "editorMode") {
            moduleOptionContainer
                .append("label")
                .attr("style", "font-size:10px;padding-top:3px")
                .text("(experimental)")
        }
        this.dynamicLabelWidthCheckBox = moduleCheckbox
    }

    /**
     * @param {string} identifier
     * @param {string} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     */
    addCheckBox(identifier, modeName, selector, onChangeFunc) {
        const moduleOptionContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true)
        const moduleCheckbox = moduleOptionContainer
            .append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc())

        moduleCheckbox.on("click", () => {
            const isEnabled = moduleCheckbox.property("checked")
            onChangeFunc(isEnabled)
            if (isEnabled) {
                this.graph.showEditorHintIfNeeded()
            }
        })
        moduleOptionContainer
            .append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName)
        if (identifier === "editorMode") {
            moduleOptionContainer
                .append("label")
                .attr("style", "font-size:10px;padding-top:3px")
                .text(" (experimental)")
        }
    }

    /**
     * @param {{ enabled: any; }} module
     * @param {string} identifier
     * @param {string} modeName
     * @param {string} selector
     * @param {boolean} updateGraphOnClick
     */
    addModeItem(module, identifier, modeName, selector, updateGraphOnClick) {
        const moduleOptionContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true)
            .datum({ module: module, defaultState: module.enabled })
        const moduleCheckbox = moduleOptionContainer
            .append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ModuleCheckbox")
            .attr("type", "checkbox")
            .property("checked", module.enabled)

        // Store for easier resetting all modes
        this.checkboxes.push(moduleCheckbox)
        moduleCheckbox.on("click", (d, silent) => {
            d.module.enabled = moduleCheckbox.property("checked")
            if (updateGraphOnClick && silent !== true) {
                this.graph.executeColorExternalsModule()
                this.graph.executeCompactNotationModule()
                this.graph.lazyRefresh()
            }
        })
        moduleOptionContainer
            .append("label")
            .attr("for", identifier + "ModuleCheckbox")
            .text(modeName)
        return moduleOptionContainer
    }

    /**
     * @param {d3.Selection<HTMLDivElement, { module: { enabled: any; }; defaultState: any; }, HTMLElement, any>} container
     * @param {ColorExternalsSwitch} colorExternalsMode
     */
    addExternalModeSelection(container, colorExternalsMode) {
        const button = container
            .append("button")
            .datum({ active: false })
            .classed("color-mode-switch", true)
        this.applyColorModeSwitchState(button, colorExternalsMode)

        button.on("click", (/** @type {boolean} */ silent) => {
            const data = button.datum()
            data.active = !data.active
            this.applyColorModeSwitchState(button, colorExternalsMode)
            if (colorExternalsMode.enabled && !silent) {
                this.graph.executeColorExternalsModule()
                this.graph.lazyRefresh()
            }
        })
        return button
    }

    /**
     * @param {d3.Selection<HTMLButtonElement, { active: boolean; }, HTMLElement, any>} element
     * @param {ColorExternalsSwitch} colorExternalsMode
     */
    applyColorModeSwitchState(element, colorExternalsMode) {
        const isActive = element.datum().active
        const activeColorMode = this.getColorModeByState(isActive)

        element.classed("active", isActive).text(activeColorMode.text)

        if (colorExternalsMode) {
            colorExternalsMode.colorModeType = activeColorMode.type
        }
    }

    /**
     * @param {boolean} isActive
     */
    getColorModeByState(isActive) {
        return isActive ? this.GRADIENT_COLOR_MODE : this.SAME_COLOR_MODE
    }

    /**
     * Resets the modes to their default.
     */
    reset() {
        this.checkboxes.forEach(function (checkbox) {
            const defaultState = checkbox.datum().defaultState
            const isChecked = checkbox.property("checked")

            if (isChecked !== defaultState) {
                checkbox.property("checked", defaultState)
                // Call onclick event handlers programmatically
                checkbox.on("click")(checkbox.datum())
            }

            // Reset the module that is connected with the checkbox
            checkbox.datum().module.reset()
        })

        // set the switch to active and simulate disabling
        this.colorModeSwitch.datum().active = true
        this.colorModeSwitch.on("click")()
    }

    // setting manually the values of the filter
    // no update of the gui settings, these are updated in updateSettings
    /**
     * importer functions *
     * @param {string} id
     * @param {boolean} checked
     */
    setCheckBoxValue(id, checked) {
        for (let i = 0; i < this.checkboxes.length; i++) {
            const cbdId = this.checkboxes[i].attr("id")
            if (cbdId === id) {
                this.checkboxes[i].property("checked", checked)
                break
            }
        }
    }

    /**
     * @param {string} id
     */
    getCheckBoxValue(id) {
        for (let i = 0; i < this.checkboxes.length; i++) {
            const cbdId = this.checkboxes[i].attr("id")
            if (cbdId === id) {
                return this.checkboxes[i].property("checked")
            }
        }
    }

    /**
     * @param {boolean} state
     */
    setColorSwitchState(state) {
        // need the !state because we simulate later a click
        this.colorModeState = !state
    }

    /**
     * @param {boolean} state
     */
    setColorSwitchStateUsingURL(state) {
        // need the !state because we simulate later a click
        this.colorModeState = !state
        this.colorModeSwitch.on("click")(true)
    }

    updateSettingsUsingURL() {
        const silent = true
        this.checkboxes.forEach(function (checkbox) {
            checkbox.on("click")(checkbox.datum(), silent)
        })
    }

    updateSettings() {
        const silent = true
        this.checkboxes.forEach(function (checkbox) {
            checkbox.on("click")(checkbox.datum(), silent)
        })
        // this simulates onclick and inverts its state
        this.colorModeSwitch.on("click")(silent)
    }
}
