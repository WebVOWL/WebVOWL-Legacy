import d3 from "d3";

export default class ConfigMenu {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph;
        /**
         * @type {import("d3-selection").Selection<HTMLInputElement, any, HTMLElement, any>[]}
         */
        this.checkboxes = [];
    }

    setup() {
        const menuEntry = d3.select("#m_modes");
        menuEntry.on("mouseover", () => {
            const searchMenu = this.graph.options().searchMenu();
            searchMenu.hideSearchEntries();
        });

        this.addCheckBox("showZoomSlider", "Zoom controls", "#zoomSliderOption", this.graph.options().zoomSlider().showSlider, 0);
        this.addLabelWidthSlider("#maxLabelWidthSliderOption", "maxLabelWidth", "Max label width", this.graph.options().maxLabelWidth);
    }

    /**
     * @param {string} selector
     * @param {string} identifier
     * @param {string | number | boolean | import("d3-selection").ValueFn<HTMLLabelElement, any, string | number | boolean>} label
     * @param {(arg0?: number) => any} onChangeFunction
     */
    addLabelWidthSlider(selector, identifier, label, onChangeFunction) {
        const sliderContainer = d3.select(selector)
            .append("div")
            .classed("distanceSliderContainer", true);

        const slider = sliderContainer.append("input")
            .attr("id", `${identifier}Slider`)
            .attr("type", "range")
            .attr("min", 20)
            .attr("max", 600)
            .attr("value", onChangeFunction())
            .attr("step", 10);

        sliderContainer.append("label")
            .classed("description", true)
            .attr("for", `${identifier}Slider`)
            .attr("id", `${identifier}DescriptionLabel`)
            .text(label);

        const sliderValueLabel = sliderContainer.append("label")
            .classed("value", true)
            .attr("for", `${identifier}Slider`)
            .attr("id", `${identifier}valueLabel`)
            .text(onChangeFunction());

        slider.on("input", () => {
            const value = slider.property("value");
            onChangeFunction(value);
            sliderValueLabel.text(value);
            if (this.graph.options().dynamicLabelWidth() === true) {
                this.graph.animateDynamicLabelWidth();
            }
        });

        slider.on("wheel", () => {
            if (slider.node().disabled === true) return;
            // @ts-ignore
            const wheelEvent = d3.event;
            let offset = 0;
            if (wheelEvent.deltaY < 0) offset = 10;
            if (wheelEvent.deltaY > 0) offset = -10;
            const oldVal = parseInt(slider.property("value"));
            const newSliderValue = oldVal + offset;
            if (newSliderValue !== oldVal) {
                slider.property("value", newSliderValue);
                onChangeFunction(newSliderValue);
                // @ts-ignore
                slider.on("input")();
            }
            // @ts-ignore
            d3.event.preventDefault();
        });
    }

    /**
     * @param {string} identifier
     * @param {string | number | boolean | import("d3-selection").ValueFn<HTMLLabelElement, any, string | number | boolean>} modeName
     * @param {string} selector
     * @param {(arg0: undefined) => void} onChangeFunc
     * @param {number} updateLvl
     */
    addCheckBox(identifier, modeName, selector, onChangeFunc, updateLvl) {
        const configOptionContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        const configCheckbox = configOptionContainer.append("input")
            .classed("moduleCheckbox", true)
            .attr("id", `${identifier}ConfigCheckbox`)
            .attr("type", "checkbox")
            .property("checked", onChangeFunc());

        configCheckbox.on("click", (silent) => {
            const isEnabled = configCheckbox.property("checked");
            onChangeFunc(isEnabled);
            if (silent !== true) {
                if (updateLvl === 1) {
                    this.graph.lazyRefresh();
                }
                if (updateLvl === 2) {
                    this.graph.update();
                }
                if (updateLvl === 3) {
                    this.graph.updateDraggerElements();
                }
            }
        });

        this.checkboxes.push(configCheckbox);

        configOptionContainer.append("label")
            .attr("for", `${identifier}ConfigCheckbox`)
            .text(modeName);
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
     * @param {string} id
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
        const silent = true;
        this.checkboxes.forEach((checkbox) => {
            checkbox.on("click").call(checkbox.node(), silent);
        });
    }
}
