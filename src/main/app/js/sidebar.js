import d3 from "d3"
import BaseNode from "../../webvowl/js/elements/nodes/BaseNode"
import BaseProperty from "../../webvowl/js/elements/properties/BaseProperty"
import Graph from "../../webvowl/js/graph"
import Statistics from "../../webvowl/js/modules/filters/statistics"
import Constants from "../../webvowl/js/util/constants"
import ElementTools from "../../webvowl/js/util/elementTools"
import LanguageTools from "../../webvowl/js/util/languageTools"

export default class SideBar {
    /**
     * Contains the logic for the sidebar.
     * @param {Graph} graph the graph that belongs to these controls
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {{ [x: string]: any; } | undefined}
         */
        this.ontologyInfo = undefined // Required for reloading when the language changes
        this.visibleSidebar = true
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
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
            containers.classed("hidden", true)
        }

        function expandContainers(containers) {
            containers.classed("hidden", false)
        }

        const triggers = d3.selectAll(".accordion-trigger")

        // Collapse all inactive triggers on startup
        collapseContainers(
            d3.selectAll(
                ".accordion-trigger:not(.accordion-trigger-active) + div",
            ),
        )

        triggers.on("click", function () {
            const selectedTrigger = d3.select(this)
            const activeTriggers = d3.selectAll(".accordion-trigger-active")

            if (selectedTrigger.classed("accordion-trigger-active")) {
                // Collapse the active (which is also the selected) trigger
                collapseContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", false)
            } else {
                // Collapse the other trigger ...
                collapseContainers(
                    d3.selectAll(".accordion-trigger-active + div"),
                )
                activeTriggers.classed("accordion-trigger-active", false)
                // ... and expand the selected one
                expandContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", true)
            }
        })
    }

    clearOntologyInformation() {
        d3.select("#title").text("No title available")
        d3.select("#about")
            .attr("href", "#")
            .attr("target", "_blank")
            .text("not given")
        d3.select("#version").text("--")
        d3.select("#authors").text("--")
        d3.select("#description").text("No description available.")
        const container = d3.select("#ontology-metadata")
        container.selectAll("*").remove()
        d3.select("#classCount").text("0")
        d3.select("#objectPropertyCount").text("0")
        d3.select("#datatypePropertyCount").text("0")
        d3.select("#individualCount").text("0")
        d3.select("#nodeCount").text("0")
        d3.select("#edgeCount").text("0")

        // clear selectedNode info
        const isTriggerActive = d3
            .select("#selection-details-trigger")
            .classed("accordion-trigger-active")
        if (isTriggerActive) {
            // close accordion
            d3.select("#selection-details-trigger").node().click()
        }
        this.#showSelectionAdvice()
    }

    /**
     * Updates the information of the passed ontology.
     * @param {any} data the graph data
     * @param {Statistics} statistics the statistics module
     */
    updateOntologyInformation(data, statistics) {
        data = data || {}
        this.ontologyInfo = data.header || {}

        this.#updateGraphInformation()
        this.#displayGraphStatistics(undefined, statistics)
        this.#displayMetadata(this.ontologyInfo.other)

        // Reset the sidebar selection
        this.updateSelectionInformation(undefined)

        this.#setLanguages(this.ontologyInfo.languages)
    }

    /**
     * @param {string[]} languages
     */
    #setLanguages(languages) {
        languages = languages || []

        // Put the default and unset label on top of the selection labels
        languages.sort(function (a, b) {
            if (
                a === Constants.LANG_IRIBASED ||
                a === Constants.LANG_UNDEFINED
            ) {
                return -1
            } else if (
                b === Constants.LANG_IRIBASED ||
                b === Constants.LANG_UNDEFINED
            ) {
                return 1
            }
            return a.localeCompare(b)
        })

        const languageSelection = d3.select("#language").on("change", () => {
            this.graph.language = d3.event.target.value
            this.#updateGraphInformation()
            this.updateSelectionInformation(this.lastSelectedElement)
        })

        languageSelection.selectAll("option").remove()
        languageSelection
            .selectAll("option")
            .data(languages)
            .enter()
            .append("option")
            .attr("value", function (d) {
                return d
            })
            .text(function (d) {
                return d
            })

        if (
            !this.#trySelectDefaultLanguage(languageSelection, languages, "en")
        ) {
            if (
                !this.#trySelectDefaultLanguage(
                    languageSelection,
                    languages,
                    Constants.LANG_UNDEFINED,
                )
            ) {
                if (
                    !this.#trySelectDefaultLanguage(
                        languageSelection,
                        languages,
                        Constants.LANG_IRIBASED,
                    )
                ) {
                    // Failed to set language, but we must generate the dictionary
                    this.graph.generateDictionary()
                }
            }
        }
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} selection
     * @param {string[]} languages
     * @param {string} language
     */
    #trySelectDefaultLanguage(selection, languages, language) {
        const langIndex = languages.indexOf(language)
        if (langIndex >= 0) {
            selection.property("selectedIndex", langIndex)
            this.graph.language = language
            return true
        }
        return false
    }

    #updateGraphInformation() {
        const title = LanguageTools.textInLanguage(
            this.ontologyInfo.title,
            this.graph.language,
        )
        d3.select("#title").text(title || "No title available")
        d3.select("#about")
            .attr("href", this.ontologyInfo.iri)
            .attr("target", "_blank")
            .text(this.ontologyInfo.iri)
        d3.select("#version").text(this.ontologyInfo.version || "--")
        const authors = this.ontologyInfo.author
        if (typeof authors === "string") {
            // Stay compatible with author info as strings after change in january 2015
            d3.select("#authors").text(authors)
        } else if (authors instanceof Array) {
            d3.select("#authors").text(authors.join(", "))
        } else {
            d3.select("#authors").text("--")
        }

        const description = LanguageTools.textInLanguage(
            this.ontologyInfo.description,
            this.graph.language,
        )
        d3.select("#description").text(
            description || "No description available.",
        )
    }

    /**
     * @param {any} deliveredMetrics The graph data
     * @param {Statistics} statistics The statistics module
     */
    #displayGraphStatistics(deliveredMetrics, statistics) {
        // Metrics are optional and may be undefined
        deliveredMetrics = deliveredMetrics || {}

        d3.select("#classCount").text(
            deliveredMetrics.classCount || statistics.classCount,
        )
        d3.select("#objectPropertyCount").text(
            deliveredMetrics.objectPropertyCount ||
                statistics.objectPropertyCount,
        )
        d3.select("#datatypePropertyCount").text(
            deliveredMetrics.datatypePropertyCount ||
                statistics.datatypePropertyCount,
        )
        d3.select("#individualCount").text(
            deliveredMetrics.totalIndividualCount ||
                statistics.totalIndividualCount,
        )
        d3.select("#nodeCount").text(statistics.nodeCount)
        d3.select("#edgeCount").text(statistics.edgeCount)
    }

    /**
     * @param {{ [x: string]: any[]; }} metadata
     */
    #displayMetadata(metadata) {
        const container = d3.select("#ontology-metadata")
        container.selectAll("*").remove()

        this.#listAnnotations(container, metadata)

        if (container.selectAll(".annotation").size() <= 0) {
            container.append("p").text("No annotations available.")
        }
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} container
     * @param {{ [x: string]: any[]; }} annotationObject
     */
    #listAnnotations(container, annotationObject) {
        annotationObject = annotationObject || {} //todo

        // Collect the annotations in an array for simpler processing
        const annotations = []
        for (const annotation in annotationObject) {
            if (annotationObject.hasOwnProperty(annotation)) {
                annotations.push(annotationObject[annotation][0])
            }
        }
        const _this = this
        container.selectAll(".annotation").remove()
        container
            .selectAll(".annotation")
            .data(annotations)
            .enter()
            .append("p")
            .classed("annotation", true)
            .classed("statisticDetails", true)
            .text(function (d) {
                return d.identifier + ":"
            })
            .append("span")
            .each(function (d) {
                _this.#appendIriLabel(
                    d3.select(this),
                    d.value,
                    d.type === "iri" ? d.value : undefined,
                )
            })
    }

    /**
     * Update the information of the selected node.
     * @param {d3.Selection<any, any, null, undefined>} selectedElement the selection or null if nothing is selected
     */
    updateSelectionInformation(selectedElement) {
        this.lastSelectedElement = selectedElement

        // Click event was prevented when dragging
        if (d3.event && d3.event.defaultPrevented) {
            return
        }

        const isTriggerActive = d3
            .select("#selection-details-trigger")
            .classed("accordion-trigger-active")
        if (selectedElement && !isTriggerActive) {
            d3.select("#selection-details-trigger").node().click()
        } else if (!selectedElement && isTriggerActive) {
            this.#showSelectionAdvice()
            return
        }

        if (ElementTools.isProperty(selectedElement)) {
            this.#displayPropertyInformation(selectedElement)
        } else if (ElementTools.isNode(selectedElement)) {
            this.#displayNodeInformation(selectedElement)
        }
    }

    #showSelectionAdvice() {
        this.#setSelectionInformationVisibility(false, false, true)
    }

    #showClassInformations() {
        this.#setSelectionInformationVisibility(true, false, false)
    }

    #showPropertyInformations() {
        this.#setSelectionInformationVisibility(false, true, false)
    }

    /**
     * @param {boolean} showClasses
     * @param {boolean} showProperties
     * @param {boolean} showAdvice
     */
    #setSelectionInformationVisibility(
        showClasses,
        showProperties,
        showAdvice,
    ) {
        d3.select("#classSelectionInformation").classed("hidden", !showClasses)
        d3.select("#propertySelectionInformation").classed(
            "hidden",
            !showProperties,
        )
        d3.select("#noSelectionInformation").classed("hidden", !showAdvice)
    }

    /**
     * @param {BaseProperty} property
     */
    #displayPropertyInformation(property) {
        this.#showPropertyInformations()

        this.#setIriLabel(
            d3.select("#propname"),
            property.labelForCurrentLanguage(),
            property.iri,
        )
        d3.select("#typeProp").text(property.type)

        if (property.inverse !== undefined) {
            d3.select("#inverse").classed("hidden", false)
            this.#setIriLabel(
                d3.select("#inverse span"),
                property.inverse.labelForCurrentLanguage(),
                property.inverse.iri,
            )
        } else {
            d3.select("#inverse").classed("hidden", true)
        }

        const equivalentIriSpan = d3.select("#propEquivUri")
        this.#listNodeArray(equivalentIriSpan, property.equivalents)
        this.#listNodeArray(d3.select("#subproperties"), property.subproperties)
        this.#listNodeArray(
            d3.select("#superproperties"),
            property.superproperties,
        )

        if (property.minCardinality !== undefined) {
            d3.select("#infoCardinality").classed("hidden", true)
            d3.select("#minCardinality").classed("hidden", false)
            d3.select("#minCardinality span").text(property.minCardinality)
            d3.select("#maxCardinality").classed("hidden", false)

            if (property.maxCardinality !== undefined) {
                d3.select("#maxCardinality span").text(property.maxCardinality)
            } else {
                d3.select("#maxCardinality span").text("*")
            }
        } else if (property.cardinality !== undefined) {
            d3.select("#minCardinality").classed("hidden", true)
            d3.select("#maxCardinality").classed("hidden", true)
            d3.select("#infoCardinality").classed("hidden", false)
            d3.select("#infoCardinality span").text(property.cardinality)
        } else {
            d3.select("#infoCardinality").classed("hidden", true)
            d3.select("#minCardinality").classed("hidden", true)
            d3.select("#maxCardinality").classed("hidden", true)
        }

        this.#setIriLabel(
            d3.select("#domain"),
            property.domain.labelForCurrentLanguage(),
            property.domain.iri,
        )
        this.#setIriLabel(
            d3.select("#range"),
            property.range.labelForCurrentLanguage(),
            property.range.iri,
        )

        this.#displayAttributes(
            property.attributes,
            d3.select("#propAttributes"),
        )

        this.#setTextAndVisibility(
            d3.select("#propDescription"),
            property.descriptionForCurrentLanguage(),
        )
        this.#setTextAndVisibility(
            d3.select("#propComment"),
            property.commentForCurrentLanguage(),
        )

        this.#listAnnotations(
            d3.select("#propertySelectionInformation"),
            property.annotations,
        )
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} element
     * @param {string} name
     * @param {string} iri
     */
    #setIriLabel(element, name, iri) {
        const parent = d3.select(element.node().parentNode)
        if (name) {
            element.selectAll("*").remove()
            this.#appendIriLabel(element, name, iri)
            parent.classed("hidden", false)
        } else {
            parent.classed("hidden", true)
        }
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} element
     * @param {string} name
     * @param {string} iri
     */
    #appendIriLabel(element, name, iri) {
        let tag
        if (iri) {
            tag = element
                .append("a")
                .attr("href", iri)
                .attr("title", iri)
                .attr("target", "_blank")
        } else {
            tag = element.append("span")
        }
        tag.text(name)
    }

    /**
     * @param {string[] | undefined} attributes
     * @param {d3.Selection<any, any, HTMLElement, any>} textSpan
     */
    #displayAttributes(attributes, textSpan) {
        const spanParent = d3.select(textSpan.node().parentNode)

        if (attributes && attributes.length > 0) {
            // Remove redundant redundant attributes for sidebar
            this.#removeElementFromArray("object", attributes)
            this.#removeElementFromArray("datatype", attributes)
            this.#removeElementFromArray("rdf", attributes)
        }

        if (attributes && attributes.length > 0) {
            textSpan.text(attributes.join(", "))
            spanParent.classed("hidden", false)
        } else {
            spanParent.classed("hidden", true)
        }
    }

    /**
     * @param {string} element
     * @param {string[]} array
     */
    #removeElementFromArray(element, array) {
        const index = array.indexOf(element)
        if (index > -1) {
            array.splice(index, 1)
        }
    }

    /**
     * @param {BaseNode} node
     */
    #displayNodeInformation(node) {
        this.#showClassInformations()
        this.#setIriLabel(
            d3.select("#name"),
            node.labelForCurrentLanguage(),
            node.iri,
        )

        /* Equivalent stuff. */
        const equivalentIriSpan = d3.select("#classEquivUri")
        // @ts-ignore
        this.#listNodeArray(equivalentIriSpan, node.equivalents)

        d3.select("#typeNode").text(node.type)
        this.#listNodeArray(d3.select("#individuals"), node.individuals)

        /* Disjoint stuff. */
        const disjointNodes = d3.select("#disjointNodes")
        const disjointNodesParent = d3.select(disjointNodes.node().parentNode)

        if (node.disjointWith !== undefined) {
            disjointNodes.selectAll("*").remove()
            for (let i = 0; i < node.disjointWith.length; i++) {
                if (i > 0) {
                    disjointNodes.append("span").text(", ")
                }
                const element = node.disjointWith[i]
                this.#appendIriLabel(
                    disjointNodes,
                    element.labelForCurrentLanguage(),
                    element.iri,
                )
            }
            disjointNodesParent.classed("hidden", false)
        } else {
            disjointNodesParent.classed("hidden", true)
        }
        this.#displayAttributes(node.attributes, d3.select("#classAttributes"))

        this.#setTextAndVisibility(
            d3.select("#nodeDescription"),
            node.descriptionForCurrentLanguage(),
        )
        this.#setTextAndVisibility(
            d3.select("#nodeComment"),
            node.commentForCurrentLanguage(),
        )

        this.#listAnnotations(
            d3.select("#classSelectionInformation"),
            node.annotations,
        )
    }

    /**
     * @param {d3.Selection<any,any,HTMLElement,undefined>} textSpan
     * @param {BaseNode[] | BaseProperty[] | undefined} nodes
     */
    #listNodeArray(textSpan, nodes) {
        const spanParent = d3.select(textSpan.node().parentNode)

        if (nodes && nodes.length) {
            textSpan.selectAll("*").remove()
            for (let i = 0; i < nodes.length; i++) {
                if (i > 0) {
                    textSpan.append("span").text(", ")
                }
                const element = nodes[i]
                this.#appendIriLabel(
                    textSpan,
                    element.labelForCurrentLanguage(),
                    element.iri,
                )
            }
            spanParent.classed("hidden", false)
        } else {
            spanParent.classed("hidden", true)
        }
    }

    /**
     * @param {d3.Selection<any,any,HTMLElement,undefined>} label
     * @param {string} value
     */
    #setTextAndVisibility(label, value) {
        const parentNode = d3.select(label.node().parentNode)
        const hasValue = Boolean(value)
        if (hasValue) {
            label.text(value)
        }
        parentNode.classed("hidden", !hasValue)
    }

    // Collapsible Sidebar functions
    /**
     * @param {boolean} isVisible
     * @param {boolean} init
     */
    showSidebar(isVisible, init = false) {
        if (isVisible) {
            this.visibleSidebar = true
            this.collapseButton.node().innerHTML = ">"
            this.detailArea.classed("hidden", true)
            if (init) {
                this.detailArea.classed("hidden", !this.visibleSidebar)
                this.graphArea.style("width", "78%")
                this.graphArea.style("-webkit-animation-name", "none")

                this.menuArea.style("width", "78%")
                this.menuArea.style("-webkit-animation-name", "none")

                d3.select("#WarningErrorMessagesContainer").style(
                    "width",
                    "78%",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-name",
                    "none",
                )
            } else {
                this.graphArea.style("width", "78%")
                this.graphArea.style(
                    "-webkit-animation-name",
                    "sbCollapseAnimation",
                )
                this.graphArea.style("-webkit-animation-duration", "0.5s")

                this.menuArea.style("width", "78%")
                this.menuArea.style(
                    "-webkit-animation-name",
                    "sbCollapseAnimation",
                )
                this.menuArea.style("-webkit-animation-duration", "0.5s")

                d3.select("#WarningErrorMessagesContainer").style(
                    "width",
                    "78%",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-name",
                    "warn_ExpandRightBarAnimation",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-duration",
                    "0.5s",
                )
            }
            this.graph.options.width =
                window.innerWidth - window.innerWidth * 0.22
            this.graph.options.navigationMenu.updateScrollButtonVisibility()
        } else {
            this.visibleSidebar = false
            this.detailArea.classed("hidden", true)
            this.collapseButton.node().innerHTML = "<"
            // adjust the layout
            if (init) {
                this.graphArea.style("width", "100%")
                this.graphArea.style("-webkit-animation-name", "none")

                this.menuArea.style("width", "100%")
                this.menuArea.style("-webkit-animation-name", "none")

                d3.select("#WarningErrorMessagesContainer").style(
                    "width",
                    "100%",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-name",
                    "none",
                )
            } else {
                this.graphArea.style("width", "100%")
                this.graphArea.style(
                    "-webkit-animation-name",
                    "sbExpandAnimation",
                )
                this.graphArea.style("-webkit-animation-duration", "0.5s")

                this.menuArea.style("width", "100%")
                this.menuArea.style(
                    "-webkit-animation-name",
                    "sbExpandAnimation",
                )
                this.menuArea.style("-webkit-animation-duration", "0.5s")

                d3.select("#WarningErrorMessagesContainer").style(
                    "width",
                    "100%",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-name",
                    "warn_CollapseRightBarAnimation",
                )
                d3.select("#WarningErrorMessagesContainer").style(
                    "-webkit-animation-duration",
                    "0.5s",
                )
            }
            this.graph.options.width = window.innerWidth
            this.graph.updateCanvasContainerSize()
            this.graph.options.navigationMenu.updateScrollButtonVisibility()
        }
    }

    /**
     * @note From WebVOWL v1.1.7: 0 === True, 1 === False
     * @returns {boolean} Returns true if sidebar is hidden. Otherwise, false
     */
    getSidebarVisibility() {
        return this.detailArea.classed("hidden")
    }

    initSideBarAnimation() {
        this.graphArea.node().addEventListener("animationend", () => {
            this.detailArea.classed("hidden", !this.visibleSidebar)
            this.graph.updateCanvasContainerSize()
            this.graph.options.navigationMenu.updateScrollButtonVisibility()
        })
    }

    setup() {
        this.#setupCollapsing()
        this.initSideBarAnimation()

        this.collapseButton.on("click", () => {
            this.graph.options.navigationMenu.hideAllMenus()
            this.showSidebar(this.getSidebarVisibility())
        })
    }

    updateShowedInformation() {
        const editMode = this.graph.editorMode
        d3.select("#generalDetails").classed("hidden", editMode)
        d3.select("#generalDetailsEdit").classed("hidden", !editMode)

        // store the meta information in graph.options

        // todo: update edit meta info
        this.graph.options.editSidebar.updateGeneralOntologyInfo()

        // todo: update showed meta info;
        this.graph.options.sidebar.updateGeneralOntologyInfo()
    }

    updateGeneralOntologyInfo() {
        // get it from graph.options
        const generalMetaObj = this.graph.options.generalOntologyMetaData
        const preferredLanguage =
            this.graph && this.graph.language ? this.graph.language : null
        if (generalMetaObj.hasOwnProperty("title")) {
            // title has language to it -.-
            if (typeof generalMetaObj.title === "object") {
                d3.select("#title").node().value = LanguageTools.textInLanguage(
                    generalMetaObj.title,
                    preferredLanguage,
                )
            } else {
                d3.select("#title").node().innerHTML = generalMetaObj.title
            }
        }
        if (generalMetaObj.hasOwnProperty("iri")) {
            d3.select("#about").node().innerHTML = generalMetaObj.iri
        }
        if (generalMetaObj.hasOwnProperty("iri")) {
            d3.select("#about").node().href = generalMetaObj.iri
        }
        if (generalMetaObj.hasOwnProperty("version")) {
            d3.select("#version").node().innerHTML = generalMetaObj.version
        }
        if (generalMetaObj.hasOwnProperty("author")) {
            d3.select("#authors").node().innerHTML = generalMetaObj.author
        }
        // this could also be an object >>
        if (generalMetaObj.hasOwnProperty("description")) {
            if (typeof generalMetaObj.description === "object") {
                d3.select("#description").node().innerHTML =
                    LanguageTools.textInLanguage(
                        generalMetaObj.description,
                        preferredLanguage,
                    )
            } else {
                d3.select("#description").node().innerHTML =
                    generalMetaObj.description
            }
        }
    }
}
