import BaseElement from "../../webvowl/js/elements/BaseElement"
import RdfsDataType from "../../webvowl/js/elements/nodes/implementations/RdfsDatatype"
import BaseProperty from "../../webvowl/js/elements/properties/BaseProperty"
import Graph from "../../webvowl/js/graph"
import ElementTools from "../../webvowl/js/util/elementTools"
import LanguageTools from "../../webvowl/js/util/languageTools"
import PrefixTools from "../../webvowl/js/util/prefixTools"

export default class EditSidebar {
    /**
     * Contains the logic for the sidebar.
     * @param {Graph} graph the graph that belongs to these controls
     */
    constructor(graph) {
        this.graph = graph
        this.selectedElementForCharacteristics = undefined
        /**
         * @type {string | undefined}
         */
        this.oldPrefix = undefined
        /**
         * @type {string | undefined}
         */
        this.oldPrefixURL = undefined
        this.prefix_editMode = false
        this.supportedDatatypes = [
            "undefined",
            "xsd:boolean",
            "xsd:double",
            "xsd:integer",
            "xsd:string",
        ]
    }

    clearMetaObjectValue() {
        d3.select("#titleEditor").node().value = ""
        d3.select("#iriEditor").node().value = ""
        d3.select("#versionEditor").node().value = ""
        d3.select("#authorsEditor").node().value = ""
        d3.select("#descriptionEditor").node().value = ""
        // todo add clear description;
    }

    updatePrefixUi() {
        this.updateElementWidth()
        const prefixListContainer = d3.select("#prefixURL_Container")
        while (prefixListContainer.node().firstChild) {
            prefixListContainer
                .node()
                .removeChild(prefixListContainer.node().firstChild)
        }
        this.#setupPrefixList()
    }

    setup() {
        this.#setupCollapsing()
        this.#setupPrefixList()
        this.#setupAddPrefixButton()
        this.#setupSupportedDatatypes()

        d3.select("#titleEditor")
            .on("change", () => {
                this.graph.options.addOrUpdateGeneralObjectEntry(
                    "title",
                    d3.select("#titleEditor").node().value,
                )
            })
            .on("keydown", () => {
                d3.event.stopPropagation()
                if (d3.event.keyCode === 13) {
                    d3.event.preventDefault()
                    this.graph.options.addOrUpdateGeneralObjectEntry(
                        "title",
                        d3.select("#titleEditor").node().value,
                    )
                }
            })
        d3.select("#iriEditor")
            .on("change", () => {
                if (
                    !this.graph.options.addOrUpdateGeneralObjectEntry(
                        "iri",
                        d3.select("#iriEditor").node().value,
                    )
                ) {
                    // restore value
                    d3.select("#iriEditor").node().value =
                        this.graph.options.getGeneralMetaObjectProperty("iri")
                }
            })
            .on("keydown", () => {
                d3.event.stopPropagation()
                if (d3.event.keyCode === 13) {
                    d3.event.preventDefault()
                    if (
                        !this.graph.options.addOrUpdateGeneralObjectEntry(
                            "iri",
                            d3.select("#iriEditor").node().value,
                        )
                    ) {
                        // restore value
                        d3.select("#iriEditor").node().value =
                            this.graph.options.getGeneralMetaObjectProperty(
                                "iri",
                            )
                    }
                }
            })
        d3.select("#versionEditor")
            .on("change", () => {
                this.graph.options.addOrUpdateGeneralObjectEntry(
                    "version",
                    d3.select("#versionEditor").node().value,
                )
            })
            .on("keydown", () => {
                d3.event.stopPropagation()
                if (d3.event.keyCode === 13) {
                    d3.event.preventDefault()
                    this.graph.options.addOrUpdateGeneralObjectEntry(
                        "version",
                        d3.select("#versionEditor").node().value,
                    )
                }
            })
        d3.select("#authorsEditor")
            .on("change", () => {
                this.graph.options.addOrUpdateGeneralObjectEntry(
                    "author",
                    d3.select("#authorsEditor").node().value,
                )
            })
            .on("keydown", () => {
                d3.event.stopPropagation()
                if (d3.event.keyCode === 13) {
                    d3.event.preventDefault()
                    this.graph.options.addOrUpdateGeneralObjectEntry(
                        "author",
                        d3.select("#authorsEditor").node().value,
                    )
                }
            })
        d3.select("#descriptionEditor").on("change", () => {
            this.graph.options.addOrUpdateGeneralObjectEntry(
                "description",
                d3.select("#descriptionEditor").node().value,
            )
        })
        this.updateElementWidth()
    }

    /**
     * @param {string} oldPrefix
     * @param {string} newPrefix
     */
    updateEditDeleteButtonIds(oldPrefix, newPrefix) {
        d3.select("#prefixInputFor_" + oldPrefix).node().id =
            "prefixInputFor_" + newPrefix
        d3.select("#prefixURLFor_" + oldPrefix).node().id =
            "prefixURLFor_" + newPrefix
        d3.select("#deleteButtonFor_" + oldPrefix).node().id =
            "deleteButtonFor_" + newPrefix
        d3.select("#editButtonFor_" + oldPrefix).node().id =
            "editButtonFor_" + newPrefix
        d3.select("#prefixContainerFor_" + oldPrefix).node().id =
            "prefixContainerFor_" + newPrefix
    }

    // NOTE: Disabled to save memory while this method is not used
    // /**
    //  * @param {string} url
    //  */
    // checkForExistingURL(url) {
    //     for (const property of this.graph.UnfilteredData.properties) {
    //         if (property.iri === url) {
    //             return true
    //         }
    //     }
    //     return false;
    // }

    /**
     * @param {BaseElement | BaseProperty} element
     * @param {string} url
     */
    checkProperIriChange(element, url) {
        console.log("Element changed Label")
        console.log("Testing URL " + url)
        if (
            element.type === "rdfs:subClassOf" ||
            element.type === "owl:disjointWith"
        ) {
            console.log(
                "ignore this for now, already handled in the type and domain range changer",
            )
        } else {
            for (const property of this.graph.unfilteredData.properties) {
                if (property === element) {
                    continue
                }
                if (property.iri === url) {
                    return property
                }
            }
        }
        return false
    }

