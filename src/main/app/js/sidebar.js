/**
 * Contains the logic for the sidebar.
 * @param graph the graph that belongs to these controls
 * @returns {{}}
 */

import { Statistics } from "../../webvowl/js/modules/filters/statistics";
import { Constants } from "../../webvowl/js/util/constants";
import { ElementTools } from "../../webvowl/js/util/elementTools";
import { LanguageTools } from "../../webvowl/js/util/languageTools";

export class SideBar {
    constructor(graph) {
        this.graph = graph

        // Required for reloading when the language changes
        this.ontologyInfo = undefined
        this.visibleSidebar = 1
        this.lastSelectedElement = undefined

        this.detailArea = d3.select("#detailsArea")
        this.graphArea = d3.select("#canvasArea")
        this.menuArea = d3.select("#swipeBarContainer")
        this.collapseButton = d3.select("#sidebarExpandButton")
    }

    /**
     * Setup the menu bar.
     */
    #setupCollapsing() {
        // adapted version of this example: http://www.normansblog.de/simple-jquery-accordion/
        function collapseContainers(containers) {
            containers.classed("hidden", true);
        }

        function expandContainers(containers) {
            containers.classed("hidden", false);
        }

        const triggers = d3.selectAll(".accordion-trigger");

        // Collapse all inactive triggers on startup
        collapseContainers(d3.selectAll(".accordion-trigger:not(.accordion-trigger-active) + div"));

