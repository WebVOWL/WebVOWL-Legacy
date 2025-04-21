import init, { init_rust } from "../../../../pkg/index.js";
import Graph from "../../webvowl/js/graph.js";


export default class App {
    GRAPH_SELECTOR = "#graph"

    constructor() {
        this.graph = new Graph()
        this.executeFileDrop = false;
        this.wasMessageToShow = false;
        this.firstTime = false;
    }

    #addFileDropEvents(selector) {
        const node = d3.select(selector);

        node.node().ondragover = (e) => {
            e.preventDefault();

            d3.select("#dragDropContainer").classed("hidden", false);
            // get svg size
            const w = this.graph.options.width;
            const h = this.graph.options.height;

            // get event position; (using clientX and clientY);
            const cx = e.clientX;
            const cy = e.clientY;

            if (this.firstTime === false) {
                const state = d3.select("#loading-info").classed("hidden");
                this.wasMessageToShow = !state;
                this.firstTime = true;
                d3.select("#loading-info").classed("hidden", true); // hide it so it does not conflict with drop event
                const bb = d3.select("#drag_msg").node().getBoundingClientRect();
                const hs = bb.height;
                const ws = bb.width;

                const icon_scale = Math.min(hs, ws);
                icon_scale /= 100;

                d3.select("#drag_icon_group").attr("transform", "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")");
                d3.select("#drag_icon").attr("transform", "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)");
                d3.select("#drag_icon_drop").attr("transform", "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)");
            }

            if ((cx > 0.25 * w && cx < 0.75 * w) && (cy > 0.25 * h && cy < 0.75 * h)) {
                d3.select("#drag_msg_text").node().innerHTML = "Drop it here.";
                d3.select("#drag_msg").style("background-color", "#67bc0f");
                d3.select("#drag_msg").style("color", "#000000");
                this.executeFileDrop = true;
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
                this.executeFileDrop = false;
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

        node.node().ondrop = (ev) => {
            ev.preventDefault();
            this.firstTime = false;
            if (this.executeFileDrop) {
                if (ev.dataTransfer.items) {
                    if (ev.dataTransfer.items.length === 1) {
                        if (ev.dataTransfer.items[0].kind === 'file') {
                            const file = ev.dataTransfer.items[0].getAsFile();
                            this.graph.options.loadingModule.fromFileDrop(file.name, file);
                        }
                    }
                    else {
                        //  >> WARNING not multiple file uploaded;
                        this.graph.options.warningModule.showMultiFileUploadWarning();
                    }
                }
            }
            d3.select("#dragDropContainer").classed("hidden", true);
        };

        node.node().ondragleave = (e) => {
            const w = this.graph.options.width;
            const h = this.graph.options.height;

            // get event position; (using clientX and clientY);
            const cx = e.clientX;
            const cy = e.clientY;

            const hidden = false;
            this.firstTime = false;

            if (cx < 0.1 * w || cx > 0.9 * w) hidden = true;
            if (cy < 0.1 * h || cy > 0.9 * h) hidden = true;
            d3.select("#dragDropContainer").classed("hidden", hidden);

            d3.select("#loading-info").classed("hidden", !this.wasMessageToShow); // show it again
            // check if it should be visible
            const should_show = this.graph.options.loadingModule.visibilityStatus;
            if (should_show === false) {
                d3.select("#loading-info").classed("hidden", true); // hide it
            }
        };
    }

    async initialize() {
        // console.log(wasm);
        await init();
        init_rust(); // Initialize Rust code

        this.#addFileDropEvents(this.GRAPH_SELECTOR);

        // simulate calling code 60
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (f) {
            return setTimeout(f, 1000 / 60);
        };
        //fall back
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function (requestID) {
            clearTimeout(requestID);
        };

        options.graphContainerSelector = GRAPH_SELECTOR;
        options.selectionModules.push(focuser);
        options.selectionModules.push(selectionDetailDisplayer);
        options.selectionModules.push(pickAndPin);

        options.filterModules.push(emptyLiteralFilter);
        options.filterModules.push(statistics);

        options.filterModules.push(nodeDegreeFilter);
        options.filterModules.push(datatypeFilter);
        options.filterModules.push(objectPropertyFilter);
        options.filterModules.push(subclassFilter);
        options.filterModules.push(disjointFilter);
        options.filterModules.push(setOperatorFilter);
        options.filterModules.push(nodeScalingSwitch);
        options.filterModules.push(compactNotationSwitch);
        options.filterModules.push(colorExternalsSwitch);

        d3.select(window).on("resize", adjustSize);

        exportMenu.setup();
        gravityMenu.setup();
        filterMenu.setup(datatypeFilter, objectPropertyFilter, subclassFilter, disjointFilter, setOperatorFilter, nodeDegreeFilter);
        modeMenu.setup(pickAndPin, nodeScalingSwitch, compactNotationSwitch, colorExternalsSwitch);
        pauseMenu.setup();
        sidebar.setup();
        loadingModule.setup([statistics, adjustSize]);
        leftSidebar.setup();
        editSidebar.setup();
        debugMenu.setup();

        resetMenu.setup([gravityMenu, filterMenu, modeMenu, focuser, selectionDetailDisplayer, pauseMenu]);
        searchMenu.setup();
        navigationMenu.setup();
        zoomSlider.setup();

        // give the options the pointer to the some menus for import and export
        options.literalFilter = emptyLiteralFilter;
        options.nodeDegreeFilter = nodeDegreeFilter;
        options.loadingModule = loadingModule;
        options.filterMenu = filterMenu;
        options.modeMenu = modeMenu;
        options.gravityMenu = gravityMenu;
        options.pauseMenu = pauseMenu;
        options.pickAndPinModule = pickAndPin;
        options.resetMenu = resetMenu;
        options.searchMenu = searchMenu;
        options.ontologyMenu = ontologyMenu;
        options.navigationMenu = navigationMenu;
        options.sidebar = sidebar;
        options.leftSidebar = leftSidebar;
        options.editSidebar = editSidebar;
        options.exportMenu = exportMenu;
        options.graphObject = graph;
        options.zoomSlider = zoomSlider;
        options.warningModule = warningModule;
        options.directInputModule = directInputMod;
        options.datatypeFilter = datatypeFilter;
        options.objectPropertyFilter = objectPropertyFilter;
        options.subclassFilter = subclassFilter;
        options.setOperatorFilter = setOperatorFilter;
        options.disjointPropertyFilter = disjointFilter;
        options.focuserModule = focuser;
        options.colorExternalsModule = colorExternalsSwitch;
        options.compactNotationModule = compactNotationSwitch;

        ontologyMenu.setup();
        configMenu.setup();

        leftSidebar.showSidebar(false);
        leftSidebar.hideCollapseButton(true);

        graph.start();

        const modeOp = d3.select("#modeOfOperationString");
        modeOp.style("font-size", "0.6em");
        modeOp.style("font-style", "italic");

        adjustSize();
        const w = graph.options.width;
        const h = graph.options.height;
        let defZoom = Math.min(w, h) / 1000;

        const hideDebugOptions = true;
        if (hideDebugOptions === false) {
            graph.setForceTickFunctionWithFPS();
        }

        graph.setDefaultZoom(defZoom);
        d3.selectAll(".debugOption").classed("hidden", hideDebugOptions);

        // prevent backspace reloading event
        const htmlBody = d3.select("body");
        d3.select(document).on("keydown", function (e) {
            if (d3.event.keyCode === 8 && d3.event.target === htmlBody.node()) {
                // we could add here an alert
                d3.event.preventDefault();
            }
            // using ctrl+Shift+d as debug option
            if (d3.event.ctrlKey && d3.event.shiftKey && d3.event.keyCode === 68) {
                graph.options.executeHiddenDebugFeatuers();
                d3.event.preventDefault();
            }
        });
        if (d3.select("#maxLabelWidthSliderOption")) {
            const setValue = !graph.options.dynamicLabelWidth;
            d3.select("#maxLabelWidthSlider").node().disabled = setValue;
            d3.select("#maxLabelWidthvalueLabel").classed("disabledLabelForSlider", setValue);
            d3.select("#maxLabelWidthDescriptionLabel").classed("disabledLabelForSlider", setValue);
        }
        d3.select("#blockGraphInteractions").style("position", "absolute")
            .style("top", "0")
            .style("background-color", "#bdbdbd")
            .style("opacity", "0.5")
            .style("pointer-events", "auto")
            .style("width", graph.options.width + "px")
            .style("height", graph.options.height + "px")
            .on("click", function () {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            })
            .on("dblclick", function () {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            });
        d3.select("#direct-text-input").on("click", function () {
            directInputMod.setDirectInputMode();
        });
        d3.select("#blockGraphInteractions").node().draggable = false;
        adjustSize();
        sidebar.updateOntologyInformation(undefined, statistics);
        loadingModule.parseUrlAndLoadOntology(); // loads automatically the ontology provided by the parameters
        options.debugMenu = debugMenu;
        debugMenu.updateSettings();

        // connect the reloadCachedVersionButton
        d3.select("#reloadSvgIcon").on("click", function () {
            if (d3.select("#reloadSvgIcon").node().disabled === true) {
                graph.options.ontologyMenu.clearCachedVersion();
                return;
            }
            d3.select("#reloadCachedOntology").classed("hidden", true);
            graph.options.ontologyMenu.reloadCachedOntology();
        });
        // add the initialized objects
        webvowl.opts = options;
        webvowl.gr = graph;
    }
}

#adjustSize() {
    const graphContainer = d3.select(GRAPH_SELECTOR),
        svg = graphContainer.select("svg"),
        height = window.innerHeight - 40,
        width = window.innerWidth - (window.innerWidth * 0.22);