    /**
     * @param {BaseElement} element
     */
    updateSelectionInformation(element) {
        if (element === undefined) {
            // show hint;
            d3.select("#selectedElementProperties").classed("hidden", true)
            d3.select("#selectedElementPropertiesEmptyHint").classed(
                "hidden",
                false,
            )
            this.selectedElementForCharacteristics = undefined
            this.updateElementWidth()
        } else {
            const _this = this
            d3.select("#selectedElementProperties").classed("hidden", false)
            d3.select("#selectedElementPropertiesEmptyHint").classed(
                "hidden",
                true,
            )
            d3.select("#typeEditForm_datatype").classed("hidden", true)

            // set the element IRI, and labels
            d3.select("#element_iriEditor").node().value = element.iri
            d3.select("#element_labelEditor").node().value =
                element.labelForCurrentLanguage()
            d3.select("#element_iriEditor").node().title = element.iri

            d3.select("#element_iriEditor")
                .on("change", () => {
                    const prefixed =
                        PrefixTools.getPrefixRepresentationForFullURI(
                            element.iri,
                            this.graph,
                        )
                    if (
                        prefixed ===
                        d3.select("#element_iriEditor").node().value
                    ) {
                        console.log("Iri is identical, nothing has changed!")
                        return
                    }
                    this.#changeIriForElement(element)
                })
                .on("keydown", () => {
                    d3.event.stopPropagation()
                    if (d3.event.keyCode === 13) {
                        d3.event.preventDefault()
                        console.log("IRI CHANGED Via ENTER pressed")
                        this.#changeIriForElement(element)
                        d3.select("#element_iriEditor").node().title =
                            element.iri
                    }
                })

            const forceIRISync = this.#defaultIriValue(element)
            d3.select("#element_labelEditor")
                .on("change", () => {
                    this.#elementChangedLabelUpdate(element)
                })
                .on("keydown", () => {
                    d3.event.stopPropagation()
                    if (d3.event.keyCode === 13) {
                        d3.event.preventDefault()
                        this.#elementChangedLabel(element)
                    }
                })
                .on("keyup", function () {
                    if (forceIRISync) {
                        const labelName = d3
                            .select("#element_labelEditor")
                            .node().value
                        const resourceName = labelName.replaceAll(" ", "_")
                        const syncedIRI = element.baseIri + resourceName

                        //element.iri=syncedIRI;
                        d3.select("#element_iriEditor").node().title =
                            element.iri
                        d3.select("#element_iriEditor").node().value =
                            PrefixTools.getPrefixRepresentationForFullURI(
                                syncedIRI,
                                _this.graph,
                            )
                    }
                })
            // check if we are allowed to change IRI OR LABEL
            d3.select("#element_iriEditor").node().disabled = false
            d3.select("#element_labelEditor").node().disabled = false

            if (element.type === "rdfs:subClassOf") {
                d3.select("#element_iriEditor").node().value =
                    "http://www.w3.org/2000/01/rdf-schema#subClassOf"
                d3.select("#element_iriEditor").node().title =
                    "http://www.w3.org/2000/01/rdf-schema#subClassOf"
                d3.select("#element_labelEditor").node().value = "Subclass of"
                d3.select("#element_iriEditor").node().disabled = true
                d3.select("#element_labelEditor").node().disabled = true
            }
            if (element.type === "owl:Thing") {
                d3.select("#element_iriEditor").node().value =
                    "http://www.w3.org/2002/07/owl#Thing"
                d3.select("#element_iriEditor").node().title =
                    "http://www.w3.org/2002/07/owl#Thing"
                d3.select("#element_labelEditor").node().value = "Thing"
                d3.select("#element_iriEditor").node().disabled = true
                d3.select("#element_labelEditor").node().disabled = true
            }

            if (element.type === "owl:disjointWith") {
                d3.select("#element_iriEditor").node().value =
                    "http://www.w3.org/2002/07/owl#disjointWith"
                d3.select("#element_iriEditor").node().title =
                    "http://www.w3.org/2002/07/owl#disjointWith"
                d3.select("#element_iriEditor").node().disabled = true
                d3.select("#element_labelEditor").node().disabled = true
            }

            if (element.type === "rdfs:Literal") {
                d3.select("#element_iriEditor").node().value =
                    "http://www.w3.org/2000/01/rdf-schema#Literal"
                d3.select("#element_iriEditor").node().title =
                    "http://www.w3.org/2000/01/rdf-schema#Literal"
                d3.select("#element_iriEditor").node().disabled = true
                d3.select("#element_labelEditor").node().disabled = true
                element.iri = "http://www.w3.org/2000/01/rdf-schema#Literal"
            }
            if (element.type === "rdfs:Datatype") {
                d3.select("#typeEditForm_datatype").classed("hidden", false)
                element.iri = "http://www.w3.org/2000/01/rdf-schema#Datatype"
                d3.select("#element_iriEditor").node().value =
                    "http://www.w3.org/2000/01/rdf-schema#Datatype"
                d3.select("#element_iriEditor").node().title =
                    "http://www.w3.org/2000/01/rdf-schema#Datatype"
                d3.select("#element_iriEditor").node().disabled = true
                d3.select("#element_labelEditor").node().disabled = true

                const datatypeEditorSelection = d3.select(
                    "#typeEditor_datatype",
                )
                datatypeEditorSelection.node().value = element.dType
                if (datatypeEditorSelection.node().value === "undefined") {
                    d3.select("#element_iriEditor").node().disabled = true // always prevent IRI modifications
                    d3.select("#element_labelEditor").node().disabled = false
                }
                // reconnect the element
                datatypeEditorSelection.on("change", () => {
                    this.#changeDatatypeType(element)
                })
            }

            // add type selector
            const typeEditorSelection = d3.select("#typeEditor").node()
            const htmlCollection = typeEditorSelection.children
            const numEntries = htmlCollection.length
            for (let i = 0; i < numEntries; i++) {
                typeEditorSelection.removeChild(htmlCollection[0])
            }

            for (const elementPrototype of this.#getElementPrototypes(
                element,
            )) {
                const optA = document.createElement("option")
                optA.innerHTML = elementPrototype
                typeEditorSelection.appendChild(optA)
            }

            // set the proper value in the selection
            typeEditorSelection.value = element.type
            d3.select("#typeEditor").on("change", () => {
                this.#elementTypeSelectionChanged(element)
            })

            // add characteristics selection
            const needChar = this.#elementNeedsCharacteristics(element)
            d3.select("#property_characteristics_Container").classed(
                "hidden",
                !needChar,
            )
            if (needChar === true) {
                this.#addElementsCharacteristics(element)
            }
            const fullURI = d3.select("#element_iriEditor").node().value
            d3.select("#element_iriEditor").node().value =
                PrefixTools.getPrefixRepresentationForFullURI(
                    fullURI,
                    this.graph,
                )
            d3.select("#element_iriEditor").node().title = fullURI
            this.updateElementWidth()
        }
    }

    updateGeneralOntologyInfo() {
        const preferredLanguage =
            this.graph && this.graph.language ? this.graph.language : null

        // get it from graph.options
        const generalMetaObj = this.graph.options.generalOntologyMetaData
        if (generalMetaObj.hasOwnProperty("title")) {
            // title has language to it -.-
            if (typeof generalMetaObj.title === "object") {
                d3.select("#titleEditor").node().value =
                    LanguageTools.textInLanguage(
                        generalMetaObj.title,
                        preferredLanguage,
                    )
            } else {
                d3.select("#titleEditor").node().value = generalMetaObj.title
            }
        }
        if (generalMetaObj.hasOwnProperty("iri")) {
            d3.select("#iriEditor").node().value = generalMetaObj.iri
        }
        if (generalMetaObj.hasOwnProperty("version")) {
            d3.select("#versionEditor").node().value = generalMetaObj.version
        }
        if (generalMetaObj.hasOwnProperty("author")) {
            d3.select("#authorsEditor").node().value = generalMetaObj.author
        }

        if (generalMetaObj.hasOwnProperty("description")) {
            if (typeof generalMetaObj.description === "object") {
                d3.select("#descriptionEditor").node().value =
                    LanguageTools.textInLanguage(
                        generalMetaObj.description,
                        preferredLanguage,
                    )
            } else {
                d3.select("#descriptionEditor").node().value =
                    generalMetaObj.description
            }
        } else {
            d3.select("#descriptionEditor").node().value = "No Description"
        }
    }

    updateElementWidth() {
        const height = window.innerHeight - 40
        const lsb_offset =
            d3.select("#logo").node().getBoundingClientRect().height + 5
        const lsb_height = height - lsb_offset
        d3.select("#containerForLeftSideBar").style("top", lsb_offset + "px")
        d3.select("#leftSideBarCollapseButton").style("top", lsb_offset + "px")
        d3.select("#containerForLeftSideBar").style("height", lsb_height + "px")

        const div_width =
            10 +
            d3.select("#generalDetailsEdit").node().getBoundingClientRect()
                .labelWidth

        const title_labelWidth =
            d3.select("#titleEditor-label").node().getBoundingClientRect()
                .labelWidth + 20
        const iri_labelWidth =
            d3.select("#iriEditor-label").node().getBoundingClientRect()
                .labelWidth + 20
        const version_labelWidth =
            d3.select("#versionEditor-label").node().getBoundingClientRect()
                .labelWidth + 20
        const author_labelWidth =
            d3.select("#authorsEditor-label").node().getBoundingClientRect()
                .labelWidth + 20

        //find max width;
        const metaMaxWidth = Math.max(
            0,
            title_labelWidth,
            iri_labelWidth,
            version_labelWidth,
            author_labelWidth,
        )
        const meta_inputWidth = div_width - metaMaxWidth - 10

        d3.select("#titleEditor").style("width", meta_inputWidth + "px")
        d3.select("#iriEditor").style("width", meta_inputWidth + "px")
        d3.select("#versionEditor").style("width", meta_inputWidth + "px")
        d3.select("#authorsEditor").style("width", meta_inputWidth + "px")

        const elementIri_width =
            d3.select("#element_iriEditor-label").node().getBoundingClientRect()
                .labelWidth + 20
        const elementLabel_width =
            d3
                .select("#element_labelEditor-label")
                .node()
                .getBoundingClientRect().labelWidth + 20
        const elementType_width =
            d3.select("#typeEditor-label").node().getBoundingClientRect()
                .labelWidth + 20
        const elementDType_width =
            d3
                .select("#typeEditor_datatype-label")
                .node()
                .getBoundingClientRect().labelWidth + 20

        const selectedElementMaxWidth = Math.max(
            0,
            elementIri_width,
            elementLabel_width,
            elementType_width,
            elementDType_width,
        )
        const selectedElement_inputWidth =
            div_width - selectedElementMaxWidth - 10

        d3.select("#element_iriEditor").style(
            "width",
            selectedElement_inputWidth + "px",
        )
        d3.select("#element_labelEditor").style(
            "width",
            selectedElement_inputWidth + "px",
        )
        d3.select("#typeEditor").style(
            "width",
            selectedElement_inputWidth + 4 + "px",
        )
        d3.select("#typeEditor_datatype").style(
            "width",
            selectedElement_inputWidth + 4 + "px",
        )

        // update prefix Element width;
        const containerWidth = d3
            .select("#containerForPrefixURL")
            .node()
            .getBoundingClientRect().labelWidth
        if (containerWidth !== 0) {
            const inputs = d3.selectAll(".prefixInput")
            if (inputs.node()) {
                const prefixWidth = d3
                    .selectAll(".prefixInput")
                    .node()
                    .getBoundingClientRect().labelWidth
                d3.selectAll(".prefixURL").style(
                    "width",
                    containerWidth - prefixWidth - 45 + "px",
                )
            }
        }
    }

    /**
     * @param {BaseElement} element
     */
    #elementChangedLabel(element) {
        console.log("Element changed Label")
        const url = this.#getURLFROMPrefixedVersion(element)
        if (element.iri !== url) {
            if (ElementTools.isProperty(element)) {
                const sanityCheckResult = this.checkProperIriChange(
                    element,
                    url,
                )
                if (sanityCheckResult !== false) {
                    this.graph.options.warningModule.showWarning(
                        "Already seen this property",
                        "Input IRI: " +
                            url +
                            " for element: " +
                            element.labelForCurrentLanguage() +
                            " already been set",
                        "Continuing with duplicate property!",
                        1,
                        element,
                    )
                    this.updateSelectionInformation(element)
                    return
                }
            }
            if (ElementTools.isNode(element)) {
                const sanityCheckResult =
                    this.graph.checkIfIriClassAlreadyExist(url)
                if (sanityCheckResult !== false) {
                    this.graph.options.warningModule.showWarning(
                        "Already seen this Class",
                        "Input IRI: " +
                            url +
                            " for element: " +
                            element.labelForCurrentLanguage() +
                            " already been set",
                        "Restoring previous IRI for Element : " + element.iri,
                        2,
                        element,
                    )
                    this.updateSelectionInformation(element)
                    return
                }
            }
            element.iri = url
        }
        this.#changeLabelForElement(element)
    }

    /**
     * @param {BaseElement} element
     */
    #elementChangedLabelUpdate(element) {
        this.#elementChangedLabel(element)
        this.updateSelectionInformation(element) // prevents that it will be changed if node is still active
    }

    #setupSupportedDatatypes() {
        const datatypeEditorSelection = d3.select("#typeEditor_datatype").node()
        for (const dataType of this.supportedDatatypes) {
            const optB = document.createElement("option")
            optB.innerHTML = dataType
            datatypeEditorSelection.appendChild(optB)
        }
    }

    /**
     * @param {boolean} enable
     * @param {string} name
     */
    #highlightDeleteButton(enable, name) {
        const deletePath = d3.select("#del_pathFor_" + name)
        const deleteRect = d3.select("#del_rectFor_" + name)

        if (!enable) {
            deletePath.node().style = "stroke: #f00;"
            deleteRect.style("cursor", "auto")
        } else {
            deletePath.node().style = "stroke: #ff972d;"
            deleteRect.style("cursor", "pointer")
        }
    }

    /**
     * @param {boolean} enable
     * @param {string} name
     * @param {boolean} fill
     */
    #highlightEditButton(enable, name, fill) {
        const editPath = d3.select("#pathFor_" + name)
        const editRect = d3.select("#rectFor_" + name)

        if (!enable) {
            if (fill) {
                editPath.node().style =
                    "fill: #fff; stroke : #fff; stroke-width : 1px"
            } else {
                editPath.node().style = " stroke : #fff; stroke-width : 1px"
            }
            editRect.style("cursor", "auto")
        } else {
            if (fill) {
                editPath.node().style =
                    "fill: #ff972d; stroke : #ff972d; stroke-width : 1px"
            } else {
                editPath.node().style = "stroke : #ff972d; stroke-width : 1px"
            }
            editRect.style("cursor", "pointer")
        }
    }

    #setupAddPrefixButton() {
        const _this = this
        const btn = d3.select("#addPrefixButton")
        btn.on("click", function () {
            // check if we are still in editMode
            if (!_this.prefix_editMode) {
                // create new line entry;
                const name = "emptyPrefixEntry"
                const prefixListContainer = d3.select("#prefixURL_Container")
                const prefixEditContainer = prefixListContainer.append("div")
                prefixEditContainer.classed("prefixIRIElements", true)
                prefixEditContainer.node().id = "prefixContainerFor_" + name

                const IconContainer = prefixEditContainer.append("div")
                IconContainer.style("position", "absolute")
                IconContainer.node().id = "containerFor_" + name
                const editButton = IconContainer.append("svg")
                editButton.style("width", "14px")
                editButton.style("height", "20px")
                // editButton.classed("editPrefixButton", true);
                editButton.classed("noselect", true)
                // editButton.node().innerHTML = "\u2714";
                editButton.node().id = "editButtonFor_" + name

                editButton.node().elementStyle = "save"
                editButton.node().selectorName = name
                const editIcon = editButton.append("g")
                const editRect = editIcon.append("rect")
                const editPath = editIcon.append("path")
                editIcon.node().id = "iconFor_" + name
                editPath.node().id = "pathFor_" + name
                editRect.node().id = "rectFor_" + name

                editIcon.node().selectorName = name
                editPath.node().selectorName = name
                editRect.node().selectorName = name
                IconContainer.node().title = "Save new prefix and IRI"

                editPath.classed("editPrefixIcon")
                editPath.style("stroke", "#fff")
                editPath.style("stroke-width", "1px")
                editPath.style("fill", "#fff")
                editRect.attr("width", "14px")
                editRect.attr("height", "14px")
                editRect.style("fill", "#18202A")
                editRect.attr("transform", "matrix(1,0,0,1,-3,4)")

                editButton.selectAll("g").on("mouseover", function () {
                    _this.#highlightEditButton(true, this.selectorName, true)
                })
                editButton.selectAll("g").on("mouseout", function () {
                    _this.#highlightEditButton(false, this.selectorName, true)
                })
                // Check mark
                // M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z
                // pencil
                // M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z
                editPath.attr(
                    "d",
                    "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
                )
                editPath.attr("transform", "matrix(0.45,0,0,0.45,0,5)")

                const prefInput = prefixEditContainer.append("input")
                prefInput.classed("prefixInput", true)
                prefInput.node().type = "text"
                prefInput.node().id = "prefixInputFor_" + name
                prefInput.node().autocomplete = "off"
                prefInput.node().value = ""
                prefInput.style("margin-left", "14px")

                const prefURL = prefixEditContainer.append("input")
                prefURL.classed("prefixURL", true)
                prefURL.node().type = "text"
                prefURL.node().id = "prefixURLFor_" + name
                prefURL.node().autocomplete = "off"
                prefURL.node().value = ""

                prefInput.node().disabled = false
                prefURL.node().disabled = false
                _this.prefix_editMode = true
                const deleteContainer = prefixEditContainer.append("div")
                deleteContainer.style("float", "right")
                const deleteButton = deleteContainer.append("svg")
                deleteButton.node().id = "deleteButtonFor_" + name
                deleteContainer.node().title = "Delete prefix and IRI"
                deleteButton.style("width", "10px")
                deleteButton.style("height", "20px")
                const deleteIcon = deleteButton.append("g")
                const deleteRect = deleteIcon.append("rect")
                const deletePath = deleteIcon.append("path")
                deleteIcon.node().id = "del_iconFor_" + name
                deletePath.node().id = "del_pathFor_" + name
                deleteRect.node().id = "del_rectFor_" + name

                deleteIcon.node().selectorName = name
                deletePath.node().selectorName = name
                deleteRect.node().selectorName = name

                deletePath.style("stroke", "#f00")
                deleteRect.attr("width", "10px")
                deleteRect.attr("height", "14px")
                deleteRect.style("fill", "#18202A")
                deleteRect.attr("transform", "matrix(1,0,0,1,-3,4)")

                deletePath.attr(
                    "d",
                    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
                )
                deletePath.attr("transform", "matrix(0.45,0,0,0.45,0,5)")

                deleteButton.selectAll("g").on("mouseover", function () {
                    _this.#highlightDeleteButton(true, this.selectorName)
                })
                deleteButton.selectAll("g").on("mouseout", function () {
                    _this.#highlightDeleteButton(false, this.selectorName)
                })

                // connect the buttons;
                editButton.on("click", _this.#enablePrefixEdit)
                deleteButton.on("click", _this.#deletePrefixLine)

                _this.updateElementWidth()
                // swap focus to prefixInput
                prefInput.node().focus()
                _this.oldPrefix = name
                _this.oldPrefixURL = ""
                d3.select("#addPrefixButton").node().innerHTML = "Save Prefix"
            } else {
                d3.select("#editButtonFor_emptyPrefixEntry").on("click")(
                    d3.select("#editButtonFor_emptyPrefixEntry").node(),
                )
            }
        })
    }

    #setupPrefixList() {
        if (!this.graph.isEditorMode) {
            return
        }
        const prefixListContainer = d3.select("#prefixURL_Container")
        const prefixElements = this.graph.options.prefixList

        /**
         * @param {any} sender
         * @param {boolean} fill
         * @param {boolean} enable
         */
        function setEnabledEditPath(sender, fill, enable) {
            const f_editPath = d3.select("#pathFor_" + sender.selectorName)
            const f_editRect = d3.select("#rectFor_" + sender.selectorName)

            if (!enable) {
                if (fill) {
                    f_editPath.node().style =
                        "fill: #fff; stroke : #fff; stroke-width : 1px"
                } else {
                    f_editPath.node().style =
                        " stroke : #fff; stroke-width : 1px"
                }
                f_editRect.style("cursor", "auto")
            } else {
                if (fill)
                    f_editPath.node().style =
                        "fill: #ff972d; stroke : #ff972d; stroke-width : 1px"
                else
                    f_editPath.node().style =
                        "stroke : #ff972d; stroke-width : 1px"
                f_editRect.style("cursor", "pointer")
            }
        }

        /**
         * @param {any} sender
         * @param {boolean} enable
         */
        function setEnabledDeletePath(sender, enable) {
            const f_deletePath = d3.select(
                "#del_pathFor_" + sender.selectorName,
            )
            const f_deleteRect = d3.select(
                "#del_rectFor_" + sender.selectorName,
            )

            if (!enable) {
                f_deletePath.node().style = "stroke: #f00;"
                f_deleteRect.style("cursor", "auto")
            } else {
                f_deletePath.node().style = "stroke: #ff972d;"
                f_deleteRect.style("cursor", "pointer")
            }
        }

        for (const name in prefixElements) {
            if (prefixElements.hasOwnProperty(name)) {
                const prefixEditContainer = prefixListContainer.append("div")
                prefixEditContainer.classed("prefixIRIElements", true)
                prefixEditContainer.node().id = "prefixContainerFor_" + name

                // create edit button which enables the input fields
                const IconContainer = prefixEditContainer.append("div")
                IconContainer.style("position", "absolute")
                IconContainer.node().id = "containerFor_" + name
                const editButton = IconContainer.append("svg")
                editButton.style("width", "14px")
                editButton.style("height", "20px")
                editButton.classed("noselect", true)
                editButton.node().id = "editButtonFor_" + name
                IconContainer.node().title = "Edit prefix and IRI"
                editButton.node().elementStyle = "save"
                editButton.node().selectorName = name

                editButton.node().id = "editButtonFor_" + name
                editButton.node().elementStyle = "edit"
                const editIcon = editButton.append("g")
                const editRect = editIcon.append("rect")
                const editPath = editIcon.append("path")
                editIcon.node().id = "iconFor_" + name
                editPath.node().id = "pathFor_" + name
                editRect.node().id = "rectFor_" + name

                editIcon.node().selectorName = name
                editPath.node().selectorName = name
                editRect.node().selectorName = name

                editPath.classed("editPrefixIcon")
                editPath.style("stroke", "#fff")
                editPath.style("stroke-width", "1px")
                editRect.attr("width", "14px")
                editRect.attr("height", "14px")
                editRect.style("fill", "#18202A")
                editRect.attr("transform", "matrix(1,0,0,1,-3,4)")
                editButton.selectAll("g").on("mouseover", function () {
                    setEnabledEditPath(this, false, true)
                })
                editButton.selectAll("g").on("mouseout", function () {
                    setEnabledEditPath(this, false, true)
                })

                editPath.attr(
                    "d",
                    "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
                )
                editPath.attr("transform", "matrix(-0.45,0,0,0.45,10,5)")

                // create input field for prefix
                const prefInput = prefixEditContainer.append("input")
                prefInput.classed("prefixInput", true)
                prefInput.node().type = "text"
                prefInput.node().id = "prefixInputFor_" + name
                prefInput.node().autocomplete = "off"
                prefInput.node().value = name
                prefInput.style("margin-left", "14px")

                // create input field for prefix url
                const prefURL = prefixEditContainer.append("input")
                prefURL.classed("prefixURL", true)
                prefURL.node().type = "text"
                prefURL.node().id = "prefixURLFor_" + name
                prefURL.node().autocomplete = "off"
                prefURL.node().value = prefixElements[name]
                prefURL.node().title = prefixElements[name]
                // disable the input fields (already defined elements can be edited later)
                prefInput.node().disabled = true
                prefURL.node().disabled = true

                // create the delete button
                const deleteContainer = prefixEditContainer.append("div")
                deleteContainer.style("float", "right")
                const deleteButton = deleteContainer.append("svg")
                deleteButton.node().id = "deleteButtonFor_" + name
                deleteContainer.node().title = "Delete prefix and IRI"
                deleteButton.style("width", "10px")
                deleteButton.style("height", "20px")
                const deleteIcon = deleteButton.append("g")
                const deleteRect = deleteIcon.append("rect")
                const deletePath = deleteIcon.append("path")
                deleteIcon.node().id = "del_iconFor_" + name
                deletePath.node().id = "del_pathFor_" + name
                deleteRect.node().id = "del_rectFor_" + name

                deleteIcon.node().selectorName = name
                deletePath.node().selectorName = name
                deleteRect.node().selectorName = name

                deletePath.style("stroke", "#f00")
                deleteRect.attr("width", "10px")
                deleteRect.attr("height", "14px")
                deleteRect.style("fill", "#18202A")
                deleteRect.attr("transform", "matrix(1,0,0,1,-3,4)")

                deletePath.attr(
                    "d",
                    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
                )
                deletePath.attr("transform", "matrix(0.45,0,0,0.45,0,5)")

                deleteButton.selectAll("g").on("mouseover", function () {
                    setEnabledDeletePath(this, true)
                })
                deleteButton.selectAll("g").on("mouseout", function () {
                    setEnabledDeletePath(this, false)
                })
                editButton.on("click", this.#enablePrefixEdit)
                deleteButton.on("click", this.#deletePrefixLine)

                // EXPERIMENTAL
                if (
                    name === "rdf" ||
                    name === "rdfs" ||
                    name === "xsd" ||
                    name === "dc" ||
                    name === "owl"
                ) {
                    // make them invis so the spacing does not change
                    IconContainer.classed("hidden", true)
                    deleteContainer.classed("hidden", true)
                }
            }
        }
    }

    /**
     * @param {any} item
     */
    #deletePrefixLine(item) {
        if (item.disabled) {
            return
        }
        d3.select("#addPrefixButton").node().innerHTML = "Add Prefix"
        const selector = item.id.split("_")[1]
        d3.select("#prefixContainerFor_" + selector).remove()
        this.graph.options.removePrefix(selector)
        this.prefix_editMode = false // <<TODO make some sanity checks
    }

    /**
     * @param {any} item
     */
    #enablePrefixEdit(item) {
        if (item.disabled) {
            return
        }
        const selector = item.id.split("_")[1]
        const stl = item.elementStyle
        if (stl === "edit") {
            d3.select("#prefixInputFor_" + selector).node().disabled = false
            d3.select("#prefixURLFor_" + selector).node().disabled = false
            // change the button content
            //  this.innerHTML = "\u2714";
            item.elementStyle = "save"
            this.oldPrefix = d3
                .select("#prefixInputFor_" + selector)
                .node().value
            this.oldPrefixURL = d3
                .select("#prefixURLFor_" + selector)
                .node().value
            this.prefix_editMode = true
            if (d3.select("#containerFor_" + selector).node()) {
                d3.select("#containerFor_" + selector).node().title =
                    "Save new prefix and IRI"
            }
            const editButton = d3.select(item)
            editButton.selectAll("g").on("mouseover", () => {
                this.#highlightEditButton(true, item.selectorName, true)
            })
            editButton.selectAll("g").on("mouseout", () => {
                this.#highlightEditButton(false, item.selectorName, true)
            })
            const editPath = d3.select("#pathFor_" + item.selectorName)
            editPath.attr(
                "d",
                "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
            )
            editPath.attr("transform", "matrix(0.45,0,0,0.45,0,5)")
            this.#highlightEditButton(true, item.selectorName, true)
        }

        if (stl === "save") {
            const newPrefixURL = d3
                .select("#prefixURLFor_" + selector)
                .node().value
            const newPrefix = d3
                .select("#prefixInputFor_" + selector)
                .node().value
            if (
                this.graph.options.updatePrefix(
                    this.oldPrefix,
                    newPrefix,
                    this.oldPrefixURL,
                    newPrefixURL,
                )
            ) {
                d3.select("#prefixInputFor_" + newPrefix).node().disabled = true
                d3.select("#prefixURLFor_" + newPrefix).node().disabled = true
                d3.select("#addPrefixButton").node().innerHTML = "Add Prefix"
                if (d3.select("#containerFor_" + selector).node()) {
                    d3.select("#containerFor_" + selector).node().title =
                        "Edit prefix and IRI"
                }
                // change the button content
                item.elementStyle = "edit"
                this.prefix_editMode = false
                const saveButton = d3.select(item)
                saveButton.selectAll("g").on("mouseover", () => {
                    this.#highlightEditButton(true, item.selectorName, false)
                })
                saveButton.selectAll("g").on("mouseout", () => {
                    this.#highlightEditButton(false, item.selectorName, false)
                })
                const savePath = d3.select("#pathFor_" + item.selectorName)
                savePath.attr(
                    "d",
                    "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
                )
                savePath.attr("transform", "matrix(-0.45,0,0,0.45,10,5)")
                this.#highlightEditButton(true, item.selectorName, false)
            }
        }
    }

    /**
     * @param {RdfsDataType} element
     */
    #changeDatatypeType(element) {
        const datatypeEditorSelection = d3.select("#typeEditor_datatype").node()
        const givenName = datatypeEditorSelection.value
        let identifier = givenName.split(":")[1]

        if (datatypeEditorSelection.value !== "undefined") {
            d3.select("#element_iriEditor").node().disabled = true
            d3.select("#element_labelEditor").node().disabled = true
        } else {
            identifier = "undefined"
            d3.select("#element_iriEditor").node().disabled = false
            d3.select("#element_labelEditor").node().disabled = false
        }
        element.label = identifier
        element.dType = givenName
        element.iri = "http://www.w3.org/2001/XMLSchema#" + identifier
        element.baseIri = "http://www.w3.org/2001/XMLSchema#"
        element.redrawLabelText()

        d3.select("#element_iriEditor").node().value =
            PrefixTools.getPrefixRepresentationForFullURI(
                element.iri,
                this.graph,
            )
        d3.select("#element_iriEditor").node().title = element.iri
        d3.select("#element_labelEditor").node().value =
            element.labelForCurrentLanguage()
    }

    /**
     * @param {string} ontoIRI
     * @param {string[]} elementIRI
     */
    #identifyExternalCharacteristicForElement(ontoIRI, elementIRI) {
        return elementIRI.indexOf(ontoIRI) === -1
    }

    /**
     * @param {BaseElement} element
     */
    #defaultIriValue(element) {
        // get the iri of that element;
        if (this.graph.options.generalOntologyMetaData.iri) {
            const str2Compare =
                this.graph.options.generalOntologyMetaData.iri + element.id
            return element.iri === str2Compare
        }
        return false
    }

    /**
     * @param {BaseElement} element
     */
    #getURLFROMPrefixedVersion(element) {
        let url = d3.select("#element_iriEditor").node().value
        const base = this.graph.options.getGeneralMetaObjectProperty("iri")
        if (!PrefixTools.validURL(url)) {
            // make better usability
            // try to split element;
            const tokens = url.split(":")

            //console.log("try to split the input into prefix:name")
            console.log("Tokens")
            console.log(tokens)
            console.log("---------------")
            // TODO MORE VALIDATION TESTS
            if (tokens.length === 2) {
                const pr = tokens[0]
                const name = tokens[1]
                if (pr.length > 0) {
                    const basePref = this.graph.options.prefixList[pr]
                    if (basePref === undefined) {
                        console.log("ERROR __________________")
                        this.graph.options.warningModule.showWarning(
                            "Invalid Element IRI",
                            "Could not resolve prefix '" + basePref + "'",
                            "Restoring previous IRI for Element" + element.iri,
                            1,
                            element,
                        )
                        d3.select("#element_iriEditor").node().value =
                            element.iri
                        return
                    }
                    // check if url is not empty
                    if (name.length === 0) {
                        this.graph.options.warningModule.showWarning(
                            "Invalid Element IRI",
                            "Input IRI is EMPTY",
                            "Restoring previous IRI for Element" + element.iri,
                            1,
                            element,
                        )
                        console.log("NO INPUT PROVIDED")
                        d3.select("#element_iriEditor").node().value =
                            element.iri
                        return
                    }
                    url = basePref + name
                } else {
                    url = base + name
                }
            } else {
                if (url.length === 0) {
                    console.log("NO INPUT PROVIDED")
                    d3.select("#element_iriEditor").node().value = element.iri
                    return
                }
                // failed to identify anything useful
                console.log("Tryig to use the input!")
                url = base + url
            }
        }
        return url
    }

    /**
     * @param {BaseElement} element
     */
    #changeIriForElement(element) {
        const url = this.#getURLFROMPrefixedVersion(element)
        const base = this.graph.options.getGeneralMetaObjectProperty("iri")
        if (ElementTools.isNode(element)) {
            const sanityCheckResult =
                this.graph.checkIfIriClassAlreadyExist(url)
            if (!sanityCheckResult) {
                element.iri = url
            } else {
                this.graph.options.warningModule.showWarning(
                    "Already seen this class",
                    "Input IRI: " +
                        url +
                        " for element: " +
                        element.labelForCurrentLanguage() +
                        " already been set",
                    "Restoring previous IRI for Element : " + element.iri,
                    2,
                    element,
                )
                this.updateSelectionInformation(element)
                return
            }
        }
        if (ElementTools.isProperty(element)) {
            const sanityCheckResult = this.checkProperIriChange(element, url)
            if (sanityCheckResult) {
                this.graph.options.warningModule.showWarning(
                    "Already seen this property",
                    "Input IRI: " +
                        url +
                        " for element: " +
                        element.labelForCurrentLanguage() +
                        " already been set",
                    "Restoring previous IRI for Element : " + element.iri,
                    1,
                    element,
                )
                this.updateSelectionInformation(element)
                return
            }
        }

        // NOTE: Remember to enable method `existingPropertyIRI` in classes `BaseNode` and `BaseProperty` and
        // method `checkForExistingURL` in this class if this code is ever used
        // if (element.existingPropertyIRI(url) === true) {
        //     console.log("I Have seen this Particular URL already " + url);
        //     this.graph.options.warningModule.showWarning(
        //         "Already Seen This one ",
        //         "Input IRI For Element" + element.labelForCurrentLanguage() + " already been set  ",
        //         "Restoring previous IRI for Element" + element.iri,
        //         1,
        //         element
        //     );
        //     d3.select("#element_iriEditor").node().value = this.graph.options.PrefixTools().getPrefixRepresentationForFullURI(element.iri);
        //     this.updateSelectionInformation(element);
        //     return;
        // }

        element.iri = url
        if (this.#identifyExternalCharacteristicForElement(base, url)) {
            this.#addAttribute(element, "external")
            // background color for external element;
            element.backgroundColor = "#36C"
            element.redrawElement()
            element.redrawLabelText()
            // handle visual selection
        } else {
            this.#removeAttribute(element, "external")
            // background color for external element;
            element.backgroundColor = undefined
            element.redrawElement()
            element.redrawLabelText()
        }

        if (element.focused) {
            this.graph.options.focuserModule.handle(element, true) // unfocus
            this.graph.options.focuserModule.handle(element, true) // focus
        }
        // graph.options.focuserModule.handle(undefined);
        d3.select("#element_iriEditor").node().value =
            PrefixTools.getPrefixRepresentationForFullURI(url, this.graph)
        this.updateSelectionInformation(element)
    }

    /**
     * @param {BaseElement} element
     */
    #changeLabelForElement(element) {
        element.label = d3.select("#element_labelEditor").node().value
        element.redrawLabelText()
    }

    /**
     * @param {BaseElement} element
     */
    #addElementsCharacteristics(element) {
        // save selected element for checkbox handler
        this.selectedElementForCharacteristics = element

        // KILL old elements
        const charSelectionNode = d3.select(
            "#property_characteristics_Selection",
        )
        const htmlCollection = charSelectionNode.node().children
        if (htmlCollection) {
            const numEntries = htmlCollection.length
            for (let q = 0; q < numEntries; q++) {
                charSelectionNode.node().removeChild(htmlCollection[0])
            }
        }
        // datatypes kind of ignored by the elementsNeedCharacteristics function
        // so we need to check if we are a node or not
        if (element.attributes.indexOf("external") > -1) {
            // add external span to the div;
            const externalCharSpan = charSelectionNode.append("span")
            externalCharSpan.classed("spanForCharSelection", true)
            externalCharSpan.node().innerHTML = "external"
        }

        /**
         * @param {string} type
         * @param {number} i
         */
        const filterContainerUtil = (type, i) => {
            const filterContainer = charSelectionNode
                .append("div")
                .classed("checkboxContainer", true)
                .style("padding-top", "2px")
            const filterCheckbox = filterContainer
                .append("input")
                .classed("filterCheckbox", true)
                .attr("id", "CharacteristicsCheckbox" + i)
                .attr("type", "checkbox")
                .attr("characteristics", type)
                .property("checked", this.#getPresentAttribute(element, type))
            filterContainer
                .append("label")
                .attr("for", "CharacteristicsCheckbox" + i)
                .text(type)
            filterCheckbox.on("click", this.#handleCheckBoxClick)
        }

        if (ElementTools.isNode(element)) {
            // add the deprecated characteristic;
            const arrayOfNodeChars = ["deprecated"]
            for (let i = 0; i < arrayOfNodeChars.length; i++) {
                filterContainerUtil(arrayOfNodeChars[i], i)
            }
        } else {
            // add the deprecated characteristic;
            let arrayOfPropertyChars = [
                "deprecated",
                "inverse functional",
                "functional",
                "transitive",
            ]
            if (ElementTools.isDatatypeProperty(element) === true) {
                arrayOfPropertyChars = ["deprecated", "functional"]
            }
            for (let i = 0; i < arrayOfPropertyChars.length; i++) {
                filterContainerUtil(arrayOfPropertyChars[i], i)
            }
        }
    }

    /**
     * @param {BaseElement} selectedElement
     * @param {string} element
     */
    #getPresentAttribute(selectedElement, element) {
        return selectedElement.attributes.indexOf(element) >= 0
    }

    /**
     * @param {any} item
     */
    #handleCheckBoxClick(item) {
        const char = item.getAttribute("characteristics")
        if (item.checked) {
            this.#addAttribute(this.selectedElementForCharacteristics, char)
        } else {
            this.#removeAttribute(this.selectedElementForCharacteristics, char)
        }
        // graph.executeColorExternalsModule();
        this.selectedElementForCharacteristics.redrawElement()
        // workaround to have the node still be focused as rendering element
        this.selectedElementForCharacteristics.focused = false
        this.selectedElementForCharacteristics.toggleFocus()
    }

    /**
     * @param {BaseElement} selectedElement
     * @param {string} char
     */
    #addAttribute(selectedElement, char) {
        if (selectedElement.attributes.indexOf(char) === -1) {
            // not found add it
            selectedElement.attributes.push(char)
        }
        // indications string update;
        if (selectedElement.indications.indexOf(char) === -1) {
            selectedElement.indications.push(char)
        }
        // add visual attributes
        if (selectedElement.visualAttributes.indexOf(char) === -1) {
            selectedElement.visualAttributes.push(char)
        }
        if (
            this.#getPresentAttribute(selectedElement, "external") &&
            this.#getPresentAttribute(selectedElement, "deprecated")
        ) {
            let visAttr = selectedElement.visualAttributes
            const visInd = visAttr.indexOf("external")
            if (visInd > -1) {
                visAttr.splice(visInd, 1)
            }
            selectedElement.visualAttributes = visAttr
        }
    }

    /**
     * @param {BaseElement} selectedElement
     * @param {string} element
     */
    #removeAttribute(selectedElement, element) {
        const attr = selectedElement.attributes
        const indications = selectedElement.indications
        const visAttr = selectedElement.visualAttributes
        const attrInd = attr.indexOf(element)
        if (attrInd >= 0) {
            attr.splice(attrInd, 1)
        }
        const indInd = indications.indexOf(element)
        if (indInd > -1) {
            indications.splice(indInd, 1)
        }
        const visInd = visAttr.indexOf(element)
        if (visInd > -1) {
            visAttr.splice(visInd, 1)
        }
        selectedElement.attributes = attr
        selectedElement.indications = indications
        selectedElement.visualAttributes = visAttr
        if (element === "deprecated") {
            // set its to its original Style
            //typeBaseThign
            // todo : fix all different types
            if (selectedElement.type === "owl:Class") {
                selectedElement.styleClass = "class"
            }
            if (selectedElement.type === "owl:DatatypeProperty") {
                selectedElement.styleClass = "datatypeproperty"
            }
            if (selectedElement.type === "owl:ObjectProperty") {
                selectedElement.styleClass = "objectproperty"
            }
            if (selectedElement.type === "owl:disjointWith") {
                selectedElement.styleClass = "disjointwith"
            }
        }
    }

    /**
     * @param {BaseElement} element
     */
    #elementNeedsCharacteristics(element) {
        //TODO: Add more types
        if (
            element.type === "owl:Thing" ||
            element.type === "rdfs:subClassOf" ||
            element.type === "rdfs:Literal" ||
            element.type === "rdfs:Datatype" ||
            element.type === "rdfs:disjointWith"
        ) {
            return false
        }
        // if (element.attributes.indexOf("external")||
        //     element.attributes.indexOf("deprecated"))
        //     return true;
        return true
    }

    /**
     * @param {BaseElement} element
     */
    #elementTypeSelectionChanged(element) {
        if (ElementTools.isNode(element)) {
            if (!this.graph.changeNodeType(element)) {
                //restore old value
                this.updateSelectionInformation(element)
            }
        }
        if (ElementTools.isProperty(element)) {
            if (!this.graph.changePropertyType(element)) {
                //restore old value
                this.updateSelectionInformation(element)
            }
        }
    }

    /**
     * @param {BaseElement} selectedElement
     */
    #getElementPrototypes(selectedElement) {
        let availablePrototypes = []
        // TODO the text should be also complied with the prefixes loaded into the ontology
        if (ElementTools.isProperty(selectedElement)) {
            if (selectedElement.type === "owl:DatatypeProperty") {
                availablePrototypes.push("owl:DatatypeProperty")
            } else {
                availablePrototypes.push("owl:ObjectProperty")
                // handling loops !
                if (selectedElement.domain !== selectedElement.range) {
                    availablePrototypes.push("rdfs:subClassOf")
                }
                availablePrototypes.push("owl:disjointWith")
                availablePrototypes.push("owl:allValuesFrom")
                availablePrototypes.push("owl:someValuesFrom")
            }
            return availablePrototypes
        }
        if (selectedElement.renderType === "rect") {
            availablePrototypes.push("rdfs:Literal")
            availablePrototypes.push("rdfs:Datatype")
        } else {
            availablePrototypes.push("owl:Class")
            availablePrototypes.push("owl:Thing")
            //  TODO: ADD MORE TYPES
            // availiblePrototypes.push("owl:complementOf");
            // availiblePrototypes.push("owl:disjointUnionOf");
        }
        return availablePrototypes
    }

    #setupCollapsing() {
        // TODO : Decision , for now I want to have the control over the collapse expand operation of the
        // TODO : elements, otherwise the old approach will also randomly collapse other containers

        // adapted version of this example: http://www.normansblog.de/simple-jquery-accordion/
        function collapseContainers(containers) {
            containers.classed("hidden", true)
        }
        function expandContainers(containers) {
            containers.classed("hidden", false)
        }

        const triggers = d3.selectAll(".accordion-trigger")
        // Collapse all inactive triggers on startup
        // collapseContainers(d3.selectAll(".accordion-trigger:not(.accordion-trigger-active) + div"));

        const _this = this
        triggers.on("click", function () {
            const selectedTrigger = d3.select(this)
            if (selectedTrigger.classed("accordion-trigger-active")) {
                // Collapse the active (which is also the selected) trigger
                collapseContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", false)
            } else {
                // Collapse the other trigger ...
                // collapseContainers(d3.selectAll(".accordion-trigger-active + div"));
                // ... and expand the selected one
                expandContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", true)
            }
            _this.updateElementWidth()
        })
    }
}
