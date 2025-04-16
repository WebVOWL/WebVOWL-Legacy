import Deque from 'collections/deque';
import LinkCreator from './parsing/LinkCreator';
import ElementTools from './util/ElementTools';
import MathUtils from './util/MathUtils';

// add some maps for nodes and properties -- used for object generation
import nodePrototypeMapFactory from './elements/nodes/nodeMap';
import propertyPrototypeMapFactory from './elements/properties/propertyMap';

import { Parser } from "./parser";
import { ClassDragger } from './draggers/classDragger';
import { RangeDragger } from './draggers/rangeDragger';
import { DomainDragger } from './draggers/domainDragger';
import { ShadowClone } from './draggers/shadowClone';
import d3 from 'd3';

const nodePrototypeMap = nodePrototypeMapFactory();
const propertyPrototypeMap = propertyPrototypeMapFactory();


export default class Graph {

    /**
     * @param {any} graphContainerSelector
     */
    constructor(graphContainerSelector) {
        this.graphContainerSelector = graphContainerSelector;

        this.CARDINALITY_HDISTANCE = 20;
        this.CARDINALITY_VDISTANCE = 10;
        this.curveFunction = d3.svg.line()
            .x(function (/** @type {{ x: any; }} */ d) {
                return d.x;
            })
            .y(function (/** @type {{ y: any; }} */ d) {
                return d.y;
            })
            .interpolate("cardinal");
        this.options = require("./options")();
        this.parser = new Parser(graph);
        this.language = "default";
        this.paused = false;
        // Container for visual elements
        this.graphContainer = undefined;
        this.nodeContainer = undefined;
        this.labelContainer = undefined;
        this.cardinalityContainer = undefined;
        this.linkContainer = undefined;
        // Visual elements
        this.nodeElements = undefined;
        this.initialLoad = true;
        this.updateRenderingDuringSimulation = false;
        this.labelGroupElements = undefined;
        this.linkGroups = undefined;
        this.linkPathElements = undefined;
        this.cardinalityElements = undefined;
        // Internal data
        this.classNodes = undefined;
        this.labelNodes = undefined;
        this.links = undefined;
        this.properties = undefined;
        this.unfilteredData = undefined;
        this.currentData = undefined;
        this.unfilteredDataMap = { nodes: new Map(), properties: new Map() };
        // Graph behaviour
        this.force = undefined;
        this.dragBehaviour = undefined;
        this.zoomFactor = 1.0;
        this.centerGraphViewOnLoad = false;
        this.transformAnimation = false;
        this.graphTranslation = [0, 0];
        this.graphUpdateRequired = false;
        this.pulseNodeIds = [];
        this.nodeArrayForPulse = [];
        this.nodeMap = [];
        this.locationId = 0;
        this.defaultZoom = 1.0;
        this.defaultTargetZoom = 0.8;
        this.global_dof = -1;
        this.touchDevice = false;
        this.last_touch_time = undefined;
        this.originalD3_dblClickFunction = null;
        this.originalD3_touchZoomFunction = null;

        // editing elements
        this.deleteGroupElement = undefined;
        this.addDataPropertyGroupElement = undefined;
        this.editContainer = undefined;
        this.draggerLayer = null;
        this.draggerObjectsArray = [];
        this.delayedHider = undefined;
        this.nodeFreezer = undefined;
        this.hoveredNodeElement = null;
        this.currentlySelectedNode = null;
        this.hoveredPropertyElement = null;
        this.draggingStarted = false;
        this.frozenDomainForPropertyDragger = undefined;
        this.frozenRangeForPropertyDragger = undefined;

        this.eP = 0; // id for new properties
        this.eN = 0; // id for new Nodes
        this.editMode = true;
        this.debugContainer = d3.select("#FPS_Statistics");
        this.finishedLoadingSequence = false;

        this.ignoreOtherHoverEvents = false;
        this.forceNotZooming = false;
        this.now = undefined;
        this.then = undefined; // used for fps computation
        this.showFPS = false;
        this.seenEditorHint = false;
        this.seenFilterWarning = false;
        this.showFilterWarning = false;

        this.keepDetailsCollapsedOnLoading = true;
        this.adjustingGraphSize = false;
        this.showReloadButtonAfterLayoutOptimization = false;
        this.zoom = undefined;
        //var prefixModule=require("./prefixRepresentationModule")(graph);
        this.NodePrototypeMap = createLowerCasePrototypeMap(nodePrototypeMap);
        this.PropertyPrototypeMap = createLowerCasePrototypeMap(propertyPrototypeMap);
        this.classDragger = new ClassDragger(graph);
        this.rangeDragger = new RangeDragger(graph);
        this.domainDragger = new DomainDragger(graph);
        this.shadowClone = new ShadowClone(graph);

        this.cachedJsonOBJ = null;

        this.initializeGraph();
    }

    /** --------------------------------------------------------- **/
    /** -- getter and setter definitions                       -- **/
    /** --------------------------------------------------------- **/
    isEditorMode() {
        return this.editMode;
    }

    updateZoomSliderValueFromOutside() {
        this.options.zoomSlider().updateZoomSliderValue(this.zoomFactor);
    }

    /**
     * @param {any} val
     */
    setDefaultZoom(val) {
        this.defaultZoom = val;
        this.reset();
        this.options.zoomSlider().updateZoomSliderValue(this.defaultZoom);
    }

    /**
     * @param {number} val
     */
    setTargetZoom(val) {
        this.defaultTargetZoom = val;
    }

    graphOptions() {
        return this.options;
    }

    scaleFactor() {
        return this.zoomFactor;
    }

    translation() {
        return this.graphTranslation;
    }

    // Returns the visible nodes
    graphNodeElements() {
        return this.nodeElements;
    }

    // Returns the visible Label Nodes
    graphLabelElements() {
        return this.labelNodes;
    }

    graphLinkElements() {
        return this.links;
    }

    /**
     * @param {number} val
     */
    setSliderZoom(val) {
        const _this = this;
        var cx = 0.5 * this.options.width();
        var cy = 0.5 * this.options.height();
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, this.zoomFactor);
        var sP = [cp.x, cp.y, this.options.height() / this.zoomFactor];
        var eP = [cp.x, cp.y, this.options.height() / val];
        var pos_intp = d3.interpolateZoom(sP, eP);