    if (sidebar.getSidebarVisibility()) {
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

    options.width = width;
    options.height = height;

    graph.updateStyle();

    if (touchDevice === true) {
        if (graph.isEditorMode === true)
            d3.select("#modeOfOperationString").node().innerHTML = "touch able device detected";
        graph.touchDevice = true;
    } else {
        if (graph.isEditorMode === true)
            d3.select("#modeOfOperationString").node().innerHTML = "point & click device detected";
        graph.touchDevice = false;
    }

    d3.select("#loadingInfo-container").style("height", 0.5 * (height - 80) + "px");
    loadingModule.checkForScreenSize();

    adjustSliderSize();
    // update also the padding options of loading and the logo positions;
    const warningDiv = d3.select("#browserCheck");
    if (warningDiv.classed("hidden") === false) {
        const offset = 10 + warningDiv.node().getBoundingClientRect().height;
        d3.select("#logo").style("padding", offset + "px 10px");
    } else {
        // remove the dynamic padding from the logo element;
        d3.select("#logo").style("padding", "10px");
    }

    // scrollbar tests;
    const element = d3.select("#menuElementContainer").node();
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    const leftButton = d3.select("#scrollLeftButton");
    const rightButton = d3.select("#scrollRightButton");
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


    const hs = d3.select("#drag_msg").node().getBoundingClientRect().height;
    const ws = d3.select("#drag_msg").node().getBoundingClientRect().labelWidth;
    d3.select("#drag_icon_group").attr("transform", "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")");

}

#adjustSliderSize() {
    // TODO: refactor and put this into the slider it self
    const height = window.innerHeight - 40;
    const fullHeight = height;
    const zoomOutPos = height - 30;
    const sliderHeight = 150;

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

