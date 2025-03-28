String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.split(search).join(replacement);
};
module.exports = function () {
    let newOntologyCounter = 1;
    let app = {},
        graph = webvowl.graph(),
        options = graph.graphOptions(),
        languageTools = webvowl.util.languageTools(),
        GRAPH_SELECTOR = "#graph",
        // Modules for the webvowl app
        exportMenu = require("./menu/exportMenu")(graph),
        filterMenu = require("./menu/filterMenu")(graph),
        gravityMenu = require("./menu/gravityMenu")(graph),
        modeMenu = require("./menu/modeMenu")(graph),
        debugMenu = require("./menu/debugMenu")(graph),
        ontologyMenu = require("./menu/ontologyMenu")(graph),
        pauseMenu = require("./menu/pauseMenu")(graph),
        resetMenu = require("./menu/resetMenu")(graph),
        searchMenu = require("./menu/searchMenu")(graph),
        navigationMenu = require("./menu/navigationMenu")(graph),
        zoomSlider = require("./menu/zoomSlider")(graph),
        sidebar = require("./sidebar")(graph),
        leftSidebar = require("./leftSidebar")(graph),
        editSidebar = require("./editSidebar")(graph),
        configMenu = require("./menu/configMenu")(graph),
        loadingModule = require("./loadingModule")(graph),
        warningModule = require("./warningModule")(graph),
        directInputMod = require("./directInputModule")(graph),

        // Graph modules
        colorExternalsSwitch = webvowl.modules.colorExternalsSwitch(graph),
        compactNotationSwitch = webvowl.modules.compactNotationSwitch(graph),
        datatypeFilter = webvowl.modules.datatypeFilter(),
        disjointFilter = webvowl.modules.disjointFilter(),
        focuser = webvowl.modules.focuser(graph),
        emptyLiteralFilter = webvowl.modules.emptyLiteralFilter(),
        nodeDegreeFilter = webvowl.modules.nodeDegreeFilter(filterMenu),
        nodeScalingSwitch = webvowl.modules.nodeScalingSwitch(graph),
        objectPropertyFilter = webvowl.modules.objectPropertyFilter(),
        pickAndPin = webvowl.modules.pickAndPin(),
        selectionDetailDisplayer = webvowl.modules.selectionDetailsDisplayer(sidebar.updateSelectionInformation),
        statistics = webvowl.modules.statistics(),
        subclassFilter = webvowl.modules.subclassFilter(),
        setOperatorFilter = webvowl.modules.setOperatorFilter();

    app.getOptions = function () {
        return webvowl.opts;
    };
    app.getGraph = function () {
        return webvowl.gr;
    };
    // app.afterInitializationCallback=undefined;
    let executeFileDrop = false;
    let wasMessageToShow = false;
    let firstTime = false;

    function addFileDropEvents(selector) {
        let node = d3.select(selector);

        node.node().ondragover = function (e) {
            e.preventDefault();

            d3.select("#dragDropContainer").classed("hidden", false);
            // get svg size
            let w = graph.options().width();
            let h = graph.options().height();

            // get event position; (using clientX and clientY);
            let cx = e.clientX;
            let cy = e.clientY;

            if (firstTime === false) {
                let state = d3.select("#loading-info").classed("hidden");
                wasMessageToShow = !state;
                firstTime = true;
                d3.select("#loading-info").classed("hidden", true); // hide it so it does not conflict with drop event
                let bb = d3.select("#drag_msg").node().getBoundingClientRect();
                let hs = bb.height;
                let ws = bb.width;

                let icon_scale = Math.min(hs, ws);
                icon_scale /= 100;

                d3.select("#drag_icon_group").attr("transform", "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")");
                d3.select("#drag_icon").attr("transform", "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)");
                d3.select("#drag_icon_drop").attr("transform", "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)");
            }
            if ((cx > 0.25 * w && cx < 0.75 * w) && (cy > 0.25 * h && cy < 0.75 * h)) {
                d3.select("#drag_msg_text").node().innerHTML = "Drop it here.";
                d3.select("#drag_msg").style("background-color", "#67bc0f");
                d3.select("#drag_msg").style("color", "#000000");
                executeFileDrop = true;
                // d3.select("#drag_svg").transition()
                //   .duration(100)
                //   // .attr("-webkit-transform", "rotate(90)")
                //   // .attr("-moz-transform",    "rotate(90)")
                //   // .attr("-o-transform",      "rotate(90)")
                //   .attr("transform",         "rotate(90)");

                d3.select("#drag_icon").classed("hidden", true);
                d3.select("#drag_icon_drop").classed("hidden", false);
            } else {
                d3.select("#drag_msg_text").node().innerHTML = "Drag ontology file here.";
                d3.select("#drag_msg").style("background-color", "#fefefe");
                d3.select("#drag_msg").style("color", "#000000");
                executeFileDrop = false;

                d3.select("#drag_icon").classed("hidden", false);
                d3.select("#drag_icon_drop").classed("hidden", true);
                // d3.select("#drag_svg").transition()
                //   .duration(100)
                //   // .attr("-webkit-transform", "rotate(0)")
                //   // .attr("-moz-transform",    "rotate(0)")
                //   // .attr("-o-transform",      "rotate(0)")
                //   .attr("transform",         "rotate(0)");
                //
            }

        };
        node.node().ondrop = function (ev) {
            ev.preventDefault();
            firstTime = false;
            if (executeFileDrop) {
                if (ev.dataTransfer.items) {
                    if (ev.dataTransfer.items.length === 1) {
                        if (ev.dataTransfer.items[0].kind === 'file') {
                            let file = ev.dataTransfer.items[0].getAsFile();
                            graph.options().loadingModule().fromFileDrop(file.name, file);
                        }
                    }
                    else {
                        //  >> WARNING not multiple file uploaded;
                        graph.options().warningModule().showMultiFileUploadWarning();
                    }
                }
            }
            d3.select("#dragDropContainer").classed("hidden", true);
        };

        node.node().ondragleave = function (e) {
            let w = graph.options().width();
            let h = graph.options().height();

            // get event position; (using clientX and clientY);
            let cx = e.clientX;
            let cy = e.clientY;

            let hidden = false;
            firstTime = false;

            if (cx < 0.1 * w || cx > 0.9 * w) hidden = true;
            if (cy < 0.1 * h || cy > 0.9 * h) hidden = true;
            d3.select("#dragDropContainer").classed("hidden", hidden);

            d3.select("#loading-info").classed("hidden", !wasMessageToShow); // show it again
            // check if it should be visible
            let should_show = graph.options().loadingModule().getMessageVisibilityStatus();
            if (should_show === false) {
                d3.select("#loading-info").classed("hidden", true); // hide it
            }
        };

    }

    app.initialize = function () {
        addFileDropEvents(GRAPH_SELECTOR);

        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (f) {
            return setTimeout(f, 1000 / 60);
        }; // simulate calling code 60
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function (requestID) {
            clearTimeout(requestID);
        }; //fall back

        options.graphContainerSelector(GRAPH_SELECTOR);
        options.selectionModules().push(focuser);
        options.selectionModules().push(selectionDetailDisplayer);
        options.selectionModules().push(pickAndPin);

        options.filterModules().push(emptyLiteralFilter);
        options.filterModules().push(statistics);

        options.filterModules().push(nodeDegreeFilter);
        options.filterModules().push(datatypeFilter);
        options.filterModules().push(objectPropertyFilter);
        options.filterModules().push(subclassFilter);
        options.filterModules().push(disjointFilter);
        options.filterModules().push(setOperatorFilter);
        options.filterModules().push(nodeScalingSwitch);
        options.filterModules().push(compactNotationSwitch);
        options.filterModules().push(colorExternalsSwitch);

        d3.select(window).on("resize", adjustSize);

        exportMenu.setup();
        gravityMenu.setup();
        filterMenu.setup(datatypeFilter, objectPropertyFilter, subclassFilter, disjointFilter, setOperatorFilter, nodeDegreeFilter);
        modeMenu.setup(pickAndPin, nodeScalingSwitch, compactNotationSwitch, colorExternalsSwitch);
        pauseMenu.setup();
        sidebar.setup();
        loadingModule.setup();
        leftSidebar.setup();
        editSidebar.setup();
        debugMenu.setup();
        let agentVersion = getInternetExplorerVersion();
        if (agentVersion > 0 && agentVersion <= 11) {
            console.log("Agent version " + agentVersion);
            console.log("This agent is not supported");
            d3.select("#browserCheck").classed("hidden", false);
            d3.select("#killWarning").classed("hidden", true);
            d3.select("#optionsArea").classed("hidden", true);
            d3.select("#logo").classed("hidden", true);
        } else {
            d3.select("#logo").classed("hidden", false);
            if (agentVersion === 12) {
                // allow Mircosoft Edge Browser but with warning
                d3.select("#browserCheck").classed("hidden", false);
                d3.select("#killWarning").classed("hidden", false);
            } else {
                d3.select("#browserCheck").classed("hidden", true);
            }

            resetMenu.setup([gravityMenu, filterMenu, modeMenu, focuser, selectionDetailDisplayer, pauseMenu]);
            searchMenu.setup();
            navigationMenu.setup();
            zoomSlider.setup();

            // give the options the pointer to the some menus for import and export
            options.literalFilter(emptyLiteralFilter);
            options.nodeDegreeFilter(nodeDegreeFilter);
            options.loadingModule(loadingModule);
            options.filterMenu(filterMenu);
            options.modeMenu(modeMenu);
            options.gravityMenu(gravityMenu);
            options.pausedMenu(pauseMenu);
            options.pickAndPinModule(pickAndPin);
            options.resetMenu(resetMenu);
            options.searchMenu(searchMenu);
            options.ontologyMenu(ontologyMenu);
            options.navigationMenu(navigationMenu);
            options.sidebar(sidebar);
            options.leftSidebar(leftSidebar);
            options.editSidebar(editSidebar);
            options.exportMenu(exportMenu);
            options.graphObject(graph);
            options.zoomSlider(zoomSlider);
            options.warningModule(warningModule);
            options.directInputModule(directInputMod);
            options.datatypeFilter(datatypeFilter);
            options.objectPropertyFilter(objectPropertyFilter);
            options.subclassFilter(subclassFilter);
            options.setOperatorFilter(setOperatorFilter);
            options.disjointPropertyFilter(disjointFilter);
            options.focuserModule(focuser);
            options.colorExternalsModule(colorExternalsSwitch);
            options.compactNotationModule(compactNotationSwitch);

            ontologyMenu.setup(loadOntologyFromText);
            configMenu.setup();
            leftSidebar.showSidebar(0);
            leftSidebar.hideCollapseButton(true);
            graph.start();

            let modeOp = d3.select("#modeOfOperationString");
            modeOp.style("font-size", "0.6em");
            modeOp.style("font-style", "italic");

            adjustSize();
            let defZoom;
            let w = graph.options().width();
            let h = graph.options().height();
            defZoom = Math.min(w, h) / 1000;

            let hideDebugOptions = true;
            if (hideDebugOptions === false) {
                graph.setForceTickFunctionWithFPS();
            }

            graph.setDefaultZoom(defZoom);
            d3.selectAll(".debugOption").classed("hidden", hideDebugOptions);

            // prevent backspace reloading event
            let htmlBody = d3.select("body");
            d3.select(document).on("keydown", function (event) {
                if (event.code === 8 && event.target === htmlBody.node()) {
                    // we could add here an alert
                    event.preventDefault();
                }
                // using ctrl+Shift+d as debug option
                if (event.ctrlKey && event.shiftKey && event.code === 68) {
                    graph.options().executeHiddenDebugFeatuers();
                    event.preventDefault();
                }
            });
            if (d3.select("#maxLabelWidthSliderOption")) {
                let setValue = !graph.options().dynamicLabelWidth();
                d3.select("#maxLabelWidthSlider").node().disabled = setValue;
                d3.select("#maxLabelWidthvalueLabel").classed("disabledLabelForSlider", setValue);
                d3.select("#maxLabelWidthDescriptionLabel").classed("disabledLabelForSlider", setValue);
            }

            d3.select("#blockGraphInteractions").style("position", "absolute")
                .style("top", "0")
                .style("background-color", "#bdbdbd")
                .style("opacity", "0.5")
                .style("pointer-events", "auto")
                .style("width", graph.options().width() + "px")
                .style("height", graph.options().height() + "px")
                .on("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                })
                .on("dblclick", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });

            d3.select("#direct-text-input").on("click", function (event) {
                directInputMod.setDirectInputMode();
            });
            d3.select("#blockGraphInteractions").node().draggable = false;
            options.prefixModule(webvowl.util.prefixTools(graph));
            adjustSize();
            sidebar.updateOntologyInformation(undefined, statistics);
            loadingModule.parseUrlAndLoadOntology(); // loads automatically the ontology provided by the parameters
            options.debugMenu(debugMenu);
            debugMenu.updateSettings();

            // connect the reloadCachedVersionButton
            d3.select("#reloadSvgIcon").on("click", function (event) {
                if (d3.select("#reloadSvgIcon").node().disabled === true) {
                    graph.options().ontologyMenu().clearCachedVersion();
                    return;
                }
                d3.select("#reloadCachedOntology").classed("hidden", true);
                graph.options().ontologyMenu().reloadCachedOntology();

            });
            // add the initialized objects
            webvowl.opts = options;
            webvowl.gr = graph;
        }
    };

    function loadOntologyFromText(content, filename, alternativeFilename) {
        d3.select("#reloadCachedOntology").classed("hidden", true);
        pauseMenu.reset();
        graph.options().navigationMenu().hideAllMenus();

        if ((content === undefined && filename === undefined) || (content.length === 0)) {
            loadingModule.notValidJsonFile();
            return;
        }
        graph.editorMode(); // updates the checkbox
        let data;
        if (content) {
            // validate JSON FILE
            let validJSON;
            // assume content was parsed before
            if (content instanceof Object) {
                data = content;
                validJSON = true;
            } else {
                try {
                    data = JSON.parse(content);
                    validJSON = true;
                } catch (e) {
                    validJSON = false;
                }
            }

            if (validJSON === false) {
                // the server output is not a valid json file
                loadingModule.notValidJsonFile();
                return;
            }

            if (!filename) {
                // First look if an ontology title exists, otherwise take the alternative filename
                let ontologyNames = data.header ? data.header.title : undefined;
                let ontologyName = languageTools.textInLanguage(ontologyNames);

                if (ontologyName) {
                    filename = ontologyName;
                } else {
                    filename = alternativeFilename;
                }
            }
        }

        // check if we have graph data
        let classCount = 0;
        if (data.class !== undefined) {
            classCount = data.class.length;
        }

        let loadEmptyOntologyForEditing = false;
        if (location.hash.indexOf("#new_ontology") !== -1) {
            loadEmptyOntologyForEditing = true;
            newOntologyCounter++;
            d3.select("#empty").node().href = "#opts=editorMode=true;#new_ontology" + newOntologyCounter;
        }
        if (classCount === 0 && graph.editorMode() === false && loadEmptyOntologyForEditing === false) {
            // generate message for the user;
            loadingModule.emptyGraphContentError();
        } else {
            loadingModule.validJsonFile();
            ontologyMenu.setCachedOntology(filename, content);
            exportMenu.setJsonText(content);
            options.data(data);
            graph.options().loadingModule().setPercentMode();
            if (loadEmptyOntologyForEditing === true) {
                graph.editorMode(true);
            }
            graph.load();
            sidebar.updateOntologyInformation(data, statistics);
            exportMenu.setFilename(filename);
            graph.updateZoomSliderValueFromOutside();
            adjustSize();

            let flagOfCheckBox = d3.select("#editorModeModuleCheckbox").node().checked;
            graph.editorMode(flagOfCheckBox);// update gui

        }
    }

    function adjustSize(event) {
        let graphContainer = d3.select(GRAPH_SELECTOR),
            svg = graphContainer.select("svg"),
            height = window.innerHeight - 40,
            width = window.innerWidth - (window.innerWidth * 0.22);

        if (sidebar.getSidebarVisibility() === "0") {
            height = window.innerHeight - 40;
            width = window.innerWidth;
        }

        directInputMod.updateLayout();
        d3.select("#blockGraphInteractions").style("width", window.innerWidth + "px");
        d3.select("#blockGraphInteractions").style("height", window.innerHeight + "px");

        d3.select("#WarningErrorMessagesContainer").style("width", width + "px");
        d3.select("#WarningErrorMessagesContainer").style("height", height + "px");

        d3.select("#WarningErrorMessages").style("max-height", (height - 12) + "px");

        graphContainer.style("height", height + "px");
        svg.attr("width", width)
            .attr("height", height);

        options.width(width)
            .height(height);

        graph.updateStyle();

        if (isTouchDevice() === true) {
            if (graph.isEditorMode() === true) {
                d3.select("#modeOfOperationString").node().innerHTML = "touch able device detected";
            }
            graph.setTouchDevice(true);

        } else {
            if (graph.isEditorMode() === true) {
                d3.select("#modeOfOperationString").node().innerHTML = "point & click device detected";
            }
            graph.setTouchDevice(false);
        }
        d3.select("#loadingInfo-container").style("height", 0.5 * (height - 80) + "px");
        loadingModule.checkForScreenSize();

        adjustSliderSize();
        // update also the padding options of loading and the logo positions;
        let warningDiv = d3.select("#browserCheck");
        if (warningDiv.classed("hidden") === false) {
            let offset = 10 + warningDiv.node().getBoundingClientRect().height;
            d3.select("#logo").style("padding", offset + "px 10px");
        } else {
            // remove the dynamic padding from the logo element;
            d3.select("#logo").style("padding", "10px");
        }

        // scrollbar tests;
        let element = d3.select("#menuElementContainer").node();
        let maxScrollLeft = element.scrollWidth - element.clientWidth;
        let leftButton = d3.select("#scrollLeftButton");
        let rightButton = d3.select("#scrollRightButton");
        if (maxScrollLeft > 0) {
            // show both and then check how far is bar;
            rightButton.classed("hidden", false);
            leftButton.classed("hidden", false);
            navigationMenu.updateScrollButtonVisibility();
        } else {
            // hide both;
            rightButton.classed("hidden", true);
            leftButton.classed("hidden", true);
        }
        // adjust height of the leftSidebar element;
        editSidebar.updateElementWidth();
        let hs = d3.select("#drag_msg").node().getBoundingClientRect().height;
        let ws = d3.select("#drag_msg").node().getBoundingClientRect().width;
        d3.select("#drag_icon_group").attr("transform", "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")");
    }

    function adjustSliderSize() {
        // TODO: refactor and put this into the slider it self
        let height = window.innerHeight - 40;
        let fullHeight = height;
        let zoomOutPos = height - 30;
        let sliderHeight = 150;

        // assuming DOM elements are generated in the index.html
        // todo: refactor for independent usage of graph and app
        if (fullHeight < 150) {
            // hide the slider button;
            d3.select("#zoomSliderParagraph").classed("hidden", true);
            d3.select("#zoomOutButton").classed("hidden", true);
            d3.select("#zoomInButton").classed("hidden", true);
            d3.select("#centerGraphButton").classed("hidden", true);
            return;
        }
        d3.select("#zoomSliderParagraph").classed("hidden", false);
        d3.select("#zoomOutButton").classed("hidden", false);
        d3.select("#zoomInButton").classed("hidden", false);
        d3.select("#centerGraphButton").classed("hidden", false);

        let zoomInPos = zoomOutPos - 20;
        let centerPos = zoomInPos - 20;
        if (fullHeight < 280) {
            // hide the slider button;
            d3.select("#zoomSliderParagraph").classed("hidden", true);//let sliderPos=zoomOutPos-sliderHeight;
            d3.select("#zoomOutButton").style("top", zoomOutPos + "px");
            d3.select("#zoomInButton").style("top", zoomInPos + "px");
            d3.select("#centerGraphButton").style("top", centerPos + "px");
            return;
        }

        let sliderPos = zoomOutPos - sliderHeight;
        zoomInPos = sliderPos - 20;
        centerPos = zoomInPos - 20;
        d3.select("#zoomSliderParagraph").classed("hidden", false);
        d3.select("#zoomOutButton").style("top", zoomOutPos + "px");
        d3.select("#zoomInButton").style("top", zoomInPos + "px");
        d3.select("#centerGraphButton").style("top", centerPos + "px");
        d3.select("#zoomSliderParagraph").style("top", sliderPos + "px");
    }

    function isTouchDevice() {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    }

    function getInternetExplorerVersion() {
        let ua,
            re,
            rv = -1;

        // check for edge
        let isEdge = /(?:\b(MS)?IE\s+|\bTrident\/7\.0;.*\s+rv:|\bEdge\/)(\d+)/.test(navigator.userAgent);
        if (isEdge) {
            rv = parseInt("12");
            return rv;
        }

        let isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent);
        if (isIE11) {
            rv = parseInt("11");
            return rv;
        }
        if (navigator.appName === "Microsoft Internet Explorer") {
            ua = navigator.userAgent;
            re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        } else if (navigator.appName === "Netscape") {
            ua = navigator.userAgent;
            re = new RegExp("Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})");
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    }
    return app;
};