        this.graphContainer.attr("transform", this.transform(sP, cx, cy))
            .transition()
            .duration(1)
            .attrTween("transform", function () {
                return function (t) {
                    return transform(pos_intp(t), cx, cy);
                };
            })
            .each("end", function () {
                _this.graphContainer.attr("transform", "translate(" + graphTranslation + ")scale(" + zoomFactor + ")");
                _this.zoom.translate(graphTranslation);
                _this.zoom.scale(zoomFactor);
                _this.options.zoomSlider().updateZoomSliderValue(zoomFactor);
            });
    }

    /**
     * @param {any} value
     */
    setZoom(value) {
        this.zoom.scale(value);
    }

    /**
     * @param {any[]} translation
     */
    setTranslation(translation) {
        this.zoom.translate([translation[0], translation[1]]);
    }

    // search functionality
    getUpdateDictionary() {
        return this.parser.dictionary;
    }

    /**
     * @param {string} newLanguage
     */
    language(newLanguage) {
        if (!arguments.length) return this.language;

        // Just update if the language changes
        if (this.language !== newLanguage) {
            this.language = newLanguage || "default";
            this.redrawContent();
            this.recalculatePositions();
            this.options.searchMenu().requestDictionaryUpdate();
            this.resetSearchHighlight();
        }
        return this;
    }


    /** --------------------------------------------------------- **/
    /** graph / rendering  related functions                      **/
    /** --------------------------------------------------------- **/

    // Initializes the graph.
    initializeGraph() {
        const _this = this;
        this.options.graphContainerSelector(this.graphContainerSelector);
        var moved = false;
        this.force = d3.layout.force()
            .on("tick", this.hiddenRecalculatePositions);

        this.dragBehaviour = d3.behavior.drag()
            .origin(function (/** @type {any} */ d) {
                return d;
            })
            .on("dragstart", function (/** @type {{ type: string; parentNode: () => { (): any; new (): any; locked: boolean; }; locked: boolean; }} */ d) {
                d3.event.sourceEvent.stopPropagation(); // Prevent panning
                graph.ignoreOtherHoverEvents(true);
                if (d.type && d.type === "Class_dragger") {
                    _this.classDragger.mouseButtonPressed = true;
                    clearTimeout(_this.delayedHider);
                    _this.classDragger.selectedViaTouch(true);
                    d.parentNode().locked = true;
                    _this.draggingStarted = true;
                } else if (d.type && d.type === "Range_dragger") {
                    graph.ignoreOtherHoverEvents(true);
                    clearTimeout(_this.delayedHider);
                    _this.frozenDomainForPropertyDragger = _this.shadowClone.parentNode().domain;
                    _this.frozenRangeForPropertyDragger = _this.shadowClone.parentNode().range;
                    _this.shadowClone.setInitialPosition();
                    _this.shadowClone.hideClone(false);
                    _this.shadowClone.hideParentProperty(true);
                    _this.shadowClone.updateElement();
                    _this.deleteGroupElement.classed("hidden", true);
                    _this.addDataPropertyGroupElement.classed("hidden", true);
                    _this.frozenDomainForPropertyDragger.frozen = true;
                    _this.frozenDomainForPropertyDragger.locked = true;
                    _this.frozenRangeForPropertyDragger.frozen = true;
                    _this.frozenRangeForPropertyDragger.locked = true;
                    _this.domainDragger.updateElement();
                    _this.domainDragger.mouseButtonPressed = true;
                    _this.rangeDragger.updateElement();
                    _this.rangeDragger.mouseButtonPressed = true;
                    //  shadowClone.setPosition(d.x, d.y);
                } else if (d.type && d.type === "Domain_dragger") {
                    graph.ignoreOtherHoverEvents(true);
                    clearTimeout(_this.delayedHider);
                    _this.frozenDomainForPropertyDragger = _this.shadowClone.parentNode().domain;
                    _this.frozenRangeForPropertyDragger = _this.shadowClone.parentNode().range;
                    _this.shadowClone.setInitialPosition();
                    _this.shadowClone.hideClone(false);
                    _this.shadowClone.hideParentProperty(true);
                    _this.shadowClone.updateElement();
                    _this.deleteGroupElement.classed("hidden", true);
                    _this.addDataPropertyGroupElement.classed("hidden", true);

                    _this.frozenDomainForPropertyDragger.frozen = true;
                    _this.frozenDomainForPropertyDragger.locked = true;
                    _this.frozenRangeForPropertyDragger.frozen = true;
                    _this.frozenRangeForPropertyDragger.locked = true;
                    _this.domainDragger.updateElement();
                    _this.domainDragger.mouseButtonPressed = true;
                    _this.rangeDragger.updateElement();
                    _this.rangeDragger.mouseButtonPressed = true;
                }
                else {
                    d.locked = true;
                    moved = false;
                }
            })
            .on("drag", function (/** @type {{ type: string; px: any; py: any; renderType: string; }} */ d) {

                if (d.type && d.type === "Class_dragger") {
                    clearTimeout(_this.delayedHider);
                    _this.classDragger.setPosition(d3.event.x, d3.event.y);
                } else if (d.type && d.type === "Range_dragger") {
                    clearTimeout(_this.delayedHider);
                    _this.rangeDragger.setPosition(d3.event.x, d3.event.y);
                    _this.shadowClone.setPosition(d3.event.x, d3.event.y);
                    _this.domainDragger.updateElementViaRangeDragger(d3.event.x, d3.event.y);
                }
                else if (d.type && d.type === "Domain_dragger") {
                    clearTimeout(_this.delayedHider);
                    _this.domainDragger.setPosition(d3.event.x, d3.event.y);
                    _this.shadowClone.setPositionDomain(d3.event.x, d3.event.y);
                    _this.rangeDragger.updateElementViaDomainDragger(d3.event.x, d3.event.y);
                }
                else {
                    d.px = d3.event.x;
                    d.py = d3.event.y;
                    _this.force.resume();
                    _this.updateHaloRadius();
                    moved = true;
                    if (d.renderType && d.renderType === "round") {
                        _this.classDragger.setParentNode(d);
                    }
                }
            })
            .on("dragend", function (/** @type {any} */ d) {
                graph.ignoreOtherHoverEvents(false);
                if (d.type && d.type === "Class_dragger") {
                    var nX = _this.classDragger.x;
                    var nY = _this.classDragger.y;
                    clearTimeout(_this.delayedHider);
                    _this.classDragger.mouseButtonPressed = false;
                    _this.classDragger.selectedViaTouch(false);
                    d.setParentNode(d.parentNode());

                    var draggerEndPos = [nX, nY];
                    var targetNode = _this.getTargetNode(draggerEndPos);
                    if (targetNode) {
                        createNewObjectProperty(d.parentNode(), targetNode, draggerEndPos);
                    }
                    if (_this.touchDevice === false) {
                        editElementHoverOut();
                    }
                    _this.draggingStarted = false;
                } else if (d.type && d.type === "Range_dragger") {
                    _this.ignoreOtherHoverEvents(false);
                    _this.frozenDomainForPropertyDragger.frozen = false;
                    _this.frozenDomainForPropertyDragger.locked = false;
                    _this.frozenRangeForPropertyDragger.frozen = false;
                    _this.frozenRangeForPropertyDragger.locked = false;
                    _this.rangeDragger.mouseButtonPressed = false;
                    _this.domainDragger.mouseButtonPressed = false;
                    _this.domainDragger.updateElement();
                    _this.rangeDragger.updateElement();
                    _this.shadowClone.hideClone(true);
                    var rX = _this.rangeDragger.x;
                    var rY = _this.rangeDragger.y;
                    var rangeDraggerEndPos = [rX, rY];
                    var targetRangeNode = graph.getTargetNode(rangeDraggerEndPos);
                    if (ElementTools.isDatatype(targetRangeNode) === true) {
                        targetRangeNode = null;
                        console.log("---------------TARGET NODE IS A DATATYPE/ LITERAL ------------");
                    }

                    if (targetRangeNode === null) {
                        d.redrawEverything();
                        _this.shadowClone.hideParentProperty(false);
                    }
                    else {
                        d.updateRange(targetRangeNode);
                        _this.update();
                        _this.shadowClone.hideParentProperty(false);
                    }
                } else if (d.type && d.type === "Domain_dragger") {
                    graph.ignoreOtherHoverEvents(false);
                    _this.frozenDomainForPropertyDragger.frozen = false;
                    _this.frozenDomainForPropertyDragger.locked = false;
                    _this.frozenRangeForPropertyDragger.frozen = false;
                    _this.frozenRangeForPropertyDragger.locked = false;
                    _this.rangeDragger.mouseButtonPressed = false;
                    _this.domainDragger.mouseButtonPressed = false;
                    _this.domainDragger.updateElement();
                    _this.rangeDragger.updateElement();
                    _this.shadowClone.hideClone(true);

                    var dX = _this.domainDragger.x;
                    var dY = _this.domainDragger.y;
                    var domainDraggerEndPos = [dX, dY];
                    var targetDomainNode = graph.getTargetNode(domainDraggerEndPos);
                    if (ElementTools.isDatatype(targetDomainNode) === true) {
                        targetDomainNode = null;
                        console.log("---------------TARGET NODE IS A DATATYPE/ LITERAL ------------");
                    }
                    _this.shadowClone.hideClone(true);
                    if (targetDomainNode === null) {
                        d.redrawEverything();
                        _this.shadowClone.hideParentProperty(false);
                    }
                    else {
                        d.updateDomain(targetDomainNode);
                        _this.update();
                        _this.shadowClone.hideParentProperty(false);
                    }
                }
                else {
                    d.locked = false;
                    var pnp = _this.options.pickAndPinModule();
                    if (pnp.enabled === true && moved === true) {
                        if (d.id) { // node
                            pnp.handle(d, true);
                        }
                        if (d.property) {
                            pnp.handle(d.property, true);
                        }
                    }
                }
            });

        // Apply the zooming factor.
        this.zoom = d3.behavior.zoom()
            .duration(150)
            .scaleExtent([this.options.minMagnification(), this.options.maxMagnification()])
            .on("zoom", zoomed);
        this.draggerObjectsArray.push(this.classDragger);
        this.draggerObjectsArray.push(this.rangeDragger);
        this.draggerObjectsArray.push(this.domainDragger);
        this.draggerObjectsArray.push(this.shadowClone);
        this.force.stop();
    }

    lazyRefresh() {
        this.redrawContent();
        this.recalculatePositions();
    };

    hiddenRecalculatePositions() {
        this.finishedLoadingSequence = false;
        if (!this.options.loadingModule().loadingWasSuccessFul) {
            this.force.stop();
            d3.select("#progressBarValue").node().innerHTML = "";
            graph.updateProgressBarMode();
            this.options.loadingModule().showErrorDetailsMessage(this.hiddenRecalculatePositions);
            if (this.keepDetailsCollapsedOnLoading && this.adjustingGraphSize === false) {
                this.options.loadingModule().collapseDetails("hiddenRecalculatePositions");
            }
            return;
        }
        if (this.updateRenderingDuringSimulation === false) {
            var value = 1.0 - 10 * this.force.alpha();
            var percent = (200 * value) + "%";
            this.options.loadingModule().setPercentValue(percent);
            d3.select("#progressBarValue").style("width", percent);
            d3.select("#progressBarValue").node().innerHTML = percent;

            if (value > 0.49) {
                this.updateRenderingDuringSimulation = true;
                // show graph container;
                if (this.graphContainer) {
                    this.graphContainer.style("opacity", "1");
                    percent = "100%";
                    d3.select("#progressBarValue").style("width", percent);
                    d3.select("#progressBarValue").node().innerHTML = percent;
                    this.options.ontologyMenu().append_message_toLastBulletPoint("done");
                    d3.select("#reloadCachedOntology").classed("hidden", !this.showReloadButtonAfterLayoutOptimization);
                    if (this.showFilterWarning === true && this.seenFilterWarning === false) {
                        this.options.warningModule().showFilterHint();
                        this.seenFilterWarning = true;
                    }
                }

                if (this.initialLoad) {
                    if (graph.paused() === false)
                        this.force.resume(); // resume force
                    this.initialLoad = false;
                }
                this.finishedLoadingSequence = true;
                if (this.showFPS === true) {
                    this.force.on("tick", this.recalculatePositionsWithFPS);
                    this.recalculatePositionsWithFPS();
                }
                else {
                    this.force.on("tick", this.recalculatePositions);
                    this.recalculatePositions();
                }

                if (this.centerGraphViewOnLoad === true && this.force.nodes().length > 0) {
                    if (this.force.nodes().length < 10) this.forceRelocationEvent(true); // uses dynamic zoomer;
                    else this.forceRelocationEvent();
                    this.centerGraphViewOnLoad = false;
                    // console.log("--------------------------------------")
                }
                this.showEditorHintIfNeeded();

                if (!this.options.loadingModule().missingImportsWarning) {
                    this.options.loadingModule().hideLoadingIndicator();
                    this.options.ontologyMenu().append_bulletPoint("Successfully loaded ontology");
                    this.options.loadingModule().setSuccessful();
                } else {
                    this.options.loadingModule().showWarningDetailsMessage();
                    this.options.ontologyMenu().append_bulletPoint("Loaded ontology with warnings");
                }
            }
        }
    }

    gshowEditorHintIfNeeded() {
        if (this.seenEditorHint === false && this.editMode === true) {
            this.seenEditorHint = true;
            this.options.warningModule().showEditorHint();
        }
        this.showFPS
    }

    setForceTickFunctionWithFPS() {
        this.showFPS = true;
        if (this.force && this.finishedLoadingSequence === true) {
            this.force.on("tick", this.recalculatePositionsWithFPS());
        }

    }
    setDefaultForceTickFunction() {
        this.showFPS = false;
        if (this.force && this.finishedLoadingSequence === true) {
            this.force.on("tick", this.recalculatePositions());
        }
    }
    recalculatePositionsWithFPS() {
        // compute the fps
        this.recalculatePositions();
        this.now = Date.now();
        var diff = this.now - this.then;
        var fps = (1000 / (diff)).toFixed(2);

        this.debugContainer.node().innerHTML = "FPS: " + fps + "<br>" + "Nodes: " + this.force.nodes().length + "<br>" + "Links: " + this.force.links().length;
        this.then = Date.now();
    }

    recalculatePositions() {
        const _this = this;
        // Set node positions


        // add switch for edit mode to make this faster;
        if (!this.editMode) {
            this.nodeElements.attr("transform", function (node) {
                return "translate(" + node.x + "," + node.y + ")";
            });

            // Set label group positions
            this.labelGroupElements.attr("transform", function (label) {
                var position;

                // force centered positions on single-layered links
                var link = label.link;
                if (link.layers === 1 && !link.loops) {
                    var linkDomainIntersection = MathUtils.calculateIntersection(link.range, link.domain, 0);
                    var linkRangeIntersection = MathUtils.calculateIntersection(link.domain, link.range, 0);
                    position = MathUtils.calculateCenter(linkDomainIntersection, linkRangeIntersection);
                    label.x = position.x;
                    label.y = position.y;
                }
                return "translate(" + label.x + "," + label.y + ")";
            });
            // Set link paths and calculate additional information
            this.linkPathElements.attr("d", function (l) {
                if (l.isLoop()) {
                    return MathUtils.calculateLoopPath(l);
                }
                var curvePoint = l.label;
                var pathStart = MathUtils.calculateIntersection(curvePoint, l.domain, 1);
                var pathEnd = MathUtils.calculateIntersection(curvePoint, l.range, 1);

                return _this.curveFunction([pathStart, curvePoint, pathEnd]);
            });

            // Set cardinality positions
            this.cardinalityElements.attr("transform", function (/** @type {{ link: { label: any; } range: any; }} */ property) {

                var label = property.link.label,
                    pos = MathUtils.calculateIntersection(label, property.range, _this.CARDINALITY_HDISTANCE),
                    normalV = MathUtils.calculateNormalVector(label, property.range, _this.CARDINALITY_VDISTANCE);

                return "translate(" + (pos.x + normalV.x) + "," + (pos.y + normalV.y) + ")";
            });


            this.updateHaloRadius();
            return;
        }

        // TODO: this is Editor redraw function // we need to make this faster!!


        this.nodeElements.attr("transform", function (node) {
            return "translate(" + node.x + "," + node.y + ")";
        });

        // Set label group positions
        this.labelGroupElements.attr("transform", function (/** @type {{ link: any; x: string; y: string; linkRangeIntersection: any; linkDomainIntersection: any; }} */ label) {
            var position;

            // force centered positions on single-layered links
            var link = label.link;
            if (link.layers === 1 && !link.loops) {
                var linkDomainIntersection = MathUtils.calculateIntersection(link.range, link.domain, 0);
                var linkRangeIntersection = MathUtils.calculateIntersection(link.domain, link.range, 0);
                position = MathUtils.calculateCenter(linkDomainIntersection, linkRangeIntersection);
                label.x = position.x;
                label.y = position.y;
                label.linkRangeIntersection = linkRangeIntersection;
                label.linkDomainIntersection = linkDomainIntersection;
                if (link.property.focused === true || _this.hoveredPropertyElement !== undefined) {
                    _this.rangeDragger.updateElement();
                    _this.domainDragger.updateElement();
                    // shadowClone.setPosition(link.property.range.x,link.property.range.y);
                    // shadowClone.setPositionDomain(link.property.domain.x,link.property.domain.y);
                }
            } else {
                label.linkDomainIntersection = MathUtils.calculateIntersection(link.label, link.domain, 0);
                label.linkRangeIntersection = MathUtils.calculateIntersection(link.label, link.range, 0);
                if (link.property.focused === true || _this.hoveredPropertyElement !== undefined) {
                    _this.rangeDragger.updateElement();
                    _this.domainDragger.updateElement();
                    // shadowClone.setPosition(link.property.range.x,link.property.range.y);
                    // shadowClone.setPositionDomain(link.property.domain.x,link.property.domain.y);
                }

            }
            return "translate(" + label.x + "," + label.y + ")";
        });
        // Set link paths and calculate additional information
        this.linkPathElements.attr("d", function (l) {
            if (l.isLoop()) {

                var ptrAr = MathUtils.getLoopPoints(l);
                l.label.linkRangeIntersection = ptrAr[1];
                l.label.linkDomainIntersection = ptrAr[0];

                if (l.property.focused === true || _this.hoveredPropertyElement !== undefined) {
                    _this.rangeDragger.updateElement();
                    _this.domainDragger.updateElement();
                }
                return MathUtils.calculateLoopPath(l);
            }
            var curvePoint = l.label;
            var pathStart = MathUtils.calculateIntersection(curvePoint, l.domain, 1);
            var pathEnd = MathUtils.calculateIntersection(curvePoint, l.range, 1);
            l.linkRangeIntersection = pathStart;
            l.linkDomainIntersection = pathEnd;
            if (l.property.focused === true || _this.hoveredPropertyElement !== undefined) {
                _this.domainDragger.updateElement();
                _this.rangeDragger.updateElement();
                // shadowClone.setPosition(l.property.range.x,l.property.range.y);
                // shadowClone.setPositionDomain(l.property.domain.x,l.property.domain.y);
            }
            return _this.curveFunction([pathStart, curvePoint, pathEnd]);
        });

        // Set cardinality positions
        this.cardinalityElements.attr("transform", function (/** @type {{ link: { label: any; }; range: any; }} */ property) {

            var label = property.link.label,
                pos = MathUtils.calculateIntersection(label, property.range, _this.CARDINALITY_HDISTANCE),
                normalV = MathUtils.calculateNormalVector(label, property.range, _this.CARDINALITY_VDISTANCE);

            return "translate(" + (pos.x + normalV.x) + "," + (pos.y + normalV.y) + ")";
        });

        if (this.hoveredNodeElement) {
            this.setDeleteHoverElementPosition(this.hoveredNodeElement);
            this.setAddDataPropertyHoverElementPosition(this.hoveredNodeElement);
            if (this.draggingStarted === false) {
                this.classDragger.setParentNode(this.hoveredNodeElement);
            }
        }
        if (this.hoveredPropertyElement) {
            this.setDeleteHoverElementPositionProperty(this.hoveredPropertyElement);
        }

        this.updateHaloRadius();
    }

    /**
     * @param {{ type: string; }} property
     */
    updatePropertyDraggerElements(property) {
        if (property.type !== "owl:DatatypeProperty") {

            this.shadowClone.setParentProperty(property);
            this.rangeDragger.setParentProperty(property);
            this.rangeDragger.hideDragger(false);
            this.rangeDragger.addMouseEvents();
            this.domainDragger.setParentProperty(property);
            this.domainDragger.hideDragger(false);
            this.domainDragger.addMouseEvents();

        }
        else {
            this.rangeDragger.hideDragger(true);
            this.domainDragger.hideDragger(true);
            this.shadowClone.hideClone(true);
        }
    }

    addClickEvents() {
        const _this = this;
        /**
         * @param {any} selectedElement
         */
        function executeModules(selectedElement) {
            _this.options.selectionModules().forEach(function (/** @type {{ handle: (arg0: any) => void; }} */ module) {
                module.handle(selectedElement);
            });
        }

        this.nodeElements.on("click", function (clickedNode) {

            // manaual double clicker // helper for iphone 6 etc...
            if (_this.touchDevice === true && this.doubletap() === true) {
                d3.event.stopPropagation();
                if (_this.editMode === true) {
                    clickedNode.raiseDoubleClickEdit(_this.defaultIriValue(clickedNode));
                }
            }
            else {
                executeModules(clickedNode);
            }
        });

        this.nodeElements.on("dblclick", function (/** @type {{ raiseDoubleClickEdit: (arg0: boolean) => void; }} */ clickedNode) {

            d3.event.stopPropagation();
            if (_this.editMode === true) {
                clickedNode.raiseDoubleClickEdit(_this.defaultIriValue(clickedNode));
            }
        });

        this.labelGroupElements.selectAll(".label").on("click", function (/** @type {{ raiseDoubleClickEdit: (arg0: any) => void; }} */ clickedProperty) {
            executeModules(clickedProperty);

            // this is for enviroments that do not define dblClick function;
            if (_this.touchDevice === true && _this.doubletap() === true) {
                d3.event.stopPropagation();
                if (_this.editMode === true) {
                    clickedProperty.raiseDoubleClickEdit(_this.defaultIriValue(clickedProperty));
                }
            }

            // currently removed the selection of an element to invoke the dragger
            // if (editMode===true && clickedProperty.editingTextElement!==true) {
            //     return;
            //      // We say that Datatype properties are not allowed to have domain range draggers
            //      if (clickedProperty.focused && clickedProperty.type !== "owl:DatatypeProperty") {
            //          shadowClone.setParentProperty(clickedProperty);
            //          rangeDragger.setParentProperty(clickedProperty);
            //          rangeDragger.hideDragger(false);
            //          rangeDragger.addMouseEvents();
            //          domainDragger.setParentProperty(clickedProperty);
            //          domainDragger.hideDragger(false);
            //          domainDragger.addMouseEvents();
            //
            //          if (clickedProperty.domain===clickedProperty.range){
            //              clickedProperty.labelObject.increasedLoopAngle=true;
            //              recalculatePositions();
            //
            //          }
            //
            //      } else if (clickedProperty.focused && clickedProperty.type === "owl:DatatypeProperty") {
            //          shadowClone.setParentProperty(clickedProperty);
            //          rangeDragger.setParentProperty(clickedProperty);
            //          rangeDragger.hideDragger(true);
            //          rangeDragger.addMouseEvents();
            //          domainDragger.setParentProperty(clickedProperty);
            //          domainDragger.hideDragger(false);
            //          domainDragger.addMouseEvents();
            //
            //      }
            //      else {
            //          rangeDragger.hideDragger(true);
            //          domainDragger.hideDragger(true);
            //          if (clickedProperty.domain===clickedProperty.range){
            //              clickedProperty.labelObject.increasedLoopAngle=false;
            //              recalculatePositions();
            //
            //          }
            //      }
            //  }
        });
        this.labelGroupElements.selectAll(".label").on("dblclick", function (/** @type {{ raiseDoubleClickEdit: (arg0: boolean) => void; }} */ clickedProperty) {
            d3.event.stopPropagation();
            if (_this.editMode === true) {
                clickedProperty.raiseDoubleClickEdit(_this.defaultIriValue(clickedProperty));
            }

        });
    }

    /**
     * @param {{ raiseDoubleClickEdit?: ((arg0: boolean) => void) | ((arg0: any) => void) | ((arg0: boolean) => void); id?: any; iri?: any; }} element
     */
    defaultIriValue(element) {
        // get the iri of that element;
        if (this.options.getGeneralMetaObject().iri) {
            var str2Compare = this.options.getGeneralMetaObject().iri + element.id;
            return element.iri === str2Compare;
        }
        return false;
    }

    /** Adjusts the containers current scale and position. */
    zoomed() {
        const _this = this;
        if (this.forceNotZooming === true) {
            this.zoom.translate(this.graphTranslation);
            this.zoom.scale(this.zoomFactor);
            return;
        }


        var zoomEventByMWheel = false;
        if (d3.event.sourceEvent) {
            if (d3.event.sourceEvent.deltaY) zoomEventByMWheel = true;
        }
        if (zoomEventByMWheel === false) {
            if (this.transformAnimation === true) {
                return;
            }
            this.zoomFactor = d3.event.scale;
            this.graphTranslation = d3.event.translate;
            this.graphContainer.attr("transform", "translate(" + this.graphTranslation + ")scale(" + this.zoomFactor + ")");
            this.updateHaloRadius();
            this.options.zoomSlider().updateZoomSliderValue(zoomFactor);
            return;
        }
        /** animate the transition **/
        this.zoomFactor = d3.event.scale;
        this.graphTranslation = d3.event.translate;
        this.graphContainer.transition()
            .tween("attr.translate", function () {
                return function (t) {
                    _this.transformAnimation = true;
                    var tr = d3.transform(_this.graphContainer.attr("transform"));
                    _this.graphTranslation[0] = tr.translate[0];
                    _this.graphTranslation[1] = tr.translate[1];
                    _this.zoomFactor = tr.scale[0];
                    _this.updateHaloRadius();
                    _this.options.zoomSlider().updateZoomSliderValue(this.zoomFactor);
                };
            })
            .each("end", function () {
                _this.transformAnimation = false;
            })
            .attr("transform", "translate(" + this.graphTranslation + ")scale(" + this.zoomFactor + ")")
            .ease('linear')
            .duration(250);
    }// end of zoomed function

    redrawGraph() {
        this.remove();

        this.graphContainer = d3.selectAll(this.options.graphContainerSelector())
            .append("svg")
            .classed("vowlGraph", true)
            .attr("width", this.options.width)
            .attr("height", this.options.height)
            .call(this.zoom)
            .append("g");
        // add touch and double click functions

        var svgGraph = d3.selectAll(".vowlGraph");
        this.originalD3_dblClickFunction = svgGraph.on("dblclick.zoom");
        this.originalD3_touchZoomFunction = svgGraph.on("touchstart");
        svgGraph.on("touchstart", this.touchzoomed);
        if (this.editMode === true) {
            svgGraph.on("dblclick.zoom", this.modified_dblClickFunction);
        }
        else {
            svgGraph.on("dblclick.zoom", this.originalD3_dblClickFunction);
        }

    }

    generateEditElements() {
        this.addDataPropertyGroupElement = this.editContainer.append('g')
            .classed("hidden-in-export", true)
            .classed("hidden", true)
            .classed("addDataPropertyElement", true)
            .attr("transform", "translate(" + 0 + "," + 0 + ")");


        this.addDataPropertyGroupElement.append("circle")
            // .classed("deleteElement", true)
            .attr("r", 12)
            .attr("cx", 0)
            .attr("cy", 0)
            .append("title").text("Add Datatype Property");

        this.addDataPropertyGroupElement.append("line")
            // .classed("deleteElementIcon ",true)
            .attr("x1", -8)
            .attr("y1", 0)
            .attr("x2", 8)
            .attr("y2", 0)
            .append("title").text("Add Datatype Property");

        this.addDataPropertyGroupElement.append("line")
            // .classed("deleteElementIcon",true)
            .attr("x1", 0)
            .attr("y1", -8)
            .attr("x2", 0)
            .attr("y2", 8)
            .append("title").text("Add Datatype Property");

        if (this.options.useAccuracyHelper()) {
            this.addDataPropertyGroupElement.append("circle")
                .attr("r", 15)
                .attr("cx", -7)
                .attr("cy", 7)
                .classed("superHiddenElement", true)
                .classed("superOpacityElement", !this.options.showDraggerObject());
        }

        this.deleteGroupElement = this.editContainer.append('g')
            .classed("hidden-in-export", true)
            .classed("hidden", true)
            .classed("deleteParentElement", true)
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

        this.deleteGroupElement.append("circle")
            .attr("r", 12)
            .attr("cx", 0)
            .attr("cy", 0)
            .append("title").text("Delete This Node");

        var crossLen = 5;
        this.deleteGroupElement.append("line")
            .attr("x1", -crossLen)
            .attr("y1", -crossLen)
            .attr("x2", crossLen)
            .attr("y2", crossLen)
            .append("title").text("Delete This Node");

        this.deleteGroupElement.append("line")
            .attr("x1", crossLen)
            .attr("y1", -crossLen)
            .attr("x2", -crossLen)
            .attr("y2", crossLen)
            .append("title").text("Delete This Node");

        if (this.options.useAccuracyHelper()) {
            this.deleteGroupElement.append("circle")
                .attr("r", 15)
                .attr("cx", 7)
                .attr("cy", -7)
                .classed("superHiddenElement", true)
                .classed("superOpacityElement", !this.options.showDraggerObject());
        }
    }



    getClassDataForTtlExport() {
        var allNodes = this.unfilteredData.nodes;
        var nodeData = [];
        for (var i = 0; i < allNodes.length; i++) {
            if (allNodes[i].type !== "rdfs:Literal" &&
                allNodes[i].type !== "rdfs:Datatype" &&
                allNodes[i].type !== "owl:Thing") {
                nodeData.push(allNodes[i]);
            }
        }
        return nodeData;
    }

    getPropertyDataForTtlExport() {
        var propertyData = [];
        var allProperties = this.unfilteredData.properties;
        for (var i = 0; i < allProperties.length; i++) {
            // currently using only the object properties
            if (allProperties[i].type === "owl:ObjectProperty" ||
                allProperties[i].type === "owl:DatatypeProperty" ||
                allProperties[i].type === "owl:ObjectProperty"
            ) {
                propertyData.push(allProperties[i]);
            } else {
                if (allProperties[i].type === "rdfs:subClassOf") {
                    allProperties[i].baseIri = "http://www.w3.org/2000/01/rdf-schema#";
                    allProperties[i].iri = "http://www.w3.org/2000/01/rdf-schema#subClassOf";
                }
                if (allProperties[i].type === "owl:disjointWith") {
                    allProperties[i].baseIri = "http://www.w3.org/2002/07/owl#";
                    allProperties[i].iri = "http://www.w3.org/2002/07/owl#disjointWith";
                }
            }
        }
        return propertyData;
    }

    // NOTE: Disabled to save memory while this method is not used
    /**
     * This function is a no-op. It is currently not used anywhere in the code base.
     * @returns An empty array. Always.
     */
    // graph.getAxiomsForTtlExport = function () {
    //     var axioms = [];
    //     var allProperties = unfilteredData.properties;
    //     for (var i = 0; i < allProperties.length; i++) {
    //         // currently using only the object properties
    //         if (allProperties[i].type === "owl:ObjectProperty" ||
    //             allProperties[i].type === "owl:DatatypeProperty" ||
    //             allProperties[i].type === "owl:ObjectProperty" ||
    //             allProperties[i].type === "rdfs:subClassOf"
    //         ) { } else { }
    //     }
    //     return axioms;
    // }

    redrawContent() {
        const _this = this;
        var markerContainer;

        if (!this.graphContainer) {
            return;
        }

        // Empty the graph container
        this.graphContainer.selectAll("*").remove();

        // Last container -> elements of this container overlap others
        this.linkContainer = this.graphContainer.append("g").classed("linkContainer", true);
        this.cardinalityContainer = this.graphContainer.append("g").classed("cardinalityContainer", true);
        this.labelContainer = this.graphContainer.append("g").classed("labelContainer", true);
        this.nodeContainer = this.graphContainer.append("g").classed("nodeContainer", true);

        // adding editing Elements
        var draggerPathLayer = this.graphContainer.append("g").classed("linkContainer", true);
        this.draggerLayer = this.graphContainer.append("g").classed("editContainer", true);
        this.editContainer = this.graphContainer.append("g").classed("editContainer", true);

        this.draggerPathLayer.classed("hidden-in-export", true);
        this.editContainer.classed("hidden-in-export", true);
        this.draggerLayer.classed("hidden-in-export", true);

        // Add an extra container for all markers
        markerContainer = this.linkContainer.append("defs");
        var drElement = this.draggerLayer.selectAll(".node")
            .data(_this.draggerObjectsArray).enter()
            .append("g")
            .classed("node", true)
            .classed("hidden-in-export", true)
            .attr("id", function (d) {
                return d.id;
            })
            .call(_this.dragBehaviour);
        drElement.each(function (node) {
            node.svgRoot = d3.select(this);
            node.svgPathLayer(draggerPathLayer);
            if (node.type === "shadowClone") {
                node.drawClone();
                node.hideClone(true);
            } else {
                node.drawNode();
                node.hideDragger(true);
            }
        });
        this.generateEditElements();


        // Add an extra container for all markers
        markerContainer = this.linkContainer.append("defs");

        // Draw nodes

        if (this.classNodes === undefined) this.classNodes = [];

        this.nodeElements = this.nodeContainer.selectAll(".node")
            .data(this.classNodes).enter()
            .append("g")
            .classed("node", true)
            .attr("id", function (d) {
                return d.id;
            })
            .call(this.dragBehaviour);
        this.nodeElements.each(function (node) {
            node.draw(d3.select(this));
        });


        if (this.labelNodes === undefined) this.labelNodes = [];

        // Draw label groups (property + inverse)
        this.labelGroupElements = this.labelContainer.selectAll(".labelGroup")
            .data(this.labelNodes).enter()
            .append("g")
            .classed("labelGroup", true)
            .call(this.dragBehaviour);

        this.labelGroupElements.each(function (label) {
            var success = label.draw(d3.select(this));
            label.property.labelObject = label;
            // Remove empty groups without a label.
            if (!success) {
                d3.select(this).remove();
            }
        });
        // Place subclass label groups on the bottom of all labels
        this.labelGroupElements.each(function (label) {
            // the label might be hidden e.g. in compact notation
            if (!this.parentNode) {
                return;
            }

            if (ElementTools.isRdfsSubClassOf(label.property)) {
                var parentNode = this.parentNode;
                parentNode.insertBefore(this, parentNode.firstChild);
            }
        });
        if (this.properties === undefined) this.properties = [];
        // Draw cardinality elements
        this.cardinalityElements = this.cardinalityContainer.selectAll(".cardinality")
            .data(this.properties).enter()
            .append("g")
            .classed("cardinality", true);

        this.cardinalityElements.each(function (property) {
            var success = property.drawCardinality(d3.select(this));

            // Remove empty groups without a label.
            if (!success) {
                d3.select(this).remove();
            }
        });
        // Draw links
        if (this.links === undefined) this.links = [];
        this.linkGroups = this.linkContainer.selectAll(".link")
            .data(this.links).enter()
            .append("g")
            .classed("link", true);

        this.linkGroups.each(function (link) {
            link.draw(d3.select(this), markerContainer);
        });
        this.linkPathElements = this.linkGroups.selectAll("path");
        // Select the path for direct access to receive a better performance
        this.addClickEvents();
    }

    remove() {
        if (this.graphContainer) {
            // Select the parent element because the graph container is a group (e.g. for zooming)
            d3.select(this.graphContainer.node().parentNode).remove();
        }
    }

    updateCanvasContainerSize() {
        if (this.graphContainer) {
            var svgElement = d3.selectAll(".vowlGraph");
            svgElement.attr("width", this.options.labelWidth);
            svgElement.attr("height", this.options.height);
            this.graphContainer.attr("transform", "translate(" + this.graphTranslation + ")scale(" + this.zoomFactor + ")");
        }
    }

    // Loads all settings, removes the old graph (if it exists) and draws a new one.
    start() {
        this.force.stop();
        this.loadGraphData(true);
        this.redrawGraph();
        this.update(true);

        if (!this.options.loadingModule().loadingWasSuccessFul) {
            this.options.loadingModule().setErrorMode();
        }

    }

    // Updates only the style of the graph.
    updateStyle() {
        this.refreshGraphStyle();
        if (!this.options.loadingModule().loadingWasSuccessFul) {
            this.force.stop();
        } else {
            this.force.start();
        }
    }


    load() {
        this.force.stop();
        this.loadGraphData();
        this.labelNodes = this.computeLabelNodes(LinkCreator.createLinks(this.unfilteredData.properties));
        for (var i = 0; i < this.labelNodes.length; i++) {
            var label = this.labelNodes[i];
            if (label.property.x && label.property.y) {
                label.x = label.property.x;
                label.y = label.property.y;
                // also set the prev position of the label
                label.px = label.x;
                label.py = label.y;
            }
        }
        this.update(false, this.unfilteredData);
    }

    fastUpdate() {
        // fast update function for editor calls;
        // -- experimental ;
        this.quick_refreshGraphData();
        this.updateNodeMap();
        this.force.start();
        this.redrawContent();
        this.updatePulseIds(this.nodeArrayForPulse);
        this.refreshGraphStyle();
        this.updateHaloStyles();

    }

    updateNodeMap() {
        this.nodeMap = [];
        var node;
        for (var j = 0; j < this.force.nodes().length; j++) {
            node = this.force.nodes()[j];
            if (node.id) {
                this.nodeMap[node.id] = j;
                // check for equivalents
                var eqs = node.equivalents;
                if (eqs.length > 0) {
                    for (var e = 0; e < eqs.length; e++) {
                        var eqObject = eqs[e];
                        this.nodeMap[eqObject.id] = j;
                    }
                }
            }
            if (node.property) {
                this.nodeMap[node.property.id] = j;
                var inverse = node.inverse;
                if (inverse) {
                    this.nodeMap[inverse.id] = j;
                }
            }
        }
    }

    updateHaloStyles() {
        var haloElement;
        var halo;
        var node;
        for (var j = 0; j < this.force.nodes().length; j++) {
            node = this.force.nodes()[j];
            if (node.id) {
                haloElement = node.haloGroupElement;
                if (haloElement) {
                    halo = haloElement.selectAll(".searchResultA");
                    halo.classed("searchResultA", false);
                    halo.classed("searchResultB", true);
                }
            }

            if (node.property) {
                haloElement = node.property.haloGroupElement;
                if (haloElement) {
                    halo = haloElement.selectAll(".searchResultA");
                    halo.classed("searchResultA", false);
                    halo.classed("searchResultB", true);
                }
            }
        }
    }

    /**
     * Updates the graphs displayed data and style.
     * @note `data` will be mutated by this function, thus it should be cloned beforehand.
     * @param {boolean} init Is first time load?
     * @param {object} data An object containing nodes and properties.
     *  I.e. `preprocessedData.nodes` && `preprocessedData.properties`.
     * @returns
     */
    update(init, data = this.currentData) {
        var validOntology = this.options.loadingModule().loadingWasSuccessFul;
        if (validOntology === false && init === true) {
            this.options.loadingModule().collapseDetails();
            return;
        }
        if (validOntology === false) {
            return;
        }

        this.keepDetailsCollapsedOnLoading = false;
        this.refreshGraphData(data);
        this.updateNodeMap();

        this.force.start();
        this.redrawContent();
        this.updatePulseIds(this.nodeArrayForPulse);
        this.refreshGraphStyle();
        this.updateHaloStyles();
    }

    paused(p) {
        if (!arguments.length) return this.paused;
        this.paused = p;
        this.updateStyle();
        return this;
    }

    // resetting the graph
    reset() {
        const _this = this;
        if (this.unfilteredData) {
            this.options.filterModules().forEach(function (/** @type {any} */ module) {
                _this.filterFunction(module, _this.unfilteredData, true);
            });
        }
        this.currentData = this.unfilteredData;
        // window size
        let w = 0.5 * this.options.width();
        let h = 0.5 * this.options.height();
        // computing initial translation for the graph due to the dynamic default zoom level
        let tx = w - this.defaultZoom * w;
        let ty = h - this.defaultZoom * h;
        this.zoom.translate([tx, ty])
            .scale(this.defaultZoom);
    }

    zoomOut() {
        const _this = this;
        var minMag = this.options.minMagnification(),
            maxMag = this.options.maxMagnification();
        var stepSize = (maxMag - minMag) / 10;
        var val = this.zoomFactor - stepSize;
        if (val < minMag) val = minMag;

        var cx = 0.5 * this.options.width();
        var cy = 0.5 * this.options.height();
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, this.zoomFactor);
        var sP = [cp.x, cp.y, this.options.height() / this.zoomFactor];
        var eP = [cp.x, cp.y, this.options.height() / val];
        var pos_intp = d3.interpolateZoom(sP, eP);

        this.graphContainer.attr("transform", this.transform(sP, cx, cy))
            .transition()
            .duration(250)
            .attrTween("transform", function () {
                return function (t) {
                    return this.transform(pos_intp(t), cx, cy);
                };
            })
            .each("end", function () {
                _this.graphContainer.attr("transform", "translate(" + _this.graphTranslation + ")scale(" + _this.zoomFactor + ")");
                _this.zoom.translate(_this.graphTranslation);
                _this.zoom.scale(_this.zoomFactor);
                _this.updateHaloRadius();
                _this.options.zoomSlider().updateZoomSliderValue(_this.zoomFactor);
            });

    }

    zoomIn() {
        const _this = this;
        var minMag = this.options.minMagnification(),
            maxMag = this.options.maxMagnification();
        var stepSize = (maxMag - minMag) / 10;
        var val = this.zoomFactor + stepSize;
        if (val > maxMag) val = maxMag;
        var cx = 0.5 * this.options.width();
        var cy = 0.5 * this.options.height();
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, zoomFactor);
        var sP = [cp.x, cp.y, this.options.height() / this.zoomFactor];
        var eP = [cp.x, cp.y, this.options.height() / val];
        var pos_intp = d3.interpolateZoom(sP, eP);

        this.graphContainer.attr("transform", transform(sP, cx, cy))
            .transition()
            .duration(250)
            .attrTween("transform", function () {
                return function (t) {
                    return transform(pos_intp(t), cx, cy);
                };
            })
            .each("end", function () {
                _this.graphContainer.attr("transform", "translate(" + _this.graphTranslation + ")scale(" + _this.zoomFactor + ")");
                _this.zoom.translate(graphTranslation);
                _this.zoom.scale(zoomFactor);
                _this.updateHaloRadius();
                _this.options.zoomSlider().updateZoomSliderValue(_this.zoomFactor);
            });
    }

    /** --------------------------------------------------------- **/
    /** -- data related handling                               -- **/
    /** --------------------------------------------------------- **/

    clearAllGraphData() {
        if (this.graphNodeElements() && this.graphNodeElements().length > 0) {
            this.cachedJsonOBJ = this.options.exportMenu().createJSON_exportObject();
        } else {
            this.cachedJsonOBJ = null;
        }
        this.force.stop();
        if (this.unfilteredData) {
            this.unfilteredData.nodes = [];
            this.unfilteredData.properties = [];
        }
    }

    // removes data when data could not be loaded
    clearGraphData() {
        this.force.stop();
        var sidebar = this.options.sidebar();
        if (sidebar)
            sidebar.clearOntologyInformation();
        if (this.graphContainer)
            this.redrawGraph();
    }

    generateDictionary(data) {
        var originalDictionary = [];
        var nodes = data.nodes;
        for (let i = 0; i < nodes.length; i++) {
            // check if node has a label
            if (nodes[i].labelForCurrentLanguage() !== undefined)
                originalDictionary.push(nodes[i]);
        }
        var props = data.properties;
        for (let i = 0; i < props.length; i++) {
            if (props[i].labelForCurrentLanguage() !== undefined)
                originalDictionary.push(props[i]);
        }
        this.parser.dictionary = originalDictionary;

        var literFilter = this.options.literalFilter();
        var idsToRemove = literFilter.removedNodes; // A set
        var originalDict = this.parser.dictionary;
        var newDict = [];

        // go through the dictionary and remove the ids;
        for (let i = 0; i < originalDict.length; i++) {
            let dictElement = originalDict[i];
            let dictElementId = dictElement.property ? dictElement.property.id : dictElement.id;
            if (!idsToRemove.has(dictElementId)) {
                newDict.push(dictElement);
            }
        }
        // tell the parser that the dictionary is updated
        this.parser.dictionary = newDict;
    }

    updateProgressBarMode() {
        var loadingModule = this.options.loadingModule();

        var state = loadingModule.progressBarMode;
        switch (state) {
            case 0:
                loadingModule.setErrorMode();
                break;
            case 1:
                loadingModule.setBusyMode();
                break;
            case 2:
                loadingModule.setPercentMode();
                break;
            default:
                loadingModule.setPercentMode();
        }
    }

    setFilterWarning(val) {
        this.showFilterWarning = val;
    }
    loadGraphData(init) {
        const _this = this;
        // reset the locate button and previously selected locations and other variables

        var loadingModule = this.options.loadingModule();
        this.force.stop();

        this.force.nodes([]);
        this.force.links([]);
        this.nodeArrayForPulse = [];
        this.pulseNodeIds = [];
        this.locationId = 0;
        d3.select("#locateSearchResult").classed("highlighted", false);
        d3.select("#locateSearchResult").node().title = "Nothing to locate";
        this.clearGraphData();

        if (init) {
            this.force.stop();
            return;
        }

        this.showFilterWarning = false;
        this.parser.parse(this.options.data());
        this.unfilteredData = {
            nodes: this.parser.nodes,
            properties: this.parser.properties
        };

        // fixing class and property id counter for the editor
        this.eN = this.unfilteredData.nodes.length + 1;
        this.eP = this.unfilteredData.properties.length + 1;


        // using the ids of elements if to ensure that loaded elements will not get the same id;
        for (var p = 0; p < this.unfilteredData.properties.length; p++) {
            var currentId = this.unfilteredData.properties[p].id;
            if (currentId.indexOf('objectProperty') !== -1) {
                // could be ours;
                var idStr = currentId.split('objectProperty');
                if (idStr[0].length === 0) {
                    var idInt = parseInt(idStr[1]);
                    if (this.eP < idInt) {
                        this.eP = idInt + 1;
                    }
                }
            }
        }
        // using the ids of elements if to ensure that loaded elements will not get the same id;
        for (var n = 0; n < this.unfilteredData.nodes.length; n++) {
            var currentId_Nodes = this.unfilteredData.nodes[n].id;
            if (currentId_Nodes.indexOf('Class') !== -1) {
                // could be ours;
                var idStr_Nodes = currentId_Nodes.split('Class');
                if (idStr_Nodes[0].length === 0) {
                    var idInt_Nodes = parseInt(idStr_Nodes[1]);
                    if (this.eN < idInt_Nodes) {
                        this.eN = idInt_Nodes + 1;
                    }
                }
            }
        }

        this.links = LinkCreator.createLinks(this.unfilteredData.properties);
        this.storeLinksOnNodes(this.unfilteredData.nodes, this.links);
        this.currentData = this.unfilteredData;

        this.initialLoad = true;
        this.options.warningModule().closeFilterHint();

        // loading handler
        this.updateRenderingDuringSimulation = true;
        var validOntology = this.options.loadingModule().loadingWasSuccessFul;
        if (this.graphContainer && validOntology === true) {
            this.updateRenderingDuringSimulation = false;
            this.options.ontologyMenu().append_bulletPoint("Generating visualization ... ");
            loadingModule.setPercentMode();

            if (this.unfilteredData.nodes.length > 0) {
                this.graphContainer.style("opacity", "0");
                this.force.on("tick", this.hiddenRecalculatePositions);
            } else {
                this.graphContainer.style("opacity", "1");
                if (this.showFPS === true) {
                    this.force.on("tick", this.recalculatePositionsWithFPS);
                }
                else {
                    this.force.on("tick", this.recalculatePositions);
                }
            }
            this.force.start();
        } else {
            this.force.stop();
            this.options.ontologyMenu().append_bulletPoint("Failed to load ontology");
            loadingModule.setErrorMode();
        }
        // update prefixList(
        // update general MetaOBJECT
        this.options.clearMetaObject();
        this.options.clearGeneralMetaObject();
        this.options.editSidebar().clearMetaObjectValue();
        if (this.options.data() !== undefined) {
            var header = this.options.data().header;
            if (header) {
                if (header.iri) {
                    this.options.addOrUpdateGeneralObjectEntry("iri", header.iri);
                }
                if (header.title) {
                    this.options.addOrUpdateGeneralObjectEntry("title", header.title);
                }
                if (header.author) {
                    this.options.addOrUpdateGeneralObjectEntry("author", header.author);
                }
                if (header.version) {
                    this.options.addOrUpdateGeneralObjectEntry("version", header.version);
                }
                if (header.description) {
                    this.options.addOrUpdateGeneralObjectEntry("description", header.description);
                }
                if (header.prefixList) {
                    var pL = header.prefixList;
                    for (var pr in pL) {
                        if (pL.hasOwnProperty(pr)) {
                            var val = pL[pr];
                            this.options.addPrefix(pr, val);
                        }
                    }
                }
                // get other metadata;
                if (header.other) {
                    var otherObjects = header.other;
                    for (var name in otherObjects) {
                        if (otherObjects.hasOwnProperty(name)) {
                            var otherObj = otherObjects[name];
                            if (otherObj.hasOwnProperty("identifier") && otherObj.hasOwnProperty("value")) {
                                this.options.addOrUpdateMetaObjectEntry(otherObj.identfier, otherObj.value);
                            }
                        }
                    }
                }
            }
        }
        // update more meta OBJECT
        // Initialize filters with data to replicate consecutive filtering
        this.links = LinkCreator.createLinks(this.unfilteredData.properties);
        this.storeLinksOnNodes(this.unfilteredData.nodes, this.links);

        // Create a map of all nodes and properties for fast lookup
        this.unfilteredData.nodes.forEach((node) => {
            this.unfilteredDataMap.nodes.set(node.id, node);
        });
        this.unfilteredData.properties.forEach((property) => {
            this.unfilteredDataMap.properties.set(property.id, property);
        });

        // currentData = unfilteredData;
        this.options.filterModules().forEach(function (module) {
            _this.filterFunction(module, unfilteredData, true);
        });

        // generate dictionary here ;
        this.generateDictionary(this.unfilteredData);

        this.parser.parseSettings();
        this.graphUpdateRequired = this.parser.settingsImported;
        this.centerGraphViewOnLoad = true;
        if (this.parser.settingsImportGraphZoomAndTranslation) {
            this.centerGraphViewOnLoad = false;
        }
        this.options.searchMenu().requestDictionaryUpdate();
        this.options.editSidebar().updateGeneralOntologyInfo();
        this.options.editSidebar().updatePrefixUi();
        this.options.editSidebar().updateElementWidth();
    }

    handleOnLoadingError() {
        this.force.stop();
        this.graph.clearGraphData();
        this.options.ontologyMenu().append_bulletPoint("Failed to load ontology");
        d3.select("#progressBarValue").node().innerHTML = "";
        d3.select("#progressBarValue").classed("busyProgressBar", false);
        this.options.loadingModule().setErrorMode();
        this.options.loadingModule().showErrorDetailsMessage();
    }

    quick_refreshGraphData() {
        this.links = LinkCreator.createLinks(this.properties);
        this.labelNodes = this.computeLabelNodes(this.links);

        this.storeLinksOnNodes(this.classNodes, this.links);
        this.setForceLayoutData(this.classNodes, this.labelNodes, this.links);
    }

    computeLabelNodes(links) {
        return links.map(function (link) {
            return link.label;
        });
    }

    /**
     * Applies the data of the graph options object and parses it. The graph is not redrawn.
     * @note `preprocessedData` will be mutated by this function, thus it should be cloned beforehand.
     * @param {object} preprocessedData An object containing nodes and properties.
     *  I.e. `preprocessedData.nodes` && `preprocessedData.properties`.
     */
    refreshGraphData(preprocessedData) {
        const _this = this;
        let shouldExecuteEmptyFilter = this.options.literalFilter().enabled;
        this.graph.executeEmptyLiteralFilter();
        this.options.literalFilter().enabled = shouldExecuteEmptyFilter;

        // Filter the data
        this.links = LinkCreator.createLinks(preprocessedData.properties);
        this.storeLinksOnNodes(preprocessedData.nodes, this.links);
        this.options.filterModules().forEach(function (module) {
            preprocessedData = _this.filterFunction(module, preprocessedData);
        });
        this.options.focuserModule().handle(undefined, true);
        this.classNodes = preprocessedData.nodes;
        this.properties = preprocessedData.properties;
        this.links = LinkCreator.createLinks(this.properties);
        this.labelNodes = this.computeLabelNodes(this.links);
        this.storeLinksOnNodes(this.classNodes, this.links);
        this.setForceLayoutData(this.classNodes, this.labelNodes, this.links);
        // for (var i = 0; i < classNodes.length; i++) {
        //     if (classNodes[i].rectangularRepresentation)
        //         classNodes[i].rectangularRepresentation = this.options.rectangularRepresentation();
        // }
    }

    /**
     * Create a subgraph with `rootNodeID` as root.
     * @param {string} rootNodeID
     */
    loadSearchData(rootNodeID) {
        let nodes = [this.unfilteredDataMap.nodes.get(rootNodeID)];
        if (nodes[0] === undefined) {
            let prop = this.unfilteredDataMap.properties.get(rootNodeID);
            if (prop !== undefined) {
                nodes = [prop.domain, prop.range];
            } else {
                console.log(`Failed to find a node or property with id ${rootNodeID}`);
            }
        }
        let selectedNodes = this.breadthFirstSearchDepth(nodes, 2);
        let selectedProperties = [];
        for (const property of this.unfilteredData.properties) {
            if (selectedNodes.get(property.domain.id) && selectedNodes.get(property.range.id)) {
                selectedProperties.push(property);
            }
        }
        this.currentData = { nodes: Array.from(selectedNodes.values()), properties: selectedProperties };
        this.update(false, this.currentData);
        this.resetSearchHighlight();
        this.graph.highLightNodes(rootNodeID);
    }

    filterFunction(module, data, initializing) {
        if (initializing) {
            if (module.initialize) {
                module.initialize(data.nodes, data.properties);
            }
        }
        module.filter(data.nodes, data.properties);
        return {
            nodes: module.filteredNodes(),
            properties: module.filteredProperties()
        };
    }

    /**
     * Breadth First Search to a certain depth
     * @param {Array} rootNodes Begin search from these nodes
     * @param {integer} depth How many edges, starting from `rootNodes`, should be explored.
     * @returns {Map<string, object>} Nodes visited. A map of nodeIDs to nodes.
     */
    breadthFirstSearchDepth(rootNodes, depth) {
        let visited = new Map();
        let frontier = new Deque(rootNodes);

        // For every depth
        for (let i = 0; i < depth; i++) {
            // Keep static reference to the length
            let length = frontier.length;

            // For every node
            for (let j = 0; j < length; j++) {
                let currentNode = frontier.shift();
                let linkArr = currentNode.links;

                // For every edge
                for (let k = 0; k < linkArr.length; k++) {
                    let currentLink = linkArr[k];
                    let domainNode = currentLink.domain;
                    let rangeNode = currentLink.range;

                    // If the edge is connected to our current node, add the other end of the edge only if it hasn't already been visited or appended to our frontier
                    if (domainNode === currentNode) {
                        if (!visited.get(rangeNode.id)) {
                            frontier.push(rangeNode);
                        }
                    }
                    else if (rangeNode === currentNode) {
                        if (!visited.get(domainNode.id)) {
                            frontier.push(domainNode);
                        }
                    }
                }
                visited.set(currentNode.id, currentNode);
            }
        }
        return visited;
    }

    /** --------------------------------------------------------- **/
    /** -- force-layout related functions                      -- **/
    /** --------------------------------------------------------- **/
    storeLinksOnNodes(nodes, links) {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].links = [];
        }
        // look for properties where this node is the domain or range
        for (let i = 0; i < links.length; i++) {
            var link = links[i];
            var domainobj = link.domain;
            var existingDomainLinks = domainobj.links;
            if (existingDomainLinks === undefined) {
                existingDomainLinks = [link];
            } else {
                existingDomainLinks.push(link);
            }
            link.domain.links = existingDomainLinks;

            var rangeobj = link.range;
            var existingRangeLinks = rangeobj.links;
            if (existingRangeLinks === undefined) {
                existingRangeLinks = [link];
            } else {
                existingRangeLinks.push(link);
            }
            link.range.links = existingRangeLinks;
        }
    }

    setForceLayoutData(classNodes, labelNodes, links) {
        /**
         * @type {any[]}
         */
        var d3Links = [];
        links.forEach(function (link) {
            d3Links = d3Links.concat(link.linkParts());
        });

        var d3Nodes = [].concat(classNodes).concat(labelNodes);
        this.setPositionOfOldLabelsOnNewLabels(this.force.nodes(), labelNodes);

        this.force.nodes(d3Nodes)
            .links(d3Links);
    }

    // The label nodes are positioned randomly, because they are created from scratch if the data changes and lose
    // their position information. With this hack the position of old labels is copied to the new labels.
    setPositionOfOldLabelsOnNewLabels(oldLabelNodes, labelNodes) {
        labelNodes.forEach(function (labelNode) {
            for (var i = 0; i < oldLabelNodes.length; i++) {
                var oldNode = oldLabelNodes[i];
                if (oldNode.equals(labelNode)) {
                    labelNode.x = oldNode.x;
                    labelNode.y = oldNode.y;
                    labelNode.px = oldNode.px;
                    labelNode.py = oldNode.py;
                    break;
                }
            }
        });
    }

    // Applies all options that don't change the graph data.
    refreshGraphStyle() {
        const _this = this
        this.zoom = zoom.scaleExtent([this.options.minMagnification(), this.options.maxMagnification()]);
        if (this.graphContainer) {
            this.zoom.event(this.graphContainer);
        }

        this.force.charge(function (element) {
            var charge = _this.options.charge();
            if (ElementTools.isLabel(element)) {
                charge *= 0.8;
            }
            return charge;
        })
            .size([this.options.width, options.height])
            .linkDistance(this.calculateLinkPartDistance)
            .gravity(this.options.gravity())
            .linkStrength(this.options.linkStrength()); // Flexibility of links

        this.force.nodes().forEach(function (n) {
            n.frozen = _this.paused;
        });
    }

    calculateLinkPartDistance(this.linkPart) {
        var link = linkPart.link;

        if (link.isLoop()) {
            return this.options.loopDistance();
        }

        // divide by 2 to receive the length for a single link part
        var linkPartDistance = this.getVisibleLinkDistance(link) / 2;
        linkPartDistance += linkPart.domain.smallestRadius;
        linkPartDistance += linkPart.range.smallestRadius;
        return linkPartDistance;
    }

    getVisibleLinkDistance(link) {
        if (ElementTools.isDatatype(link.domain) || ElementTools.isDatatype(link.range)) {
            return this.options.datatypeDistance();
        } else {
            return this.options.classDistance();
        }
    }

    /** --------------------------------------------------------- **/
    /** -- animation functions for the nodes --                   **/
    /** --------------------------------------------------------- **/

    animateDynamicLabelWidth() {
        var wantedWidth = this.options.dynamicLabelWidth();
        var i;
        for (i = 0; i < this.classNodes.length; i++) {
            var nodeElement = this.classNodes[i];
            if (ElementTools.isDatatype(nodeElement)) {
                nodeElement.animateDynamicLabelWidth(wantedWidth);
            }
        }
        for (i = 0; i < this.properties.length; i++) {
            this.properties[i].animateDynamicLabelWidth(wantedWidth);
        }
    }


    /** --------------------------------------------------------- **/
    /** -- halo and localization functions --                     **/
    /** --------------------------------------------------------- **/
    updateHaloRadius() {
        if (this.pulseNodeIds && this.pulseNodeIds.length > 0) {
            var forceNodes = this.force.nodes();
            for (var i = 0; i < this.pulseNodeIds.length; i++) {
                var node = forceNodes[this.pulseNodeIds[i]];
                if (node) {
                    if (node.property) {
                        // match search strings with property label
                        if (node.property.inverse) {
                            var searchString = this.options.searchMenu().getSearchString().toLowerCase();
                            var name = node.property.labelForCurrentLanguage().toLowerCase();
                            if (name === searchString) this.computeDistanceToCenter(node);
                            else {
                                node.property.removeHalo();
                                if (node.property.inverse) {
                                    if (!node.property.inverse.haloGroupElement)
                                        node.property.inverse.drawHalo();
                                    this.computeDistanceToCenter(node, true);
                                }
                                if (node.property.equivalents) {
                                    var eq = node.property.equivalents;
                                    for (var e = 0; e < eq.length; e++) {
                                        if (!eq[e].haloGroupElement)
                                            eq[e].drawHalo();
                                    }
                                    if (!node.property.haloGroupElement)
                                        node.property.drawHalo();
                                    this.computeDistanceToCenter(node, false);

                                }
                            }
                        }
                    }
                    this.computeDistanceToCenter(node);
                }
            }
        }
    }

    getScreenCoords(x, y, translate, scale) {
        var xn = translate[0] + x * scale;
        var yn = translate[1] + y * scale;
        return { x: xn, y: yn };
    }

    getClickedScreenCoords(x, y, translate, scale) {
        var xn = (x - translate[0]) / scale;
        var yn = (y - translate[1]) / scale;
        return { x: xn, y: yn };
    }


    computeDistanceToCenter(node, inverse) {
        var container = node;
        var w = this.options.width();
        var h = this.options.height();
        var posXY = this.getScreenCoords(node.x, node.y, this.graphTranslation, this.zoomFactor);

        var highlightOfInv = false;

        if (inverse && inverse === true) {
            highlightOfInv = true;
            posXY = getScreenCoords(node.x, node.y + 20, this.graphTranslation, this.zoomFactor);
        }
        var x = posXY.x;
        var y = posXY.y;
        var nodeIsRect = false;
        var halo;
        var roundHalo;
        var rectHalo;
        var borderPoint_x = 0;
        var borderPoint_y = 0;
        var defaultRadius;
        var offset = 15;
        var radius;

        if (node.property && highlightOfInv === true) {
            if (node.property.inverse) {
                rectHalo = node.property.inverse.haloGroupElement.select("rect");

            } else {
                if (node.property.haloGroupElement)
                    rectHalo = node.property.haloGroupElement.select("rect");
                else {
                    node.property.drawHalo();
                    rectHalo = node.property.haloGroupElement.select("rect");
                }
            }
            rectHalo.classed("hidden", true);
            if (node.property.inverse) {
                if (node.property.inverse.haloGroupElement) {
                    roundHalo = node.property.inverse.haloGroupElement.select("circle");
                }
            } else {
                roundHalo = node.property.haloGroupElement.select("circle");
            }
            if (roundHalo.node() === null) {
                radius = node.property.inverse.labelWidth + 15;

                roundHalo = node.property.inverse.haloGroupElement.append("circle")
                    .classed("searchResultB", true)
                    .classed("searchResultA", false)
                    .attr("r", radius + 15);

            }
            halo = roundHalo; // swap the halo to be round
            nodeIsRect = true;
            container = node.property.inverse;
        }

        if (node.id) {
            if (!node.haloGroupElement) return; // something went wrong before
            halo = node.haloGroupElement.select("rect");
            if (halo.node() === null) {
                // this is a round node
                nodeIsRect = false;
                roundHalo = node.haloGroupElement.select("circle");
                defaultRadius = node.smallestRadius;
                roundHalo.attr("r", defaultRadius + offset);
                halo = roundHalo;
            } else { // this is a rect node
                nodeIsRect = true;
                rectHalo = node.haloGroupElement.select("rect");
                rectHalo.classed("hidden", true);
                roundHalo = node.haloGroupElement.select("circle");
                if (roundHalo.node() === null) {
                    radius = node.labelWidth;
                    roundHalo = node.haloGroupElement.append("circle")
                        .classed("searchResultB", true)
                        .classed("searchResultA", false)
                        .attr("r", radius + offset);
                }
                halo = roundHalo;
            }
        }
        if (node.property && !inverse) {
            if (!node.property.haloGroupElement) return; // something went wrong before
            rectHalo = node.property.haloGroupElement.select("rect");
            rectHalo.classed("hidden", true);

            roundHalo = node.property.haloGroupElement.select("circle");
            if (roundHalo.node() === null) {
                radius = node.property.width;

                roundHalo = node.property.haloGroupElement.append("circle")
                    .classed("searchResultB", true)
                    .classed("searchResultA", false)
                    .attr("r", radius + 15);

            }
            halo = roundHalo; // swap the halo to be round
            nodeIsRect = true;
            container = node.property;
        }

        if (x < 0 || x > w || y < 0 || y > h) {
            // node outside viewport;
            // check for quadrant and get the correct boarder point (intersection with viewport)
            if (x < 0 && y < 0) {
                borderPoint_x = 0;
                borderPoint_y = 0;
            } else if (x > 0 && x < w && y < 0) {
                borderPoint_x = x;
                borderPoint_y = 0;
            } else if (x > w && y < 0) {
                borderPoint_x = w;
                borderPoint_y = 0;
            } else if (x > w && y > 0 && y < h) {
                borderPoint_x = w;
                borderPoint_y = y;
            } else if (x > w && y > h) {
                borderPoint_x = w;
                borderPoint_y = h;
            } else if (x > 0 && x < w && y > h) {
                borderPoint_x = x;
                borderPoint_y = h;
            } else if (x < 0 && y > h) {
                borderPoint_x = 0;
                borderPoint_y = h;
            } else if (x < 0 && y > 0 && y < h) {
                borderPoint_x = 0;
                borderPoint_y = y;
            }
            // kill all pulses of nodes that are outside the viewport
            container.haloGroupElement.select("rect").classed("searchResultA", false);
            container.haloGroupElement.select("circle").classed("searchResultA", false);
            container.haloGroupElement.select("rect").classed("searchResultB", true);
            container.haloGroupElement.select("circle").classed("searchResultB", true);
            halo.classed("hidden", false);
            // compute in pixel coordinates length of difference vector
            var borderRadius_x = borderPoint_x - x;
            var borderRadius_y = borderPoint_y - y;

            var len = borderRadius_x * borderRadius_x + borderRadius_y * borderRadius_y;
            len = Math.sqrt(len);

            var normedX = borderRadius_x / len;
            var normedY = borderRadius_y / len;

            len = len + 20; // add 20 px;

            // re-normalized vector
            var newVectorX = normedX * len + x;
            var newVectorY = normedY * len + y;
            // compute world coordinates of this point
            var wX = (newVectorX - this.graphTranslation[0]) / this.zoomFactor;
            var wY = (newVectorY - this.graphTranslation[1]) / this.zoomFactor;

            // compute distance in world coordinates
            var dx = wX - node.x;
            var dy = wY - node.y;
            if (highlightOfInv === true)
                dy = wY - node.y - 20;

            if (highlightOfInv === false && node.property && node.property.inverse)
                dy = wY - node.y + 20;

            var newRadius = Math.sqrt(dx * dx + dy * dy);
            halo = container.haloGroupElement.select("circle");
            // sanity checks and setting new halo radius
            if (!nodeIsRect) {
                defaultRadius = node.smallestRadius + offset;
                if (newRadius < defaultRadius) {
                    newRadius = defaultRadius;
                }
                halo.attr("r", newRadius);
            } else {
                defaultRadius = 0.5 * container.width;
                if (newRadius < defaultRadius)
                    newRadius = defaultRadius;
                halo.attr("r", newRadius);
            }
        } else { // node is in viewport , render original;
            // reset the halo to original radius
            defaultRadius = node.smallestRadius + 15;
            if (!nodeIsRect) {
                halo.attr("r", defaultRadius);
            } else { // this is rectangular node render as such
                halo = container.haloGroupElement.select("rect");
                halo.classed("hidden", false);
                //halo.classed("searchResultB", true);
                //halo.classed("searchResultA", false);
                var aCircHalo = container.haloGroupElement.select("circle");
                aCircHalo.classed("hidden", true);

                container.haloGroupElement.select("rect").classed("hidden", false);
                container.haloGroupElement.select("circle").classed("hidden", true);
            }
        }
    }

    transform(p, cx, cy) {
        // one iteration step for the locate target animation
        this.zoomFactor = this.options.height() / p[2];
        this.graphTranslation = [(cx - p[0] * this.zoomFactor), (cy - p[1] * this.zoomFactor)];
        this.updateHaloRadius();
        // update the values in case the user wants to break the animation
        this.zoom.translate(this.graphTranslation);
        this.zoom.scale(this.zoomFactor);
        this.options.zoomSlider().updateZoomSliderValue(this.zoomFactor);
        return "translate(" + this.graphTranslation[0] + "," + this.graphTranslation[1] + ")scale(" + this.zoomFactor + ")";
    }

    zoomToElementInGraph(element) {
        this.targetLocationZoom(element);
    }
    updateHaloRadius(element) {
        this.computeDistanceToCenter(element);
    }

    targetLocationZoom(target) {
        const _this = this;

        // store the original information
        var cx = 0.5 * this.options.width();
        var cy = 0.5 * this.options.height();
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, this.zoomFactor);
        var sP = [cp.x, cp.y, this.options.height() / this.zoomFactor];

        var zoomLevel = Math.max(this.defaultZoom + 0.5 * this.defaultZoom, this.defaultTargetZoom);
        var eP = [target.x, target.y, this.options.height() / zoomLevel];
        var pos_intp = d3.interpolateZoom(sP, eP);

        var lenAnimation = pos_intp.duration;
        if (lenAnimation > 2500) {
            lenAnimation = 2500;
        }

        this.graphContainer.attr("transform", transform(sP, cx, cy))
            .transition()
            .duration(lenAnimation)
            .attrTween("transform", function () {
                return function (t) {
                    return transform(pos_intp(t), cx, cy);
                };
            })
            .each("end", function () {
                _this.graphContainer.attr("transform", "translate(" + _this.graphTranslation + ")scale(" + _this.zoomFactor + ")");
                _this.zoom.translate(_this.graphTranslation);
                _this.zoom.scale(_this.zoomFactor);
                _this.updateHaloRadius();
            });
    }

    getWorldPosFromScreen(x, y, translate, scale) {
        var temp = scale[0], xn, yn;
        if (temp) {
            xn = (x - translate[0]) / temp;
            yn = (y - translate[1]) / temp;
        } else {
            xn = (x - translate[0]) / scale;
            yn = (y - translate[1]) / scale;
        }
        return { x: xn, y: yn };
    }

    locateSearchResult() {
        if (this.pulseNodeIds && this.pulseNodeIds.length > 0) {
            // move the center of the viewport to this location
            if (this.transformAnimation === true) return; // << prevents incrementing the location id if we are in an animation
            var node = this.force.nodes()[this.pulseNodeIds[this.locationId]];
            this.locationId++;
            this.locationId = this.locationId % this.pulseNodeIds.length;
            if (node.id) node.foreground();
            if (node.property) node.property.foreground();

            targetLocationZoom(node);
        }
    }

    resetSearchHighlight() {
        // get all nodes (handle also already filtered nodes )
        this.pulseNodeIds = [];
        this.nodeArrayForPulse = [];
        // clear from stored nodes
        var nodes = this.unfilteredData.nodes;
        var props = this.unfilteredData.properties;
        var j;
        for (j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            if (node.removeHalo)
                node.removeHalo();
        }
        for (j = 0; j < props.length; j++) {
            var prop = props[j];
            if (prop.removeHalo)
                prop.removeHalo();
        }
    }

    updatePulseIds(nodeIdArray) {
        this.pulseNodeIds = [];
        for (var i = 0; i < nodeIdArray.length; i++) {
            var selectedId = nodeIdArray[i];
            var forceId = this.nodeMap[selectedId];
            if (forceId !== undefined) {
                var le_node = this.force.nodes()[forceId];
                if (le_node.id) {
                    if (this.pulseNodeIds.indexOf(forceId) === -1) {
                        this.pulseNodeIds.push(forceId);
                    }
                }
                if (le_node.property) {
                    if (pulseNodeIds.indexOf(forceId) === -1) {
                        pulseNodeIds.push(forceId);
                    }
                }
            }
        }
        locationId = 0;
        if (pulseNodeIds.length > 0) {
            d3.select("#locateSearchResult").classed("highlighted", true);
            d3.select("#locateSearchResult").node().title = "Locate search term";
        }
        else {
            d3.select("#locateSearchResult").classed("highlighted", false);
            d3.select("#locateSearchResult").node().title = "Nothing to locate";
        }
    }

    highLightNodes(nodeIdArray) {
        if (nodeIdArray.length === 0) {
            return; // nothing to highlight
        }
        this.pulseNodeIds = [];
        this.nodeArrayForPulse = nodeIdArray;
        var missedIds = [];

        // identify the force id to highlight
        for (var i = 0; i < nodeIdArray.length; i++) {
            var selectedId = nodeIdArray[i];
            var forceId = nodeMap[selectedId];
            if (forceId !== undefined) {
                var le_node = force.nodes()[forceId];
                if (le_node.id) {
                    if (pulseNodeIds.indexOf(forceId) === -1) {
                        pulseNodeIds.push(forceId);
                        le_node.foreground();
                        le_node.drawHalo();
                    }
                }
                if (le_node.property) {
                    if (pulseNodeIds.indexOf(forceId) === -1) {
                        pulseNodeIds.push(forceId);
                        le_node.property.foreground();
                        le_node.property.drawHalo();
                    }
                }
            }
            else {
                missedIds.push(selectedId);
            }
        }

        if (missedIds.length === nodeIdArray.length) {

        }
        // store the highlight on the missed nodes;
        var s_nodes = this.unfilteredData.nodes;
        var s_props = this.unfilteredData.properties;
        for (i = 0; i < missedIds.length; i++) {
            var missedId = missedIds[i];
            // search for this in the nodes;
            for (var n = 0; n < s_nodes.length; n++) {
                var nodeId = s_nodes[n].id;
                if (nodeId === missedId) {
                    s_nodes[n].drawHalo();
                }
            }
            for (var p = 0; p < s_props.length; p++) {
                var propId = s_props[p].id;
                if (propId === missedId) {
                    s_props[p].drawHalo();
                }
            }
        }
        if (missedIds.length === nodeIdArray.length) {
            d3.select("#locateSearchResult").classed("highlighted", false);
        }
        else {
            d3.select("#locateSearchResult").classed("highlighted", true);
        }
        this.locationId = 0;
        this.updateHaloRadius();
    }

    hideHalos() {
        var haloElements = d3.selectAll(".searchResultA,.searchResultB");
        haloElements.classed("hidden", true);
        return haloElements;
    }

    nodeInViewport(node, property) {

        var w = this.options.width();
        var h = this.options.height();
        var posXY = this.getScreenCoords(node.x, node.y, graphTranslation, zoomFactor);
        var x = posXY.x;
        var y = posXY.y;

        var retVal = !(x < 0 || x > w || y < 0 || y > h);
        return retVal;
    }

    getBoundingBoxForTex() {
        var halos = this.graph.hideHalos();
        var bbox = this.graphContainer.node().getBoundingClientRect();
        halos.classed("hidden", false);
        var w = this.options.width();
        var h = this.options.height();

        // get the graph coordinates
        var topLeft = this.getWorldPosFromScreen(0, 0, this.graphTranslation, this.zoomFactor);
        var botRight = this.getWorldPosFromScreen(w, h, this.graphTranslation, this.zoomFactor);


        var t_topLeft = this.getWorldPosFromScreen(bbox.left, bbox.top, this.graphTranslation, this.zoomFactor);
        var t_botRight = this.getWorldPosFromScreen(bbox.right, bbox.bottom, this.graphTranslation, this.zoomFactor);

        // tighten up the bounding box;

        var tX = Math.max(t_topLeft.x, topLeft.x);
        var tY = Math.max(t_topLeft.y, topLeft.y);

        var bX = Math.min(t_botRight.x, botRight.x);
        var bY = Math.min(t_botRight.y, botRight.y);


        // tighten further;
        var allForceNodes = this.force.nodes();
        var numNodes = allForceNodes.length;
        var visibleNodes = [];
        var bbx;


        var contentBBox = { tx: 1000000000000, ty: 1000000000000, bx: -1000000000000, by: -1000000000000 };

        for (var i = 0; i < numNodes; i++) {
            var node = allForceNodes[i];
            if (node) {
                if (node.property) {
                    if (this.nodeInViewport(node, true)) {
                        if (node.property.labelElement === undefined) continue;
                        bbx = node.property.labelElement.node().getBoundingClientRect();
                        if (bbx) {
                            contentBBox.tx = Math.min(contentBBox.tx, bbx.left);
                            contentBBox.bx = Math.max(contentBBox.bx, bbx.right);
                            contentBBox.ty = Math.min(contentBBox.ty, bbx.top);
                            contentBBox.by = Math.max(contentBBox.by, bbx.bottom);
                        }
                    }
                } else {
                    if (this.nodeInViewport(node, false)) {
                        bbx = node.nodeElement.node().getBoundingClientRect();
                        if (bbx) {
                            contentBBox.tx = Math.min(contentBBox.tx, bbx.left);
                            contentBBox.bx = Math.max(contentBBox.bx, bbx.right);
                            contentBBox.ty = Math.min(contentBBox.ty, bbx.top);
                            contentBBox.by = Math.max(contentBBox.by, bbx.bottom);
                        }
                    }
                }
            }
        }

        var tt_topLeft = this.getWorldPosFromScreen(contentBBox.tx, contentBBox.ty, graphTranslation, zoomFactor);
        var tt_botRight = this.getWorldPosFromScreen(contentBBox.bx, contentBBox.by, graphTranslation, zoomFactor);

        tX = Math.max(tX, tt_topLeft.x);
        tY = Math.max(tY, tt_topLeft.y);

        bX = Math.min(bX, tt_botRight.x);
        bY = Math.min(bY, tt_botRight.y);
        // y axis flip for tex
        return [tX, -tY, bX, -bY];

    }

    updateTargetElement() {
        var bbox = this.graphContainer.node().getBoundingClientRect();


        // get the graph coordinates
        var bboxOffset = 50; // default radius of a node;
        var topLeft = this.getWorldPosFromScreen(bbox.left, bbox.top, graphTranslation, zoomFactor);
        var botRight = this.getWorldPosFromScreen(bbox.right, bbox.bottom, graphTranslation, zoomFactor);

        var w = this.options.width();
        if (this.options.leftSidebar().visibleSidebar === true)
            w -= 200;
        var h = this.options.height();
        topLeft.x += bboxOffset;
        topLeft.y -= bboxOffset;
        botRight.x -= bboxOffset;
        botRight.y += bboxOffset;

        var g_w = botRight.x - topLeft.x;
        var g_h = botRight.y - topLeft.y;

        // endpoint position calculations
        var posX = 0.5 * (topLeft.x + botRight.x);
        var posY = 0.5 * (topLeft.y + botRight.y);
        var cx = 0.5 * w,
            cy = 0.5 * h;

        if (this.options.leftSidebar().visibleSidebar === true)
            cx += 200;
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, this.zoomFactor);

        // zoom factor calculations and fail safes;
        var newZoomFactor = 1.0; // fail save if graph and window are squares
        //get the smaller one
        var a = w / g_w;
        var b = h / g_h;
        if (a < b) newZoomFactor = a;
        else newZoomFactor = b;


        // fail saves
        if (newZoomFactor > this.zoom.scaleExtent()[1]) {
            newZoomFactor = this.zoom.scaleExtent()[1];
        }
        if (newZoomFactor < this.zoom.scaleExtent()[0]) {
            newZoomFactor = this.zoom.scaleExtent()[0];
        }

        // apply Zooming
        var sP = [cp.x, cp.y, h / this.zoomFactor];
        var eP = [posX, posY, h / newZoomFactor];


        var pos_intp = d3.interpolateZoom(sP, eP);
        return [pos_intp, cx, cy];

    }

    forceRelocationEvent(dynamic) {
        // we need to kill the halo to determine the bounding box;
        var halos = this.graph.hideHalos();
        var bbox = this.graphContainer.node().getBoundingClientRect();
        halos.classed("hidden", false);

        // get the graph coordinates
        var bboxOffset = 50; // default radius of a node;
        var topLeft = this.getWorldPosFromScreen(bbox.left, bbox.top, this.graphTranslation, this.zoomFactor);
        var botRight = this.getWorldPosFromScreen(bbox.right, bbox.bottom, this.graphTranslation, this.zoomFactor);

        var w = this.options.width();
        if (this.options.leftSidebar().visibleSidebar === true)
            w -= 200;
        var h = this.options.height();
        topLeft.x += bboxOffset;
        topLeft.y -= bboxOffset;
        botRight.x -= bboxOffset;
        botRight.y += bboxOffset;

        var g_w = botRight.x - topLeft.x;
        var g_h = botRight.y - topLeft.y;

        // endpoint position calculations
        var posX = 0.5 * (topLeft.x + botRight.x);
        var posY = 0.5 * (topLeft.y + botRight.y);
        var cx = 0.5 * w,
            cy = 0.5 * h;

        if (this.options.leftSidebar().visibleSidebar === true)
            cx += 200;
        var cp = this.getWorldPosFromScreen(cx, cy, this.graphTranslation, this.zoomFactor);

        // zoom factor calculations and fail safes;
        var newZoomFactor = 1.0; // fail save if graph and window are squares
        //get the smaller one
        var a = w / g_w;
        var b = h / g_h;
        if (a < b) newZoomFactor = a;
        else newZoomFactor = b;


        // fail saves
        if (newZoomFactor > this.zoom.scaleExtent()[1]) {
            newZoomFactor = this.zoom.scaleExtent()[1];
        }
        if (newZoomFactor < this.zoom.scaleExtent()[0]) {
            newZoomFactor = this.zoom.scaleExtent()[0];
        }

        // apply Zooming
        var sP = [cp.x, cp.y, h / this.zoomFactor];
        var eP = [posX, posY, h / newZoomFactor];


        var pos_intp = d3.interpolateZoom(sP, eP);
        var lenAnimation = pos_intp.duration;
        if (lenAnimation > 2500) {
            lenAnimation = 2500;
        }
        this.graphContainer.attr("transform", transform(sP, cx, cy))

            .transition()
            .duration(lenAnimation)
            .attrTween("transform", function () {
                return function (t) {
                    if (dynamic) {
                        var param = _this.updateTargetElement();
                        var nV = param[0](t);
                        return transform(nV, cx, cy);
                    }
                    return transform(pos_intp(t), cx, cy);
                };
            })
            .each("end", function () {
                if (dynamic) {
                    return;
                }

                this.graphContainer.attr("transform", "translate(" + this.graphTranslation + ")scale(" + this.zoomFactor + ")");
                this.zoom.translate(this.graphTranslation);
                this.zoom.scale(this.zoomFactor);
                this.options.zoomSlider().updateZoomSliderValue(this.zoomFactor);


            });
    }


    isADraggerActive() {
        if (this.classDragger.mouseButtonPressed === true ||
            this.domainDragger.mouseButtonPressed === true ||
            this.rangeDragger.mouseButtonPressed === true) {
            return true;
        }
        return false;
    }

    /** --------------------------------------------------------- **/
    /** -- VOWL EDITOR  create/ edit /delete functions --         **/
    /** --------------------------------------------------------- **/

    changeNodeType(element) {
        var typeString = d3.select("#typeEditor").node().value;

        if (graph.classesSanityCheck(element, typeString) === false) {
            // call reselection to restore previous type selection
            this.options.editSidebar().updateSelectionInformation(element);
            return;
        }

        var prototype = this.NodePrototypeMap.get(typeString.toLowerCase());
        var aNode = new prototype(this);
        aNode.x = element.x;
        aNode.y = element.y;
        aNode.px = element.x;
        aNode.py = element.y;
        aNode.id = element.id;
        aNode.copyInformation(element);

        if (typeString === "owl:Thing") {
            aNode.label = "Thing";
        }
        else if (ElementTools.isDatatype(element) === false) {
            if (element.backupLabel !== undefined) {
                aNode.label = element.backupLabel;
            } else if (aNode.backupLabel !== undefined) {
                aNode.label = aNode.backupLabel;
            } else {
                aNode.label = "NewClass";
            }
        }

        if (typeString === "rdfs:Datatype") {
            if (aNode.dType === "undefined")
                aNode.label = "undefined";
            else {
                var identifier = aNode.dType.split(":")[1];
                aNode.label = identifier;
            }
        }
        var i;
        // updates the property domain and range
        for (i = 0; i < this.unfilteredData.properties.length; i++) {
            if (this.unfilteredData.properties[i].domain === element) {
                this.unfilteredData.properties[i].domain = aNode;
            }
            if (this.unfilteredData.properties[i].range === element) {
                this.unfilteredData.properties[i].range = aNode;
            }
        }

        // update for fastUpdate:
        for (i = 0; i < this.properties.length; i++) {
            if (this.properties[i].domain === element) {
                this.properties[i].domain = aNode;
            }
            if (this.properties[i].range === element) {
                this.properties[i].range = aNode;
            }
        }

        var remId = this.unfilteredData.nodes.indexOf(element);
        if (remId !== -1)
            this.unfilteredData.nodes.splice(remId, 1);
        remId = this.classNodes.indexOf(element);
        if (remId !== -1)
            this.classNodes.splice(remId, 1);
        // very important thing for selection!;
        this.addNewNodeElement(aNode);
        // handle focuser!
        this.options.focuserModule().handle(aNode);
        this.generateDictionary(this.unfilteredData);
        this.graph.getUpdateDictionary();
        element = null;
    }


    changePropertyType(element) {
        var typeString = d3.select("#typeEditor").node().value;

        // create warning
        if (graph.sanityCheckProperty(element.domain, element.range, typeString) === false) {
            return false;
        }

        var propPrototype = PropertyPrototypeMap.get(typeString.toLowerCase());
        var aProp = new propPrototype(graph);
        aProp.copyInformation(element);
        aProp.id = element.id;

        element.domain.removePropertyElement(element);
        element.range.removePropertyElement(element);
        aProp.domain = element.domain;
        aProp.range = element.range;

        if (element.backupLabel !== undefined) {
            aProp.label = element.backupLabel;
        } else {
            aProp.label = "newObjectProperty";
        }

        if (aProp.type === "rdfs:subClassOf") {
            aProp.iri = "http://www.w3.org/2000/01/rdf-schema#subClassOf";
        } else {
            if (element.iri === "http://www.w3.org/2000/01/rdf-schema#subClassOf") {
                aProp.iri = this.options.getGeneralMetaObjectProperty('iri') + aProp.id;
            }
        }

        if (this.propertyCheckExistenceChecker(aProp, element.domain, element.range) === false) {
            this.options.editSidebar().updateSelectionInformation(element);
            return;
        }
        // // TODO: change its base IRI to proper value
        // var ontoIRI="http://someTest.de";
        // aProp.baseIri=ontoIRI;
        // aProp.iri=aProp.baseIri+aProp.id;


        // add this to the data;
        unfilteredData.properties.push(aProp);
        if (properties.indexOf(aProp) === -1)
            properties.push(aProp);
        var remId = unfilteredData.properties.indexOf(element);
        if (remId !== -1)
            unfilteredData.properties.splice(remId, 1);
        if (properties.indexOf(aProp) === -1)
            properties.push(aProp);
        remId = properties.indexOf(element);
        if (remId !== -1)
            properties.splice(remId, 1);
        graph.fastUpdate();
        aProp.domain.addProperty(aProp);
        aProp.range.addProperty(aProp);
        if (element.labelObject && aProp.labelObject) {
            aProp.labelObject.x = element.labelObject.x;
            aProp.labelObject.px = element.labelObject.px;
            aProp.labelObject.y = element.labelObject.y;
            aProp.labelObject.py = element.labelObject.py;
        }

        options.focuserModule().handle(aProp);
        element = null;
    }

    removeEditElements() {
        // just added to be called form outside
        removeEditElements();
    }

    removeEditElements() {
        rangeDragger.hideDragger(true);
        domainDragger.hideDragger(true);
        shadowClone.hideClone(true);

        classDragger.hideDragger(true);
        if (addDataPropertyGroupElement)
            addDataPropertyGroupElement.classed("hidden", true);
        if (deleteGroupElement)
            deleteGroupElement.classed("hidden", true);

        if (hoveredNodeElement) {
            if (hoveredNodeElement.pinned === false) {
                hoveredNodeElement.locked = graph.paused();
                hoveredNodeElement.frozen = graph.paused();
            }
        }
        if (hoveredPropertyElement) {
            if (hoveredPropertyElement.pinned === false) {
                hoveredPropertyElement.locked = graph.paused();
                hoveredPropertyElement.frozen = graph.paused();
            }
        }
    }

    editorMode(val) {
        var create_entry = d3.select("#empty");
        var create_container = d3.select("#emptyContainer");
        var modeOfOpString = d3.select("#modeOfOperationString").node();

        if (!arguments.length) {
            create_entry.node().checked = editMode;
            if (editMode === false) {
                create_container.node().title = "Enable editing in modes menu to create a new ontology";
                create_entry.node().title = "Enable editing in modes menu to create a new ontology";
                create_entry.style("pointer-events", "none");
            } else {
                create_container.node().title = "Creates a new empty ontology";
                create_entry.node().title = "Creates a new empty ontology";
                d3.select("#useAccuracyHelper").style("color", "#2980b9");
                d3.select("#useAccuracyHelper").style("pointer-events", "auto");
                create_entry.node().disabled = false;
                create_entry.style("pointer-events", "auto");
            }

            return editMode;
        }
        this.options.setEditorModeForDefaultObject(val);

        // if (seenEditorHint===false  && val===true){
        //     seenEditorHint=true;
        //     this.options.warningModule().showEditorHint();
        // }
        editMode = val;

        if (create_entry) {
            create_entry.classed("disabled", !editMode);
            if (!editMode) {
                create_container.node().title = "Enable editing in modes menu to create a new ontology";
                create_entry.node().title = "Enable editing in modes menu to create a new ontology";
                create_entry.node().disabled = true;
                d3.select("#useAccuracyHelper").style("color", "#979797");
                d3.select("#useAccuracyHelper").style("pointer-events", "none");
                create_entry.style("pointer-events", "none");
            } else {
                create_container.node().title = "Creates a new empty ontology";
                create_entry.node().title = "Creates a new empty ontology";
                d3.select("#useAccuracyHelper").style("color", "#2980b9");
                d3.select("#useAccuracyHelper").style("pointer-events", "auto");
                create_entry.style("pointer-events", "auto");
            }
        }

        // adjust compact notation
        // selector = compactNotationOption;
        // box =ModuleCheckbox
        var compactNotationContainer = d3.select("#compactnotationModuleCheckbox");
        if (compactNotationContainer) {
            compactNotationContainer.classed("disabled", !editMode);
            if (!editMode) {
                compactNotationContainer.node().title = "";
                compactNotationContainer.node().disabled = false;
                compactNotationContainer.style("pointer-events", "auto");
                d3.select("#compactNotationOption").style("color", "");
                d3.select("#compactNotationOption").node().title = "";
                options.literalFilter().enabled = true;
                graph.update();
            } else {
                // if editor Mode
                //1) uncheck the element
                d3.select("#compactNotationOption").node().title = "Compact notation can only be used in view mode";
                compactNotationContainer.node().disabled = true;
                compactNotationContainer.node().checked = false;
                options.compactNotationModule().enabled = false;
                options.literalFilter().enabled = false;
                graph.executeCompactNotationModule();
                graph.executeEmptyLiteralFilter();
                graph.lazyRefresh();
                compactNotationContainer.style("pointer-events", "none");
                d3.select("#compactNotationOption").style("color", "#979797");
            }
        }

        if (modeOfOpString) {
            if (touchDevice === true) {
                modeOfOpString.innerHTML = "touch able device detected";
            } else {
                modeOfOpString.innerHTML = "point & click device detected";
            }
        }
        var svgGraph = d3.selectAll(".vowlGraph");

        if (editMode === true) {
            options.leftSidebar().showSidebar(options.leftSidebar().getSidebarVisibility(), true);
            options.leftSidebar().hideCollapseButton(false);
            this.options.editSidebar().updatePrefixUi();
            this.options.editSidebar().updateElementWidth();
            svgGraph.on("dblclick.zoom", this.modified_dblClickFunction);

        } else {
            svgGraph.on("dblclick.zoom", originalD3_dblClickFunction);
            options.leftSidebar().showSidebar(0);
            options.leftSidebar().hideCollapseButton(true);
            // hide hovered edit elements
            removeEditElements();
        }
        options.sidebar().updateShowedInformation();
        options.editSidebar().updateElementWidth();

    }

    createLowerCasePrototypeMap(prototypeMap) {
        return d3.map(prototypeMap.values(), function (Prototype) { // FIXME: Check Map docs
            return new Prototype().type.toLowerCase();
        });
    }

    createNewNodeAtPosition(pos) {
        var aNode, prototype;
        var forceUpdate = true;
        // create a node of that id;

        var typeToCreate = d3.select("#defaultClass").node().title;
        prototype = NodePrototypeMap.get(typeToCreate.toLowerCase());
        aNode = new prototype(graph);
        var autoEditElement = false;
        if (typeToCreate === "owl:Thing") {
            aNode.label = "Thing";
        }
        else {
            aNode.label = "NewClass";
            autoEditElement = true;
        }
        aNode.x = pos.x;
        aNode.y = pos.y;
        aNode.px = aNode.x;
        aNode.py = aNode.y;
        aNode.id = "Class" + eN++;
        // aNode.paused(true);

        aNode.baseIri = d3.select("#iriEditor").node().value;
        aNode.iri = aNode.baseIri + aNode.id;
        addNewNodeElement(aNode, forceUpdate);
        options.focuserModule().handle(aNode, true);
        aNode.frozen = graph.paused();
        aNode.locked = graph.paused();
        aNode.enableEditing(autoEditElement);
    }

    addNewNodeElement(element) {
        unfilteredData.nodes.push(element);
        if (classNodes.indexOf(element) === -1)
            classNodes.push(element);

        generateDictionary(unfilteredData);
        graph.getUpdateDictionary();
        graph.fastUpdate();
    }

    getTargetNode(position) {
        var dx = position[0];
        var dy = position[1];
        var tN = null;
        var minDist = 1000000000000;
        // This is a bit OVERKILL for the computation of one node >> TODO: KD-TREE SEARCH
        unfilteredData.nodes.forEach(function (el) {
            var cDist = Math.sqrt((el.x - dx) * (el.x - dx) + (el.y - dy) * (el.y - dy));
            if (cDist < minDist) {
                minDist = cDist;
                tN = el;
            }
        });
        if (hoveredNodeElement) {
            var offsetDist = hoveredNodeElement.smallestRadius + 30;
            if (minDist > offsetDist) return null;
            if (tN.renderType === "rect") return null;
            if (tN === hoveredNodeElement && minDist <= hoveredNodeElement.smallestRadius) {
                return tN;
            } else if (tN === hoveredNodeElement && minDist > hoveredNodeElement.smallestRadius) {
                return null;
            }
            return tN;
        }
        else {

            if (minDist > (tN.smallestRadius + 30))
                return null;
            else return tN;

        }
    }

    genericPropertySanityCheck(domain, range, typeString, header, action) {
        if (domain === range && typeString === "rdfs:subClassOf") {
            this.options.warningModule().showWarning(
                header,
                "rdfs:subClassOf can not be created as loops (domain == range)",
                action,
                1,
                domain
            );
            return false;
        }
        if (domain === range && typeString === "owl:disjointWith") {
            this.options.warningModule().showWarning(
                header,
                "owl:disjointWith  can not be created as loops (domain == range)",
                action,
                1,
                domain
            );
            return false;
        }
        // allProps[i].type==="owl:allValuesFrom"  ||
        // allProps[i].type==="owl:someValuesFrom"
        if (domain.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule().showWarning(
                header,
                "owl:allValuesFrom can not originate from owl:Thing",
                action,
                1,
                domain
            );
            return false;
        }
        if (domain.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule().showWarning(
                header,
                "owl:someValuesFrom can not originate from owl:Thing",
                action,
                1,
                domain
            );
            return false;
        }

        if (range.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule().showWarning(
                header,
                "owl:allValuesFrom can not be connected to owl:Thing",
                action,
                1,
                range
            );
            return false;
        }
        if (range.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule().showWarning(
                header,
                "owl:someValuesFrom can not be connected to owl:Thing",
                action,
                1,
                range
            );
            return false;
        }
        return true; // we can Change the domain or range
    }

    checkIfIriClassAlreadyExist(url) {
        // search for a class node with this url
        var allNodes = unfilteredData.nodes;
        for (var i = 0; i < allNodes.length; i++) {
            if (ElementTools.isDatatype(allNodes[i]) === true || allNodes[i].type === "owl:Thing")
                continue;

            // now we are a real class;
            //get class IRI
            var classIRI = allNodes[i].iri;

            // this gives me the node for halo
            if (url === classIRI) {
                return allNodes[i];
            }
        }
        return false;
    }

    classesSanityCheck(classElement, targetType) {
        // this is added due to someValuesFrom properties
        // we should not be able to change a classElement to a owl:Thing
        // when it has a property attached to it that uses these restrictions
        //

        if (targetType === "owl:Class") return true;

        else {
            // collect all properties which have that one as a domain or range
            var allProps = unfilteredData.properties;
            for (var i = 0; i < allProps.length; i++) {
                if (allProps[i].range === classElement || allProps[i].domain === classElement) {
                    // check for the type of that property
                    if (allProps[i].type === "owl:someValuesFrom") {
                        this.options.warningModule().showWarning(
                            "Can not change class type",
                            "The element has a property that is of type owl:someValuesFrom",
                            "Element type not changed!",
                            1,
                            classElement
                        );
                        return false;
                    }
                    if (allProps[i].type === "owl:allValuesFrom") {
                        this.options.warningModule().showWarning(
                            "Can not change class type",
                            "The element has a property that is of type owl:allValuesFrom",
                            "Element type not changed!",
                            1,
                            classElement
                        );
                        return false;
                    }
                }
            }
        }
        return true;
    }

    propertyCheckExistenceChecker(property, domain, range) {
        var allProps = unfilteredData.properties;
        var i;
        if (property.type === "rdfs:subClassOf" || property.type === "owl:disjointWith") {

            for (i = 0; i < allProps.length; i++) {
                if (allProps[i] === property) continue;
                if (allProps[i].domain === domain && allProps[i].range === range && allProps[i].type === property.type) {
                    this.options.warningModule().showWarning(
                        "Warning",
                        "This triple already exist!",
                        "Element not created!",
                        1,
                        undefined
                    );
                    return false;
                }
                if (allProps[i].domain === range && allProps[i].range === domain && allProps[i].type === property.type) {
                    this.options.warningModule().showWarning(
                        "Warning",
                        "Inverse assignment already exist! ",
                        "Element not created!",
                        1,
                        undefined
                    );
                    return false;
                }
            }
            return true;
        }
        return true;
    }

    // graph.checkForTripleDuplicate=function(property){
    //     var domain=property.domain;
    //     var range=property.range;
    //     console.log("checking for duplicates");
    //     var b1= domain.isPropertyAssignedToThisElement(property);
    //     var b2= range.isPropertyAssignedToThisElement(property);

    //     console.log("test domain results in "+ b1);
    //     console.log("test range results in "+ b1);

    //     if (b1  && b2 ){
    //         this.options.warningModule().showWarning(
    //             "Warning",
    //             "This triple already exist!",
    //             "Element not created!",
    //             1,
    //             undefined
    //         );
    //         return false;
    //     }
    //     return true;
    // }

    sanityCheckProperty(domain, range, typeString) {
        // check for duplicate triple in the element;
        if (typeString === "owl:objectProperty" && this.options.objectPropertyFilter().enabled === true) {
            this.options.warningModule().showWarning(
                "Warning",
                "Object properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined
            );
            return false;
        }

        if (typeString === "owl:disjointWith" && this.options.disjointPropertyFilter().enabled === true) {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:disjointWith properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined
            );
            return false;
        }


        if (domain === range && typeString === "rdfs:subClassOf") {
            this.options.warningModule().showWarning(
                "Warning",
                "rdfs:subClassOf can not be created as loops (domain == range)",
                "Element not created!",
                1,
                domain
            );
            return false;
        }
        if (domain === range && typeString === "owl:disjointWith") {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:disjointWith  can not be created as loops (domain == range)",
                "Element not created!",
                1,
                domain
            );
            return false;
        }

        if (domain.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:someValuesFrom can not originate from owl:Thing",
                "Element not created!",
                1,
                domain
            );
            return false;
        }
        if (domain.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:allValuesFrom can not originate from owl:Thing",
                "Element not created!",
                1,
                domain
            );
            return false;
        }

        if (range.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:allValuesFrom can not be connected to owl:Thing",
                "Element not created!",
                1,
                range
            );
            return false;
        }
        if (range.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule().showWarning(
                "Warning",
                "owl:someValuesFrom can not be connected to owl:Thing",
                "Element not created!",
                1,
                range
            );
            return false;
        }
        return true; // we can create a property
    }

    createNewObjectProperty(domain, range, draggerEndposition) {
        // check type of the property that we want to create;
        var defaultPropertyName = d3.select("#defaultProperty").node().title;

        // check if we are allow to create that property
        if (graph.sanityCheckProperty(domain, range, defaultPropertyName) === false) {
            return false;
        }

        var propPrototype = PropertyPrototypeMap.get(defaultPropertyName.toLowerCase());
        var aProp = new propPrototype(graph);
        aProp.id = "objectProperty" + eP++;
        aProp.domain = domain;
        aProp.range = range;
        aProp.label = "newObjectProperty";
        aProp.baseIri = d3.select("#iriEditor").node().value;
        aProp.iri = aProp.baseIri + aProp.id;

        // check for duplicate;
        if (graph.propertyCheckExistenceChecker(aProp, domain, range) === false) {
            // delete aProp;
            // hope for garbage collection here -.-
            return false;
        }

        var autoEditElement = false;
        if (defaultPropertyName === "owl:objectProperty") {
            autoEditElement = true;
        }
        var pX = 0.49 * (domain.x + range.x);
        var pY = 0.49 * (domain.y + range.y);

        if (domain === range) {
            // we use the dragger endposition to determine an angle to put the loop there;
            var dirD_x = draggerEndposition[0] - domain.x;
            var dirD_y = draggerEndposition[1] - domain.y;

            // normalize;
            var len = Math.sqrt(dirD_x * dirD_x + dirD_y * dirD_y);
            // it should be very hard to set the position on the same sport but why not handling this
            var nx = dirD_x / len;
            var ny = dirD_y / len;
            // is Nan in javascript like in c len==len returns false when it is not a number?
            if (isNaN(len)) {
                nx = 0;
                ny = -1;
            }

            // get domain actual raidus
            var offset = 2 * domain.smallestRadius + 50;
            pX = domain.x + offset * nx;
            pY = domain.y + offset * ny;
        }

        // add this property to domain and range;
        domain.addProperty(aProp);
        range.addProperty(aProp);

        // add this to the data;
        unfilteredData.properties.push(aProp);
        if (properties.indexOf(aProp) === -1)
            properties.push(aProp);
        graph.fastUpdate();
        aProp.labelObject.x = pX;
        aProp.labelObject.px = pX;
        aProp.labelObject.y = pY;
        aProp.labelObject.py = pY;

        aProp.frozen = graph.paused();
        aProp.locked = graph.paused();
        domain.frozen = graph.paused();
        domain.locked = graph.paused();
        range.frozen = graph.paused();
        range.locked = graph.paused();

        generateDictionary(unfilteredData);
        graph.getUpdateDictionary();

        options.focuserModule().handle(aProp);
        graph.activateHoverElementsForProperties(true, aProp, false, touchDevice);
        aProp.labelObject.increasedLoopAngle = true;
        aProp.enableEditing(autoEditElement);
    }

    createDataTypeProperty(node) {
        // random postion issues;
        clearTimeout(nodeFreezer);
        // tells user when element is filtered out
        if (this.options.datatypeFilter().enabled === true) {
            this.options.warningModule().showWarning(
                "Warning",
                "Datatype properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined
            );
            return;
        }


        var aNode, prototype;

        // create a default datatype Node >> HERE LITERAL;
        var defaultDatatypeName = d3.select("#defaultDatatype").node().title;
        if (defaultDatatypeName === "rdfs:Literal") {
            prototype = NodePrototypeMap.get("rdfs:literal");
            aNode = new prototype(graph);
            aNode.label = "Literal";
            aNode.iri = "http://www.w3.org/2000/01/rdf-schema#Literal";
            aNode.baseIri = "http://www.w3.org/2000/01/rdf-schema#";
        } else {
            prototype = NodePrototypeMap.get("rdfs:datatype");
            aNode = new prototype(graph);
            var identifier = "";
            if (defaultDatatypeName === "undefined") {
                identifier = "undefined";
                aNode.label = identifier;
                // TODO : HANDLER FOR UNDEFINED DATATYPES!!<<<>>>>>>>>>>>..
                aNode.iri = "http://www.undefinedDatatype.org/#" + identifier;
                aNode.baseIri = "http://www.undefinedDatatype.org/#";
                aNode.dType = defaultDatatypeName;
            } else {
                identifier = defaultDatatypeName.split(":")[1];
                aNode.label = identifier;
                aNode.dType = defaultDatatypeName;
                aNode.iri = "http://www.w3.org/2001/XMLSchema#" + identifier;
                aNode.baseIri = "http://www.w3.org/2001/XMLSchema#";
            }
        }

        var nX = node.x - node.smallestRadius - 100;
        var nY = node.y + node.smallestRadius + 100;
        aNode.x = nX;
        aNode.y = nY;
        aNode.px = aNode.x;
        aNode.py = aNode.y;
        aNode.id = "NodeId" + eN++;
        // add this property to the nodes;
        unfilteredData.nodes.push(aNode);
        if (classNodes.indexOf(aNode) === -1)
            classNodes.push(aNode);

        // add also the datatype Property to it
        var propPrototype = PropertyPrototypeMap.get("owl:datatypeproperty");
        var aProp = new propPrototype(graph);
        aProp.id = "datatypeProperty" + eP++;

        // create the connection
        aProp.domain = node;
        aProp.range = aNode;
        aProp.label = "newDatatypeProperty";

        // TODO: change its base IRI to proper value
        var ontoIri = d3.select("#iriEditor").node().value;
        aProp.baseIri = ontoIri;
        aProp.iri = ontoIri + aProp.id;
        // add this to the data;
        unfilteredData.properties.push(aProp);
        if (properties.indexOf(aProp) === -1)
            properties.push(aProp);
        graph.fastUpdate();
        generateDictionary(unfilteredData);
        graph.getUpdateDictionary();

        nodeFreezer = setTimeout(function () {
            if (node && node.frozen === true && node.pinned === false && graph.paused() === false) {
                node.frozen = graph.paused();
                node.locked = graph.paused();
            }
        }, 1000);
        options.focuserModule().handle(undefined);
        if (node) {
            node.frozen = true;
            node.locked = true;
        }
    }

    removeNodesViaResponse(nodesToRemove, propsToRemove) {
        var i, remId;
        // splice them;
        for (i = 0; i < propsToRemove.length; i++) {
            remId = unfilteredData.properties.indexOf(propsToRemove[i]);
            if (remId !== -1)
                unfilteredData.properties.splice(remId, 1);
            remId = properties.indexOf(propsToRemove[i]);
            if (remId !== -1)
                properties.splice(remId, 1);
            propsToRemove[i] = null;
        }
        for (i = 0; i < nodesToRemove.length; i++) {
            remId = unfilteredData.nodes.indexOf(nodesToRemove[i]);
            if (remId !== -1) {
                unfilteredData.nodes.splice(remId, 1);
            }
            remId = classNodes.indexOf(nodesToRemove[i]);
            if (remId !== -1)
                classNodes.splice(remId, 1);
            nodesToRemove[i] = null;
        }
        graph.fastUpdate();
        generateDictionary(unfilteredData);
        graph.getUpdateDictionary();
        options.focuserModule().handle(undefined);
        nodesToRemove = null;
        propsToRemove = null;

    }

    removeNodeViaEditor(node) {
        var propsToRemove = [];
        var nodesToRemove = [];
        var datatypes = 0;

        var remId;

        nodesToRemove.push(node);
        for (var i = 0; i < unfilteredData.properties.length; i++) {
            if (unfilteredData.properties[i].domain === node || unfilteredData.properties[i].range === node) {
                propsToRemove.push(unfilteredData.properties[i]);
                if (unfilteredData.properties[i].type.toLocaleLowerCase() === "owl:datatypeproperty" &&
                    unfilteredData.properties[i].range !== node) {
                    nodesToRemove.push(unfilteredData.properties[i].range);
                    datatypes++;
                }
            }
        }
        var removedItems = propsToRemove.length + nodesToRemove.length;
        if (removedItems > 2) {
            var text = "You are about to delete 1 class and " + propsToRemove.length + " properties";
            if (datatypes !== 0) {
                text = "You are about to delete 1 class, " + datatypes + " datatypes  and " + propsToRemove.length + " properties";
            }


            this.options.warningModule().responseWarning(
                "Removing elements",
                text,
                "Awaiting response!",
                graph.removeNodesViaResponse,
                [nodesToRemove, propsToRemove]
            );


            //
            // if (confirm("Remove :\n"+propsToRemove.length + " properties\n"+nodesToRemove.length+" classes? ")===false){
            //     return;
            // }else{
            //     // todo : store for undo delete button ;
            // }
        } else {
            // splice them;
            for (i = 0; i < propsToRemove.length; i++) {
                remId = unfilteredData.properties.indexOf(propsToRemove[i]);
                if (remId !== -1)
                    unfilteredData.properties.splice(remId, 1);
                remId = properties.indexOf(propsToRemove[i]);
                if (remId !== -1)
                    properties.splice(remId, 1);
                propsToRemove[i] = null;
            }
            for (i = 0; i < nodesToRemove.length; i++) {
                remId = unfilteredData.nodes.indexOf(nodesToRemove[i]);
                if (remId !== -1)
                    unfilteredData.nodes.splice(remId, 1);
                remId = classNodes.indexOf(nodesToRemove[i]);
                if (remId !== -1)
                    classNodes.splice(remId, 1);
                nodesToRemove[i] = null;
            }
            graph.fastUpdate();
            generateDictionary(unfilteredData);
            graph.getUpdateDictionary();
            options.focuserModule().handle(undefined);
            nodesToRemove = null;
            propsToRemove = null;
        }
    }

    removePropertyViaEditor(property) {
        property.domain.removePropertyElement(property);
        property.range.removePropertyElement(property);
        var remId;

        if (property.type.toLocaleLowerCase() === "owl:datatypeproperty") {
            var datatype = property.range;
            remId = unfilteredData.nodes.indexOf(property.range);
            if (remId !== -1)
                unfilteredData.nodes.splice(remId, 1);
            remId = classNodes.indexOf(property.range);
            if (remId !== -1)
                classNodes.splice(remId, 1);
            datatype = null;
        }
        remId = unfilteredData.properties.indexOf(property);
        if (remId !== -1)
            unfilteredData.properties.splice(remId, 1);
        remId = properties.indexOf(property);
        if (remId !== -1)
            properties.splice(remId, 1);
        if (property.inverse) {
            // so we have inverse
            property.inverse.inverse = 0;
        }
        hoveredPropertyElement = undefined;
        graph.fastUpdate();
        generateDictionary(unfilteredData);
        graph.getUpdateDictionary();
        options.focuserModule().handle(undefined);
        property = null;
    }

    executeColorExternalsModule() {
        options.colorExternalsModule().filter(unfilteredData.nodes, unfilteredData.properties);
    }

    executeCompactNotationModule() {
        if (unfilteredData) {
            options.compactNotationModule().filter(unfilteredData.nodes, unfilteredData.properties);
        }
    }

    executeEmptyLiteralFilter() {
        if (unfilteredData && unfilteredData.nodes.length > 1) {
            options.literalFilter().filter(unfilteredData.nodes, unfilteredData.properties);
            unfilteredData.nodes = options.literalFilter().filteredNodes();
            unfilteredData.properties = options.literalFilter().filteredProperties();
        }
    }

    /** --------------------------------------------------------- **/
    /** -- Touch behaviour functions --                   **/
    /** --------------------------------------------------------- **/

    setTouchDevice(val) {
        touchDevice = val;
    }

    isTouchDevice = function () {
        return touchDevice;
    }

    modified_dblClickFunction() {

        d3.event.stopPropagation();
        d3.event.preventDefault();
        // get position where we want to add the node;
        var grPos = getClickedScreenCoords(d3.event.clientX, d3.event.clientY, graph.translation(), graph.scaleFactor());
        createNewNodeAtPosition(grPos);
    }

    doubletap() {
        var touch_time = d3.event.timeStamp;
        var numTouchers = 1;
        if (d3.event && d3.event.touches && d3.event.touches.length)
            numTouchers = d3.event.touches.length;

        if (touch_time - last_touch_time < 300 && numTouchers === 1) {
            d3.event.stopPropagation();
            if (editMode === true) {
                //graph.modified_dblClickFunction();
                d3.event.preventDefault();
                d3.event.stopPropagation();
                last_touch_time = touch_time;
                return true;
            }
        }
        last_touch_time = touch_time;
        return false;
    }


    touchzoomed() {
        forceNotZooming = true;


        var touch_time = d3.event.timeStamp;
        if (touch_time - last_touch_time < 300 && d3.event.touches.length === 1) {
            d3.event.stopPropagation();

            if (editMode === true) {
                //graph.modified_dblClickFunction();
                d3.event.preventDefault();
                d3.event.stopPropagation();
                zoom.translate(graphTranslation);
                zoom.scale(zoomFactor);
                graph.modified_dblTouchFunction();
            }
            else {
                forceNotZooming = false;
                if (originalD3_touchZoomFunction)
                    originalD3_touchZoomFunction();
            }
            return;
        }
        forceNotZooming = false;
        last_touch_time = touch_time;
        // TODO: WORK AROUND TO CHECK FOR ORIGINAL FUNCTION
        if (originalD3_touchZoomFunction)
            originalD3_touchZoomFunction();
    }

    modified_dblTouchFunction(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        var xy;
        if (editMode === true) {
            xy = d3.touches(d3.selectAll(".vowlGraph").node());
        }
        var grPos = getClickedScreenCoords(xy[0][0], xy[0][1], graph.translation(), graph.scaleFactor());
        createNewNodeAtPosition(grPos);
    }

    /** --------------------------------------------------------- **/
    /** -- Hover and Selection functions, adding edit elements --  **/
    /** --------------------------------------------------------- **/

    ignoreOtherHoverEvents = function (val) {
        if (!arguments.length) {
            return ignoreOtherHoverEvents;
        }
        else ignoreOtherHoverEvents = val;
    }

    delayedHiddingHoverElements(tbh) {
        if (tbh === true) return;
        if (hoveredNodeElement) {
            if (hoveredNodeElement.editingTextElement === true) return;
            delayedHider = setTimeout(function () {
                deleteGroupElement.classed("hidden", true);
                addDataPropertyGroupElement.classed("hidden", true);
                classDragger.hideDragger(true);
                if (hoveredNodeElement && hoveredNodeElement.pinned === false && graph.paused() === false && hoveredNodeElement.editingTextElement === false) {
                    hoveredNodeElement.frozen = false;
                    hoveredNodeElement.locked = false;
                }
            }, 1000);
        }
        if (hoveredPropertyElement) {
            if (hoveredPropertyElement.editingTextElement === true) return;
            delayedHider = setTimeout(function () {
                deleteGroupElement.classed("hidden", true);
                addDataPropertyGroupElement.classed("hidden", true);
                classDragger.hideDragger(true);
                rangeDragger.hideDragger(true);
                domainDragger.hideDragger(true);
                shadowClone.hideClone(true);
                if (hoveredPropertyElement && hoveredPropertyElement.focused === true && this.options.drawPropertyDraggerOnHover() === true) {
                    hoveredPropertyElement.labelObject.increasedLoopAngle = false;
                    // lazy update
                    recalculatePositions();
                }

                if (hoveredPropertyElement && hoveredPropertyElement.pinned === false && graph.paused() === false && hoveredPropertyElement.editingTextElement === false) {
                    hoveredPropertyElement.frozen = false;
                    hoveredPropertyElement.locked = false;
                }
            }, 1000);
        }
    }

    // TODO : experimental code for updating dynamic label with and its hover element
    hideHoverPropertyElementsForAnimation() {
        deleteGroupElement.classed("hidden", true);
    }

    showHoverElementsAfterAnimation(property, inversed) {
        setDeleteHoverElementPositionProperty(property, inversed);
        deleteGroupElement.classed("hidden", false);
    }

    editElementHoverOnHidden() {
        classDragger.nodeElement.classed("classDraggerNodeHovered", true);
        classDragger.nodeElement.classed("classDraggerNode", false);
        editElementHoverOn();
    }

    editElementHoverOutHidden() {
        classDragger.nodeElement.classed("classDraggerNodeHovered", false);
        classDragger.nodeElement.classed("classDraggerNode", true);
        editElementHoverOut();
    }

    editElementHoverOn(touch) {
        if (touch === true) return;
        clearTimeout(delayedHider); // ignore touch behaviour

    }

    killDelayedTimer() {
        clearTimeout(delayedHider);
        clearTimeout(nodeFreezer);
    }

    editElementHoverOut(tbh) {
        if (hoveredNodeElement) {
            if (graph.ignoreOtherHoverEvents() === true || tbh === true || hoveredNodeElement.editingTextElement === true) return;
            delayedHider = setTimeout(function () {
                if (graph.isADraggerActive() === true) return;
                deleteGroupElement.classed("hidden", true);
                addDataPropertyGroupElement.classed("hidden", true);
                classDragger.hideDragger(true);
                if (hoveredNodeElement && hoveredNodeElement.pinned === false && graph.paused() === false) {
                    hoveredNodeElement.frozen = false;
                    hoveredNodeElement.locked = false;
                }
            }, 1000);
        }
        if (hoveredPropertyElement) {
            if (graph.ignoreOtherHoverEvents() === true || tbh === true || hoveredPropertyElement.editingTextElement === true) return;
            delayedHider = setTimeout(function () {
                if (graph.isADraggerActive() === true) return;
                deleteGroupElement.classed("hidden", true);
                addDataPropertyGroupElement.classed("hidden", true);
                classDragger.hideDragger(true);
                if (hoveredPropertyElement && hoveredPropertyElement.pinned === false && graph.paused() === false) {
                    hoveredPropertyElement.frozen = false;
                    hoveredPropertyElement.locked = false;
                }
            }, 1000);
        }
    }

    activateHoverElementsForProperties(val, property, inversed, touchBehaviour) {
        if (editMode === false) return; // nothing to do;

        if (touchBehaviour === undefined)
            touchBehaviour = false;

        if (val === true) {
            clearTimeout(delayedHider);
            if (hoveredPropertyElement) {
                if (hoveredPropertyElement.domain === hoveredPropertyElement.range) {
                    hoveredPropertyElement.labelObject.increasedLoopAngle = false;
                    recalculatePositions();
                }
            }

            hoveredPropertyElement = property;
            if (this.options.drawPropertyDraggerOnHover() === true) {


                if (property.type !== "owl:DatatypeProperty") {
                    if (property.domain === property.range) {
                        property.labelObject.increasedLoopAngle = true;
                        recalculatePositions();
                    }
                    shadowClone.setParentProperty(property, inversed);
                    rangeDragger.setParentProperty(property, inversed);
                    rangeDragger.hideDragger(false);
                    rangeDragger.addMouseEvents();
                    domainDragger.setParentProperty(property, inversed);
                    domainDragger.hideDragger(false);
                    domainDragger.addMouseEvents();


                } else if (property.type === "owl:DatatypeProperty") {
                    shadowClone.setParentProperty(property, inversed);
                    rangeDragger.setParentProperty(property, inversed);
                    rangeDragger.hideDragger(true);
                    rangeDragger.addMouseEvents();
                    domainDragger.setParentProperty(property, inversed);
                    domainDragger.hideDragger(false);
                    domainDragger.addMouseEvents();
                }
            }
            else { // hide when we dont want that option
                if (this.options.drawPropertyDraggerOnHover() === true) {
                    rangeDragger.hideDragger(true);
                    domainDragger.hideDragger(true);
                    shadowClone.hideClone(true);
                    if (property.domain === property.range) {
                        property.labelObject.increasedLoopAngle = false;
                        recalculatePositions();
                    }
                }
            }

            if (hoveredNodeElement) {
                if (hoveredNodeElement && hoveredNodeElement.pinned === false && graph.paused() === false) {
                    hoveredNodeElement.frozen = false;
                    hoveredNodeElement.locked = false;
                }
            }
            hoveredNodeElement = undefined;
            deleteGroupElement.classed("hidden", false);
            setDeleteHoverElementPositionProperty(property, inversed);
            deleteGroupElement.selectAll("*").on("click", function () {
                if (touchBehaviour && property.focused === false) {
                    this.options.focuserModule().handle(property);
                    return;
                }
                graph.removePropertyViaEditor(property);
                d3.event.stopPropagation();
            });
            classDragger.hideDragger(true);
            addDataPropertyGroupElement.classed("hidden", true);
        } else {
            delayedHiddingHoverElements();
        }
    }

    updateDraggerElements() {

        // set opacity style for all elements

        rangeDragger.draggerObject.classed("superOpacityElement", !this.options.showDraggerObject());
        domainDragger.draggerObject.classed("superOpacityElement", !this.options.showDraggerObject());
        classDragger.draggerObject.classed("superOpacityElement", !this.options.showDraggerObject());

        nodeContainer.selectAll(".superHiddenElement").classed("superOpacityElement", !this.options.showDraggerObject());
        labelContainer.selectAll(".superHiddenElement").classed("superOpacityElement", !this.options.showDraggerObject());

        deleteGroupElement.selectAll(".superHiddenElement").classed("superOpacityElement", !this.options.showDraggerObject());
        addDataPropertyGroupElement.selectAll(".superHiddenElement").classed("superOpacityElement", !this.options.showDraggerObject());


    }

    setAddDataPropertyHoverElementPosition(node) {
        var delX, delY = 0;
        if (node.renderType === "round") {
            var scale = 0.5 * Math.sqrt(2.0);
            var oX = scale * node.smallestRadius;
            var oY = scale * node.smallestRadius;
            delX = node.x - oX;
            delY = node.y + oY;
            addDataPropertyGroupElement.attr("transform", "translate(" + delX + "," + delY + ")");
        }
    }

    setDeleteHoverElementPosition(node) {
        var delX, delY = 0;
        if (node.renderType === "round") {
            var scale = 0.5 * Math.sqrt(2.0);
            var oX = scale * node.smallestRadius;
            var oY = scale * node.smallestRadius;
            delX = node.x + oX;
            delY = node.y - oY;
        } else {
            delX = node.x + 0.5 * node.labelWidth + 6;
            delY = node.y - 0.5 * node.height - 6;
        }
        deleteGroupElement.attr("transform", "translate(" + delX + "," + delY + ")");
    }

    setDeleteHoverElementPositionProperty(property, inversed) {
        if (property && property.labelElement) {
            var pos = [property.labelObject.x, property.labelObject.y];
            var widthElement = parseFloat(property.shapeElement.attr("width"));
            var heightElement = parseFloat(property.shapeElement.attr("height"));
            var delX = pos[0] + 0.5 * widthElement + 6;
            var delY = pos[1] - 0.5 * heightElement - 6;
            // this is the lower element
            if (property.labelElement.attr("transform") === "translate(0,15)")
                delY += 15;
            // this is upper element
            if (property.labelElement.attr("transform") === "translate(0,-15)")
                delY -= 15;
            deleteGroupElement.attr("transform", "translate(" + delX + "," + delY + ")");
        } else {
            deleteGroupElement.classed("hidden", true);// hide when there is no property
        }


    }

    activateHoverElements(val, node, touchBehaviour) {

        if (editMode === false) {
            return; // nothing to do;
        }
        if (touchBehaviour === undefined) {
            touchBehaviour = false;
        }
        if (val === true) {
            if (this.options.drawPropertyDraggerOnHover() === true) {
                rangeDragger.hideDragger(true);
                domainDragger.hideDragger(true);
                shadowClone.hideClone(true);
            }
            // make them visible
            clearTimeout(delayedHider);
            clearTimeout(nodeFreezer);
            if (hoveredNodeElement && node.pinned === false && graph.paused() === false) {
                hoveredNodeElement.frozen = false;
                hoveredNodeElement.locked = false;
            }
            hoveredNodeElement = node;
            if (node && node.frozen === false && node.pinned === false) {
                node.frozen = true;
                node.locked = false;
            }
            if (hoveredPropertyElement && hoveredPropertyElement.focused === false) {
                hoveredPropertyElement.labelObject.increasedLoopAngle = false;
                recalculatePositions();
                // update the loopAngles;
            }
            hoveredPropertyElement = undefined;
            deleteGroupElement.classed("hidden", false);
            setDeleteHoverElementPosition(node);

            deleteGroupElement.selectAll("*").on("click", function () {
                if (touchBehaviour && node.focused === false) {
                    this.options.focuserModule().handle(node);
                    return;
                }
                graph.removeNodeViaEditor(node);
                d3.event.stopPropagation();
            })
                .on("mouseover", function () {
                    editElementHoverOn(node, touchBehaviour);
                })
                .on("mouseout", function () {
                    editElementHoverOut(node, touchBehaviour);
                });

            addDataPropertyGroupElement.classed("hidden", true);
            classDragger.nodeElement.on("mouseover", editElementHoverOn)
                .on("mouseout", editElementHoverOut);
            classDragger.draggerObject.on("mouseover", editElementHoverOnHidden)
                .on("mouseout", editElementHoverOutHidden);

            // add the dragger element;
            if (node.renderType === "round") {
                classDragger.svgRoot = draggerLayer;
                classDragger.setParentNode(node);
                classDragger.hideDragger(false);
                addDataPropertyGroupElement.classed("hidden", false);
                setAddDataPropertyHoverElementPosition(node);
                addDataPropertyGroupElement.selectAll("*").on("click", function () {
                    if (touchBehaviour && node.focused === false) {
                        this.options.focuserModule().handle(node);
                        return;
                    }
                    graph.createDataTypeProperty(node);
                    d3.event.stopPropagation();
                })
                    .on("mouseover", function () {
                        editElementHoverOn(node, touchBehaviour);
                    })
                    .on("mouseout", function () {
                        editElementHoverOut(node, touchBehaviour);
                    });
            } else {
                classDragger.hideDragger(true);

            }

        } else {
            delayedHiddingHoverElements(node, touchBehaviour);

        }
    }

}