    const zoomInPos = zoomOutPos - 20;
    const centerPos = zoomInPos - 20;
    if (fullHeight < 280) {
        // hide the slider button;
        d3.select("#zoomSliderParagraph").classed("hidden", true);//const sliderPos=zoomOutPos-sliderHeight;
        d3.select("#zoomOutButton").style("top", zoomOutPos + "px");
        d3.select("#zoomInButton").style("top", zoomInPos + "px");
        d3.select("#centerGraphButton").style("top", centerPos + "px");
        return;
    }

    const sliderPos = zoomOutPos - sliderHeight;
    zoomInPos = sliderPos - 20;
    centerPos = zoomInPos - 20;
    d3.select("#zoomSliderParagraph").classed("hidden", false);
    d3.select("#zoomOutButton").style("top", zoomOutPos + "px");
    d3.select("#zoomInButton").style("top", zoomInPos + "px");
    d3.select("#centerGraphButton").style("top", centerPos + "px");
    d3.select("#zoomSliderParagraph").style("top", sliderPos + "px");
}

#touchDevice() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}
}





export function () {
    const newOntologyCounter = 1;
    const app = {},
        graph = webvowl.graph(),
        options = graph.options,
        languageTools = webvowl.util.languageTools(),
        ,
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
        leftSidebar = require("./leftSidebar").default(graph),
        editSidebar = require("./editSidebar").default(graph),
        configMenu = require("./menu/configMenu")(graph),
        loadingModule = require("./ontologyLoading.js")(graph),
        warningModule = require("./warningModule")(graph),
        directInputMod = require("./directInputModule").default(graph),


        // Graph modules
        colorExternalsSwitch = webvowl.modules.colorExternalsSwitch(graph),
        compactNotationSwitch = webvowl.modules.compactNotationSwitch(graph),
        datatypeFilter = webvowl.modules.datatypeFilter,
        disjointFilter = webvowl.modules.disjointFilter(),
        focuser = webvowl.modules.focuser(graph),
        emptyLiteralFilter = webvowl.modules.emptyLiteralFilter(),
        nodeDegreeFilter = webvowl.modules.nodeDegreeFilter(filterMenu),
        nodeScalingSwitch = webvowl.modules.nodeScalingSwitch(graph),
        objectPropertyFilter = webvowl.modules.objectPropertyFilter,
        pickAndPin = webvowl.modules.pickAndPin(),
        selectionDetailDisplayer = webvowl.modules.selectionDetailsDisplayer(sidebar.updateSelectionInformation),
        statistics = webvowl.modules.statistics(),
        subclassFilter = webvowl.modules.subclassFilter,
        setOperatorFilter = webvowl.modules.setOperatorFilter;



    return app;
};
