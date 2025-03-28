module.exports = function (graph) {
    let configMenu = {},
        checkboxes = [];


    configMenu.setup = function () {
        let menuEntry = d3.select("#m_modes");
        menuEntry.on("mouseover", function (event) {
            let searchMenu = graph.options().searchMenu();
            searchMenu.hideSearchEntries();
        });

        addCheckBox("showZoomSlider", "Zoom controls", "#zoomSliderOption", graph.options().zoomSlider().showSlider, 0);
        addLabelWidthSlider("#maxLabelWidthSliderOption", "maxLabelWidth", "Max label width", graph.options().maxLabelWidth);
    };


    function addLabelWidthSlider(selector, identifier, label, onChangeFunction) {
        let sliderContainer,
            sliderValueLabel;

        sliderContainer = d3.select(selector)
            .append("div")
            .classed("distanceSliderContainer", true);

        let slider = sliderContainer.append("input")
            .attr("id", identifier + "Slider")
            .attr("type", "range")
            .attr("min", 20)
            .attr("max", 600)
            .attr("value", onChangeFunction())
            .attr("step", 10);
        sliderContainer.append("label")
            .classed("description", true)
            .attr("for", identifier + "Slider")
            .attr("id", identifier + "DescriptionLabel")
            .text(label);
        sliderValueLabel = sliderContainer.append("label")
            .classed("value", true)
            .attr("for", identifier + "Slider")
            .attr("id", identifier + "valueLabel")
            .text(onChangeFunction());

        slider.on("input", function (event) {
            let value = slider.property("value");
            onChangeFunction(value);
            sliderValueLabel.text(value);
            if (graph.options().dynamicLabelWidth() === true)
                graph.animateDynamicLabelWidth();
        });

        // add wheel event to the slider
        slider.on("wheel", function (event) {
            if (slider.node().disabled === true) {
                return;
            }
            let offset;
            if (event.deltaY < 0) {
                offset = 10;
            }
            if (event.deltaY > 0) {
                offset = -10;
            }
            let oldVal = parseInt(slider.property("value"));
            let newSliderValue = oldVal + offset;
            if (newSliderValue !== oldVal) {
                slider.property("value", newSliderValue);
                onChangeFunction(newSliderValue);
                slider.on("input")(); // << set text and update the graphStyles
            }
            event.preventDefault();
        });
    }

    function addCheckBox(identifier, modeName, selector, onChangeFunc, updateLvl) {
        let configOptionContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);
        let configCheckbox = configOptionContainer.append("input")
            .classed("moduleCheckbox", true)
            .attr("id", identifier + "ConfigCheckbox")
            .attr("type", "checkbox")
            .property("checked", onChangeFunc());


        configCheckbox.on("click", function (event, silent) {
            let isEnabled = configCheckbox.property("checked");
            onChangeFunc(isEnabled);
            if (silent !== true) {
                // updating graph when silent is false or the parameter is not given.
                if (updateLvl === 1) {
                    graph.lazyRefresh();
                    //graph.redrawWithoutForce
                }
                if (updateLvl === 2) {
                    graph.update();
                }

                if (updateLvl === 3) {
                    graph.updateDraggerElements();
                }
            }

        });
        checkboxes.push(configCheckbox);
        configOptionContainer.append("label")
            .attr("for", identifier + "ConfigCheckbox")
            .text(modeName);
    }

    configMenu.setCheckBoxValue = function (identifier, value) {
        for (let i = 0; i < checkboxes.length; i++) {
            let cbdId = checkboxes[i].attr("id");
            if (cbdId === identifier) {
                checkboxes[i].property("checked", value);
                break;
            }
        }
    };

    configMenu.getCheckBoxValue = function (id) {
        for (let i = 0; i < checkboxes.length; i++) {
            let cbdId = checkboxes[i].attr("id");
            if (cbdId === id) {
                return checkboxes[i].property("checked");
            }
        }
    };

    configMenu.updateSettings = function () {
        const silent = true;
        const event = undefined;
        checkboxes.forEach(function (checkbox) {
            checkbox.on("click")(event, silent);
        });
    };
    return configMenu;
};