        triggers.on("click", function () {
            const selectedTrigger = d3.select(this);
            const activeTriggers = d3.selectAll(".accordion-trigger-active");

            if (selectedTrigger.classed("accordion-trigger-active")) {
                // Collapse the active (which is also the selected) trigger
                collapseContainers(d3.select(selectedTrigger.node().nextElementSibling));
                selectedTrigger.classed("accordion-trigger-active", false);
            } else {
                // Collapse the other trigger ...
                collapseContainers(d3.selectAll(".accordion-trigger-active + div"));
                activeTriggers.classed("accordion-trigger-active", false);
                // ... and expand the selected one
                expandContainers(d3.select(selectedTrigger.node().nextElementSibling));
                selectedTrigger.classed("accordion-trigger-active", true);
            }
        });
    }

    clearOntologyInformation() {
        d3.select("#title").text("No title available");
        d3.select("#about").attr("href", "#").attr("target", "_blank").text("not given");
        d3.select("#version").text("--");
        d3.select("#authors").text("--");
        d3.select("#description").text("No description available.");
        const container = d3.select("#ontology-metadata");
        container.selectAll("*").remove();
        d3.select("#classCount")
            .text("0");
        d3.select("#objectPropertyCount")
            .text("0");
        d3.select("#datatypePropertyCount")
            .text("0");
        d3.select("#individualCount")
            .text("0");
        d3.select("#nodeCount")
            .text("0");
        d3.select("#edgeCount")
            .text("0");

        // clear selectedNode info
        const isTriggerActive = d3.select("#selection-details-trigger").classed("accordion-trigger-active");
        if (isTriggerActive) {
            // close accordion
            d3.select("#selection-details-trigger").node().click();
        }
        this.#showSelectionAdvice();
    }

    /**
     * Updates the information of the passed ontology.
     * @param {any} data the graph data
     * @param {Statistics} statistics the statistics module
     */
    updateOntologyInformation(data, statistics) {
        data = data || {};
        this.ontologyInfo = data.header || {};

        this.#updateGraphInformation();
        this.#displayGraphStatistics(undefined, statistics);
        this.#displayMetadata(this.ontologyInfo.other);

        // Reset the sidebar selection
        this.updateSelectionInformation(undefined);

        this.#setLanguages(this.ontologyInfo.languages);
    }

    /**
     * @param {Array<any>} languages
     */
    #setLanguages(languages) {
        languages = languages || [];

        // Put the default and unset label on top of the selection labels
        languages.sort(function (a, b) {
            if (a === Constants.LANG_IRIBASED || a === Constants.LANG_UNDEFINED) {
                return -1;
            } else if (b === Constants.LANG_IRIBASED || b === Constants.LANG_UNDEFINED) {
                return 1;
            }
            return a.localeCompare(b);
        });

        const languageSelection = d3.select("#language")
            .on("change", () => {
                this.graph.language(d3.event.target.value);
                this.#updateGraphInformation();
                this.updateSelectionInformation(this.lastSelectedElement);
            });

        languageSelection.selectAll("option").remove();
        languageSelection.selectAll("option")
            .data(languages)
            .enter().append("option")
            .attr("value", function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            });

        if (!this.#trySelectDefaultLanguage(languageSelection, languages, "en")) {
            if (!this.#trySelectDefaultLanguage(languageSelection, languages, Constants.LANG_UNDEFINED)) {
                this.#trySelectDefaultLanguage(languageSelection, languages, Constants.LANG_IRIBASED);
            }
        }
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} selection
     * @param {string[]} languages
     * @param {string} language
     */
    #trySelectDefaultLanguage(selection, languages, language) {
        const langIndex = languages.indexOf(language);
        if (langIndex >= 0) {
            selection.property("selectedIndex", langIndex);
            this.graph.language(language);
            return true;
        }
        return false;
    }

    #updateGraphInformation() {
        const title = LanguageTools.textInLanguage(this.ontologyInfo.title, this.graph.language());
        d3.select("#title").text(title || "No title available");
        d3.select("#about").attr("href", this.ontologyInfo.iri).attr("target", "_blank").text(this.ontologyInfo.iri);
        d3.select("#version").text(this.ontologyInfo.version || "--");
        const authors = this.ontologyInfo.author;
        if (typeof authors === "string") {
            // Stay compatible with author info as strings after change in january 2015
            d3.select("#authors").text(authors);
        } else if (authors instanceof Array) {
            d3.select("#authors").text(authors.join(", "));
        } else {
            d3.select("#authors").text("--");
        }

        const description = LanguageTools.textInLanguage(ontologyInfo.description, graph.language());
        d3.select("#description").text(description || "No description available.");
    }

    #displayGraphStatistics(deliveredMetrics, statistics) {
        // Metrics are optional and may be undefined
        deliveredMetrics = deliveredMetrics || {};

        d3.select("#classCount")
            .text(deliveredMetrics.classCount || statistics.classCount);
        d3.select("#objectPropertyCount")
            .text(deliveredMetrics.objectPropertyCount || statistics.objectPropertyCount);
        d3.select("#datatypePropertyCount")
            .text(deliveredMetrics.datatypePropertyCount || statistics.datatypePropertyCount);
        d3.select("#individualCount")
            .text(deliveredMetrics.totalIndividualCount || statistics.totalIndividualCount);
        d3.select("#nodeCount")
            .text(statistics.nodeCount);
        d3.select("#edgeCount")
            .text(statistics.edgeCount);
    }

    #displayMetadata(metadata) {
        const container = d3.select("#ontology-metadata");
        container.selectAll("*").remove();

        listAnnotations(container, metadata);

        if (container.selectAll(".annotation").size() <= 0) {
            container.append("p").text("No annotations available.");
        }
    }

    #listAnnotations(container, annotationObject) {
        annotationObject = annotationObject || {};  //todo

        // Collect the annotations in an array for simpler processing
        const annotations = [];
        for (const annotation in annotationObject) {
            if (annotationObject.hasOwnProperty(annotation)) {
                annotations.push(annotationObject[annotation][0]);
            }
        }

        container.selectAll(".annotation").remove();
        container.selectAll(".annotation").data(annotations).enter().append("p")
            .classed("annotation", true)
            .classed("statisticDetails", true)
            .text(function (d) {
                return d.identifier + ":";
            })
            .append("span")
            .each(function (d) {
                appendIriLabel(d3.select(this), d.value, d.type === "iri" ? d.value : undefined);
            });
    }

    /**
     * Update the information of the selected node.
     * @param selectedElement the selection or null if nothing is selected
     */
    updateSelectionInformation(selectedElement) {
        lastSelectedElement = selectedElement;

        // Click event was prevented when dragging
        if (d3.event && d3.event.defaultPrevented) {
            return;
        }

        const isTriggerActive = d3.select("#selection-details-trigger").classed("accordion-trigger-active");
        if (selectedElement && !isTriggerActive) {
            d3.select("#selection-details-trigger").node().click();
        } else if (!selectedElement && isTriggerActive) {
            showSelectionAdvice();
            return;
        }

        if (ElementTools.isProperty(selectedElement)) {
            displayPropertyInformation(selectedElement);
        } else if (ElementTools.isNode(selectedElement)) {
            displayNodeInformation(selectedElement);
        }
    };

    #showSelectionAdvice() {
        setSelectionInformationVisibility(false, false, true);
    }

    #setSelectionInformationVisibility(showClasses, showProperties, showAdvice) {
        d3.select("#classSelectionInformation").classed("hidden", !showClasses);
        d3.select("#propertySelectionInformation").classed("hidden", !showProperties);
        d3.select("#noSelectionInformation").classed("hidden", !showAdvice);
    }

    #displayPropertyInformation(property) {
        showPropertyInformations();

        setIriLabel(d3.select("#propname"), property.labelForCurrentLanguage(), property.iri);
        d3.select("#typeProp").text(property.type);

        if (property.inverse !== undefined) {
            d3.select("#inverse").classed("hidden", false);
            setIriLabel(d3.select("#inverse span"), property.inverse.labelForCurrentLanguage(), property.inverse.iri);
        } else {
            d3.select("#inverse").classed("hidden", true);
        }

        const equivalentIriSpan = d3.select("#propEquivUri");
        listNodeArray(equivalentIriSpan, property.equivalents);

        listNodeArray(d3.select("#subproperties"), property.subproperties);
        listNodeArray(d3.select("#superproperties"), property.superproperties);

        if (property.minCardinality !== undefined) {
            d3.select("#infoCardinality").classed("hidden", true);
            d3.select("#minCardinality").classed("hidden", false);
            d3.select("#minCardinality span").text(property.minCardinality);
            d3.select("#maxCardinality").classed("hidden", false);

            if (property.maxCardinality !== undefined) {
                d3.select("#maxCardinality span").text(property.maxCardinality);
            } else {
                d3.select("#maxCardinality span").text("*");
            }

        } else if (property.cardinality !== undefined) {
            d3.select("#minCardinality").classed("hidden", true);
            d3.select("#maxCardinality").classed("hidden", true);
            d3.select("#infoCardinality").classed("hidden", false);
            d3.select("#infoCardinality span").text(property.cardinality);
        } else {
            d3.select("#infoCardinality").classed("hidden", true);
            d3.select("#minCardinality").classed("hidden", true);
            d3.select("#maxCardinality").classed("hidden", true);
        }

        setIriLabel(d3.select("#domain"), property.domain.labelForCurrentLanguage(), property.domain.iri);
        setIriLabel(d3.select("#range"), property.range.labelForCurrentLanguage(), property.range.iri);

        displayAttributes(property.attributes, d3.select("#propAttributes"));

        setTextAndVisibility(d3.select("#propDescription"), property.descriptionForCurrentLanguage());
        setTextAndVisibility(d3.select("#propComment"), property.commentForCurrentLanguage());

        listAnnotations(d3.select("#propertySelectionInformation"), property.annotations);
    }

    #showPropertyInformations() {
        setSelectionInformationVisibility(false, true, false);
    }

    #setIriLabel(element, name, iri) {
        const parent = d3.select(element.node().parentNode);

        if (name) {
            element.selectAll("*").remove();
            appendIriLabel(element, name, iri);
            parent.classed("hidden", false);
        } else {
            parent.classed("hidden", true);
        }
    }

    #appendIriLabel(element, name, iri) {
        const tag;

        if (iri) {
            tag = element.append("a")
                .attr("href", iri)
                .attr("title", iri)
                .attr("target", "_blank");
        } else {
            tag = element.append("span");
        }
        tag.text(name);
    }

    #displayAttributes(attributes, textSpan) {
        const spanParent = d3.select(textSpan.node().parentNode);

        if (attributes && attributes.length > 0) {
            // Remove redundant redundant attributes for sidebar
            removeElementFromArray("object", attributes);
            removeElementFromArray("datatype", attributes);
            removeElementFromArray("rdf", attributes);
        }

        if (attributes && attributes.length > 0) {
            textSpan.text(attributes.join(", "));

            spanParent.classed("hidden", false);
        } else {
            spanParent.classed("hidden", true);
        }
    }

    #removeElementFromArray(element, array) {
        const index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    #displayNodeInformation(node) {
        showClassInformations();

        setIriLabel(d3.select("#name"), node.labelForCurrentLanguage(), node.iri);

        /* Equivalent stuff. */
        const equivalentIriSpan = d3.select("#classEquivUri");
        listNodeArray(equivalentIriSpan, node.equivalents);

        d3.select("#typeNode").text(node.type);
        listNodeArray(d3.select("#individuals"), node.individuals);

        /* Disjoint stuff. */
        const disjointNodes = d3.select("#disjointNodes");
        const disjointNodesParent = d3.select(disjointNodes.node().parentNode);

        if (node.disjointWith !== undefined) {
            disjointNodes.selectAll("*").remove();

            node.disjointWith.forEach(function (element, index) {
                if (index > 0) {
                    disjointNodes.append("span").text(", ");
                }
                appendIriLabel(disjointNodes, element.labelForCurrentLanguage(), element.iri);
            });

            disjointNodesParent.classed("hidden", false);
        } else {
            disjointNodesParent.classed("hidden", true);
        }

        displayAttributes(node.attributes, d3.select("#classAttributes"));

        setTextAndVisibility(d3.select("#nodeDescription"), node.descriptionForCurrentLanguage());
        setTextAndVisibility(d3.select("#nodeComment"), node.commentForCurrentLanguage());

        listAnnotations(d3.select("#classSelectionInformation"), node.annotations);
    }

    #showClassInformations() {
        setSelectionInformationVisibility(true, false, false);
    }

    #listNodeArray(textSpan, nodes) {
        const spanParent = d3.select(textSpan.node().parentNode);

        if (nodes && nodes.length) {
            textSpan.selectAll("*").remove();
            nodes.forEach(function (element, index) {
                if (index > 0) {
                    textSpan.append("span").text(", ");
                }
                appendIriLabel(textSpan, element.labelForCurrentLanguage(), element.iri);
            });

            spanParent.classed("hidden", false);
        } else {
            spanParent.classed("hidden", true);
        }
    }

    #setTextAndVisibility(label, value) {
        const parentNode = d3.select(label.node().parentNode);
        const hasValue = !!value;
        if (value) {
            label.text(value);
        }
        parentNode.classed("hidden", !hasValue);
    }

    // Collapsible Sidebar functions
    showSidebar = function (val, init) {
        // make val to bool
        if (val === 1) {
            visibleSidebar = true;
            collapseButton.node().innerHTML = ">";
            detailArea.classed("hidden", true);
            if (init === true) {
                detailArea.classed("hidden", !visibleSidebar);
                graphArea.style("width", "78%");
                graphArea.style("-webkit-animation-name", "none");

                menuArea.style("width", "78%");
                menuArea.style("-webkit-animation-name", "none");

                d3.select("#WarningErrorMessagesContainer").style("width", "78%");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "none");
            } else {
                graphArea.style("width", "78%");
                graphArea.style("-webkit-animation-name", "sbCollapseAnimation");
                graphArea.style("-webkit-animation-duration", "0.5s");

                menuArea.style("width", "78%");
                menuArea.style("-webkit-animation-name", "sbCollapseAnimation");
                menuArea.style("-webkit-animation-duration", "0.5s");

                d3.select("#WarningErrorMessagesContainer").style("width", "78%");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "warn_ExpandRightBarAnimation");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-duration", "0.5s");
            }
            graph.options().width() = window.innerWidth - (window.innerWidth * 0.22);
            graph.options().navigationMenu().updateScrollButtonVisibility();
        }
        if (val === 0) {
            visibleSidebar = false;
            detailArea.classed("hidden", true);

            collapseButton.node().innerHTML = "<";
            // adjust the layout
            if (init === true) {
                graphArea.style("width", "100%");
                graphArea.style("-webkit-animation-name", "none");

                menuArea.style("width", "100%");
                menuArea.style("-webkit-animation-name", "none");

                d3.select("#WarningErrorMessagesContainer").style("width", "100%");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "none");
            } else {
                graphArea.style("width", "100%");
                graphArea.style("-webkit-animation-name", "sbExpandAnimation");
                graphArea.style("-webkit-animation-duration", "0.5s");

                menuArea.style("width", "100%");
                menuArea.style("-webkit-animation-name", "sbExpandAnimation");
                menuArea.style("-webkit-animation-duration", "0.5s");

                d3.select("#WarningErrorMessagesContainer").style("width", "100%");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "warn_CollapseRightBarAnimation");
                d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-duration", "0.5s");

            }
            graph.options().width() = window.innerWidth;
            graph.updateCanvasContainerSize();
            graph.options().navigationMenu().updateScrollButtonVisibility();
        }
    }

    updateSideBarVis(init) {
        const vis = sidebar.getSidebarVisibility();
        sidebar.showSidebar(parseInt(vis), init);
    }

    getSidebarVisibility() {
        const isHidden = detailArea.classed("hidden");
        if (isHidden === false) return String(1);
        if (isHidden === true) return String(0);
    }

    initSideBarAnimation() {
        graphArea.node().addEventListener("animationend", function () {
            detailArea.classed("hidden", !visibleSidebar);
            graph.updateCanvasContainerSize();
            graph.options().navigationMenu().updateScrollButtonVisibility();
        });
    }

    setup() {
        setupCollapsing();
        sidebar.initSideBarAnimation();

        collapseButton.on("click", function () {
            graph.options().navigationMenu().hideAllMenus();
            const settingValue = parseInt(sidebar.getSidebarVisibility());
            if (settingValue === 1) sidebar.showSidebar(0);
            else sidebar.showSidebar(1);
        });
    }

    updateShowedInformation() {
        const editMode = graph.editorMode();
        d3.select("#generalDetails").classed("hidden", editMode);
        d3.select("#generalDetailsEdit").classed("hidden", !editMode);

        // store the meta information in graph.options()

        // todo: update edit meta info
        graph.options().editSidebar().updateGeneralOntologyInfo();

        // todo: update showed meta info;
        graph.options().sidebar().updateGeneralOntologyInfo();
    }

    updateGeneralOntologyInfo() {
        // get it from graph.options
        const generalMetaObj = graph.options().getGeneralMetaObject();
        const preferredLanguage = graph && graph.language ? graph.language() : null;
        if (generalMetaObj.hasOwnProperty("title")) {
            // title has language to it -.-
            if (typeof generalMetaObj.title === "object") {
                d3.select("#title").node().value = LanguageTools.textInLanguage(generalMetaObj.title, preferredLanguage);
            } else {
                d3.select("#title").node().innerHTML = generalMetaObj.title;
            }

        }
        if (generalMetaObj.hasOwnProperty("iri")) {
            d3.select("#about").node().innerHTML = generalMetaObj.iri;
        }
        if (generalMetaObj.hasOwnProperty("iri")) {
            d3.select("#about").node().href = generalMetaObj.iri;
        }
        if (generalMetaObj.hasOwnProperty("version")) {
            d3.select("#version").node().innerHTML = generalMetaObj.version;
        }
        if (generalMetaObj.hasOwnProperty("author")) {
            d3.select("#authors").node().innerHTML = generalMetaObj.author;
        }
        // this could also be an object >>
        if (generalMetaObj.hasOwnProperty("description")) {
            if (typeof generalMetaObj.description === "object") {
                d3.select("#description").node().innerHTML = LanguageTools.textInLanguage(generalMetaObj.description, preferredLanguage);
            }
            else {
                d3.select("#description").node().innerHTML = generalMetaObj.description;
            }
        }
    }
}