module.exports = function (graph) {
    let debugMenu = {},
        checkboxes = [];


    let hoverFlag = false;
    let specialCbx;
    debugMenu.setup = function () {
        let menuEntry = d3.select("#debugMenuHref");

        menuEntry.on("mouseover", function (event) {
            if (hoverFlag === false) {
                let searchMenu = graph.options().searchMenu();
                searchMenu.hideSearchEntries();
                specialCbx.on("click")(true);
                if (graph.editorMode() === false) {
                    d3.select("#useAccuracyHelper").style("color", "#979797");
                    d3.select("#useAccuracyHelper").style("pointer-events", "none");

                    // regardless the state on which useAccuracyHelper is , we are not in editing mode -> disable it
                    d3.select("#showDraggerObject").style("color", "#979797");
                    d3.select("#showDraggerObject").style("pointer-events", "none");
                } else {
                    d3.select("#useAccuracyHelper").style("color", "#2980b9");
                    d3.select("#useAccuracyHelper").style("pointer-events", "auto");
                }
                hoverFlag = true;
            }
        });
        menuEntry.on("mouseout", function (event) {
            hoverFlag = false;
        });

        specialCbx = addCheckBox("useAccuracyHelper", "Use accuracy helper", "#useAccuracyHelper", graph.options().useAccuracyHelper,
            function (enabled, silent) {
                if (!enabled) {
                    d3.select("#showDraggerObject").style("color", "#979797");
                    d3.select("#showDraggerObject").style("pointer-events", "none");
                    d3.select("#showDraggerObjectConfigCheckbox").node().checked = false;
                } else {
                    d3.select("#showDraggerObject").style("color", "#2980b9");
                    d3.select("#showDraggerObject").style("pointer-events", "auto");
                }

                if (silent === true) return;
                graph.lazyRefresh();
                graph.updateDraggerElements();
            }
        );
        addCheckBox("showDraggerObject", "Show accuracy helper", "#showDraggerObject", graph.options().showDraggerObject,
            function (enabled, silent) {
                if (silent === true) return;
                graph.lazyRefresh();
                graph.updateDraggerElements();
            });
        addCheckBox("showFPS_Statistics", "Show rendering statistics", "#showFPS_Statistics", graph.options().showRenderingStatistic,
            function (enabled, silent) {

                if (graph.options().getHideDebugFeatures() === false) {
                    d3.select("#FPS_Statistics").classed("hidden", !enabled);
                } else {
                    d3.select("#FPS_Statistics").classed("hidden", true);
                }


            });
        addCheckBox("showModeOfOperation", "Show input modality", "#showModeOfOperation", graph.options().showInputModality,
            function (enabled) {
                if (graph.options().getHideDebugFeatures() === false) {
                    d3.select("#modeOfOperationString").classed("hidden", !enabled);
                } else {
                    d3.select("#modeOfOperationString").classed("hidden", true);
                }
            });


    };


    function addCheckBox(identifier, modeName, selector, onChangeFunc, _callbackFunction) {
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
            _callbackFunction(isEnabled, silent);

        });
        checkboxes.push(configCheckbox);
        configOptionContainer.append("label")
            .attr("for", identifier + "ConfigCheckbox")
            .text(modeName);

        return configCheckbox;
    }

    debugMenu.setCheckBoxValue = function (identifier, value) {
        for (let i = 0; i < checkboxes.length; i++) {
            let cbdId = checkboxes[i].attr("id");
            if (cbdId === identifier) {
                checkboxes[i].property("checked", value);
                break;
            }
        }
    };

    debugMenu.getCheckBoxValue = function (id) {
        for (let i = 0; i < checkboxes.length; i++) {
            let cbdId = checkboxes[i].attr("id");
            if (cbdId === id) {
                return checkboxes[i].property("checked");
            }
        }
    };

    debugMenu.updateSettings = function () {
        d3.selectAll(".debugOption").classed("hidden", graph.options().getHideDebugFeatures());

        let silent = true;
        checkboxes.forEach(function (checkbox) {
            checkbox.on("click")(silent);
        });
        if (graph.editorMode() === false) {

            d3.select("#useAccuracyHelper").style("color", "#979797");
            d3.select("#useAccuracyHelper").style("pointer-events", "none");

            // regardless the state on which useAccuracyHelper is , we are not in editing mode -> disable it
            d3.select("#showDraggerObject").style("color", "#979797");
            d3.select("#showDraggerObject").style("pointer-events", "none");
        } else {

            d3.select("#useAccuracyHelper").style("color", "#2980b9");
            d3.select("#useAccuracyHelper").style("pointer-events", "auto");
        }

    };

    return debugMenu;
};
