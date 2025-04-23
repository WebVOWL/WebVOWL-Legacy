import { parse_json } from "../../../../target/pkg"
import BaseElement from "./elements/BaseElement"
import BaseNode from "./elements/nodes/BaseNode"
import OwlThing from "./elements/nodes/implementations/OwlThing"
import RdfsLiteral from "./elements/nodes/implementations/RdfsLiteral"
import nodeClassMap from "./elements/nodes/nodeMap"
import BaseProperty from "./elements/properties/BaseProperty"
import OwlDisjointWith from "./elements/properties/implementations/OwlDisjointWith"
import propertyClassMap from "./elements/properties/propertyMap"
import Graph from "./graph"
import AttributeParser from "./parsing/attributeParser"
import ElementTools from "./util/elementTools"
import LanguageTools from "./util/languageTools"

export default class Parser {
    PREFIX = "GENERATED-MERGED_RANGE-"
    OBJECT_PROPERTY_DEFAULT_RANGE_TYPE = "owl:Thing"
    DATA_PROPERTY_DEFAULT_RANGE_TYPE = "rdfs:Literal"

    /**
     * Encapsulates the parsing and preparation logic of the input data.
     * @param {Graph} graph the graph object that will be passed to the elements
     */
    constructor(graph) {
        this.graph = graph
        this.nodes = undefined
        this.properties = undefined
        /**
         * Mapping of node IDs to nodes
         * @type {Map<string,BaseNode>}
         */
        this.nodeMap = new Map()
        /**
         * Mapping of property IDs to properties
         * @type {Map<string,BaseProperty>}
         */
        this.propertyMap = new Map()
        this.dictionary = []

        this.settingsData = undefined
        this.settingsImported = false
        this.settingsImportGraphZoomAndTranslation = false
    }

    parseSettings() {
        this.settingsImported = true
        this.settingsImportGraphZoomAndTranslation = false

        if (!this.settingsData) {
            this.settingsImported = false
            return
        }
        /** global settings **********************************************************/
        if (this.settingsData.global) {
            if (this.settingsData.global.zoom) {
                const zoomFactor = this.settingsData.global.zoom
                this.graph.setZoom(zoomFactor)
                this.settingsImportGraphZoomAndTranslation = true
            }

            if (this.settingsData.global.translation) {
                const translation = this.settingsData.global.translation
                this.graph.setTranslation(translation)
                this.settingsImportGraphZoomAndTranslation = true
            }

            if (this.settingsData.global.paused) {
                const paused = this.settingsData.global.paused
                this.graph.options.pauseMenu.setPauseValue(paused)
            }
        }
        /** Gravity Settings  **********************************************************/
        if (this.settingsData.gravity) {
            if (this.settingsData.gravity.classDistance) {
                const classDistance = this.settingsData.gravity.classDistance
                this.graph.options.classDistance = classDistance
            }
            if (this.settingsData.gravity.datatypeDistance) {
                const datatypeDistance =
                    this.settingsData.gravity.datatypeDistance
                this.graph.options.datatypeDistance = datatypeDistance
            }
            this.graph.options.gravityMenu.reset() // reads the options values and sets the gui values
        }

        /** Filter Settings **********************************************************/
        if (this.settingsData.filter) {
            // checkbox settings
            if (this.settingsData.filter.checkBox) {
                for (const filterCheckbox of this.settingsData.filter
                    .checkBox) {
                    this.graph.options.filterMenu.setCheckBoxValue(
                        filterCheckbox.id,
                        filterCheckbox.checked,
                    )
                }
            }
            // node degree filter settings
            if (this.settingsData.filter.degreeSliderValue) {
                this.graph.options.filterMenu.setDegreeSliderValue(
                    this.settingsData.filter.degreeSliderValue,
                )
            }
            this.graph.options.filterMenu.updateSettings()
        }

        /** Modes Setting **********************************************************/
        if (this.settingsData.modes) {
            // checkbox settings
            if (this.settingsData.modes.checkBox) {
                for (const modeCheckbox of this.settingsData.modes.checkBox) {
                    this.graph.options.modeMenu.setCheckBoxValue(
                        modeCheckbox.id,
                        modeCheckbox.checked,
                    )
                }
            }
            // color switch settings
            this.graph.options.modeMenu.setColorSwitchState(
                Boolean(this.settingsData.modes.colorSwitchState),
            )
            this.graph.options.modeMenu.updateSettings()
        }
        this.graph.updateStyle() // updates graph representation(setting charges and distances)
    }

    /**
     * Parses the ontology data and preprocesses it (e.g. connecting inverse properties and so on).
     * @param {any} ontologyData the loaded ontology json file
     */
    parse(ontologyData) {
        if (ontologyData.settings) {
            this.settingsData = ontologyData.settings
        }

        // Create node objects
        const combinedClassesAndDatatypes = this.#combineClassesOrProperties(
            [ontologyData.class, ontologyData.datatype],
            [ontologyData.classAttribute, ontologyData.datatypeAttribute],
            ontologyData.namespace,
            nodeClassMap,
            this.#combineClasses,
        )

        const unparsedProperties = ontologyData.property || []

        // Inject properties for unions, intersections etc.
        // @ts-ignore
        this.#addSetOperatorProperties(
            // @ts-ignore
            combinedClassesAndDatatypes,
            unparsedProperties,
        )

        // Create property objects
        const combinedProperties = this.#combineClassesOrProperties(
            [unparsedProperties],
            [ontologyData.propertyAttribute],
            ontologyData.namespace,
            // @ts-ignore
            propertyClassMap,
            // @ts-ignore
            this.#combineProperties,
        )

        // @ts-ignore
        this.mergeRangesOfEquivalentProperties(
            // @ts-ignore
            combinedProperties,
            combinedClassesAndDatatypes,
        )

        // Process the graph data
        // @ts-ignore
        this.nodes = this.#createNodeStructure(combinedClassesAndDatatypes)
        // @ts-ignore
        this.properties = this.#createPropertyStructure(combinedProperties)
    }

    /**
     * Parse `content` and ensure the graph data is valid
     * @param {{ file?: File; json?: string; }} content A file pointer or a JSON string
     * @param {string} filename
     * @param {string} alternativeFilename
     */
    async parseOntologyFromText(content, filename, alternativeFilename) {
        let dataObject = undefined
        const options = this.graph.options
        const loadingModule = options.loadingModule

        const resolve = (/** @type {any} */ data) => {
            return Promise.resolve(data)
        }

        const reject = (/** @type {any} */ cause) => {
            loadingModule.invalidOntology(cause)
            return Promise.reject(cause)
        }

        // Figure out if data is a file or a JSON string
        if (content.file) {
            // This is used for large ontologies to improve performance and memory usage
            try {
                dataObject = await parse_json(content.file)
            } catch (error) {
                return reject(error)
            }
        } else if (content.json) {
            // This is used for small ontologies
            dataObject = JSON.parse(content.json)
        } else {
            return reject(`Graph data '${content}' is not valid`)
        }

        // First look if an ontology title exists, otherwise take the alternative filename
        if (!filename) {
            const ontologyNames = dataObject.header
                ? dataObject.header.title
                : undefined
            const ontologyName = LanguageTools.textInLanguage(ontologyNames)

            if (ontologyName) {
                filename = ontologyName
            } else {
                filename = alternativeFilename
            }
        }

        // Check if we have graph data
        const classCount =
            dataObject.class !== undefined ? dataObject.class.length : 0

        if (classCount > 0) {
            const ontologyMenu = options.ontologyMenu
            const exportMenu = options.exportMenu
            options.data = dataObject
            if (
                content.json &&
                ontologyMenu.shouldCacheOntology(content.json)
            ) {
                ontologyMenu.setCachedOntology(filename, content.json)
                exportMenu.setJsonText(content.json)
            }
            exportMenu.setFilename(filename)
            loadingModule.validOntology()
            return resolve(dataObject)
        } else {
            // Check if we're creating a new ontology
            let loadEmptyOntologyForEditing = false
            if (location.hash.indexOf("#new_ontology") !== -1) {
                loadEmptyOntologyForEditing = true
                loadingModule.newOntologyCounter++ // We don't store state in parser as its state is wiped each time a new ontology is loaded
                d3.select("#empty").node().href =
                    "#opts=editorMode=true;#new_ontology" +
                    loadingModule.newOntologyCounter
            }

            if (loadEmptyOntologyForEditing) {
                this.graph.editorMode = true
                return resolve(dataObject)
            } else if (!this.graph.editorMode) {
                return reject(
                    "Received an empty graph when edit mode is not activated",
                )
            } else {
                return reject("The ontology for editing was not found")
            }
        }
    }
    /**
     * Combines the passed objects with its attributes and prototypes. This also applies
     * attributes defined in the base of the prototype.
     * @param {any[][]} baseObjects
     * @param {any[][]} attributes
     * @param {any[]} namespaces
     * @param {Map<string, new (graph: any) => BaseElement>} prototypeMap
     * @param {(_this: Parser, element: any, Prototype: new (graph: any) => BaseElement) => BaseElement} callable
     */
    #combineClassesOrProperties(
        baseObjects,
        attributes,
        namespaces,
        prototypeMap,
        callable,
    ) {
        if (baseObjects.length !== attributes.length) {
            throw new Error(
                `Cannot combine arrays of different size. BaseObject has size ${baseObjects.length} and objectAttribute has size ${attributes.length}`,
            )
        }

        let combined = []

        for (let i = 0; i < baseObjects.length; i++) {
            let objectMap = new Map()
            if (attributes[i]) {
                for (const attribute of attributes[i]) {
                    objectMap.set(attribute.id, attribute)
                }
            }

            if (baseObjects[i]) {
                for (const element of baseObjects[i]) {
                    if (attributes[i]) {
                        // Look for an attribute with the same id and merge them
                        const matchingAttribute = objectMap.get(element.id)
                        this.#addAdditionalAttributes(
                            element,
                            matchingAttribute,
                        ) // REVIEW: Ensure correctess of this call
                    }

                    // Then look for a prototype to add its properties
                    let Prototype = prototypeMap.get(element.type.toLowerCase())
                    if (Prototype) {
                        // Should be unnecessary, as attributes defined in the Prototype should be present in the ontology data
                        // addAdditionalAttributes(element, Prototype);

                        // Create an instance of a node or property (according to `element`'s type)
                        let object = callable(this, element, Prototype)

                        // Class element pin
                        if (element.pinned === true) {
                            object.pinned = true
                            this.graph.options.pickAndPinModule.addPinnedElement(
                                object,
                            )
                        }

                        // Combine attributes
                        if (element.attributes) {
                            object.attributes = element.attributes.concat(
                                object.attributes,
                            )
                        }

                        // Convert types to IRIs
                        if (typeof element.iri === "string") {
                            element.iri = this.#replaceNamespace(
                                element.iri,
                                namespaces,
                            )
                        }
                        combined.push(object)
                    } else {
                        console.error("Unknown element type: " + element.type)
                    }
                }
            }
        }
        return combined
    }

    /**
     * @note All `element` properties are strings or JSON objects
     * @param {any} element A node object from the parsed JSON object
     * @param {new (graph: any) => BaseNode} Prototype The node class that matches `element`'s type
     * @param {Parser} _this Pointer to the current class, as that's not available in this context
     */
    #combineClasses(_this, element, Prototype) {
        let node = new Prototype(_this.graph)
        node.annotations = element.annotations
        node.baseIri = element.baseIri
        node.comment = element.comment
        node.complement = element.complement
        node.disjointUnion = element.disjointUnion
        node.description = element.description
        node.equivalents = element.equivalent
        node.id = element.id
        node.intersection = element.intersection
        node.label = element.label
        // node.type=element.type; Ignore, because we predefined it
        node.union = element.union
        node.iri = element.iri
        if (element.pos) {
            node.x = element.pos[0]
            node.y = element.pos[1]
            node.px = node.x
            node.py = node.y
        }

        // Create node objects for all individuals
        if (element.individuals) {
            for (const individual of element.individuals) {
                let individualNode = new Prototype(_this.graph)
                individualNode.label = individual.labels
                individualNode.iri = individual.iri
                node.individuals.push(individualNode)
            }
        }
        _this.nodeMap.set(node.id, node)
        return node
    }

    /**
     * @note All `element` properties are strings or JSON objects
     * @param {any} element A property object from the parsed JSON object
     * @param {new (graph: any) => BaseProperty} Prototype The property class that matches `element`'s type
     * @param {Parser} _this Pointer to the current class, as that's not available in this context
     */
    #combineProperties(_this, element, Prototype) {
        let property = new Prototype(_this.graph)
        property.annotations = element.annotations
        property.baseIri = element.baseIri
        property.cardinality = element.cardinality
        property.comment = element.comment
        property.domain = element.domain
        property.description = element.description
        property.equivalents = element.equivalent
        property.id = element.id
        property.inverse = element.inverse
        property.label = element.label
        property.minCardinality = element.minCardinality
        property.maxCardinality = element.maxCardinality
        property.range = element.range
        property.subproperties = element.subproperty
        property.superproperties = element.superproperty
        // property.type=element.type; Ignore, because we predefined it
        property.iri = element.iri
        if (element.pos) {
            property.x = element.pos[0]
            property.y = element.pos[1]
            property.px = element.pos[0]
            property.py = element.pos[1]
        }
        _this.propertyMap.set(property.id, property)
        return property
    }

    /**
     * Checks all attributes which have to be rewritten.
     * For example:
     * <b>equivalent</b> is filled with only ID's of the corresponding nodes. It would be better to used the
     * object instead of the ID so we swap the ID's with the correct object reference and can delete it from drawing
     * because it is not necessary.
     * @param {BaseNode[]} rawNodes
     */
    #createNodeStructure(rawNodes) {
        let nodes = []

        for (const node of rawNodes) {
            // Merge and connect the equivalent nodes
            this.#processEquivalentIds(node, this.nodeMap)
            AttributeParser.parseClassAttributes(node)
        }

        // Collect all nodes that should be displayed
        for (const node of rawNodes) {
            if (node.visible) {
                nodes.push(node)
            }
        }
        return nodes
    }

    /**
     * Sets the disjoint attribute of the nodes if a disjoint label is found.
     * @param {BaseProperty} property
     */
    #processDisjoints(property) {
        if (!(property instanceof OwlDisjointWith)) {
            return
        }

        const domain = property.domain
        const range = property.range

        // Check the domain.
        if (!domain.disjointWith) {
            domain.disjointWith = []
        }

        // Check the range.
        if (!range.disjointWith) {
            range.disjointWith = []
        }

        domain.disjointWith.push(property.range)
        range.disjointWith.push(property.domain)
    }

    /**
     * Connect all properties and also their sub- and superproperties.
     * @note This mutates `rawProperties`
     * @param {BaseProperty[]} rawProperties the properties
     */
    #createPropertyStructure(rawProperties) {
        let properties = []

        // Connect properties with nodes
        for (const property of rawProperties) {
            /* Skip properties that have no information about their domain and range, like
             inverse properties with optional inverse and optional domain and range attributes */
            if ((property.domain && property.range) || property.inverse) {
                let domainObject
                let rangeObject
                // @ts-ignore
                const inversePropertyId = this.#findId(property.inverse)
                const inverse = this.propertyMap.get(inversePropertyId)
                if (!inverse) {
                    console.warn(
                        "No inverse property was found for id: " +
                            inversePropertyId,
                    )
                    property.inverse = undefined
                }
                // Either domain and range are set on this property or at the inverse
                if (
                    typeof property.domain !== "undefined" &&
                    typeof property.range !== "undefined"
                ) {
                    domainObject = this.nodeMap.get(
                        this.#findId(property.domain),
                    )
                    rangeObject = this.nodeMap.get(this.#findId(property.range))
                } else if (inverse) {
                    // Domain and range need to be switched
                    domainObject = this.nodeMap.get(this.#findId(inverse.range))
                    rangeObject = this.nodeMap.get(this.#findId(inverse.domain))
                } else {
                    console.warn(
                        "Domain and range not found for property: " +
                            property.id,
                    )
                }
                // Set the references on this property
                property.domain = domainObject
                property.range = rangeObject

                // Also set the attributes of the inverse property
                if (inverse) {
                    property.inverse = inverse
                    inverse.inverse = property

                    // Switch domain and range
                    inverse.domain = rangeObject
                    inverse.range = domainObject
                }
            }
            // Reference sub- and superproperties
            this.#referenceSubOrSuperProperties(property.subproperties)
            this.#referenceSubOrSuperProperties(property.superproperties)
        }

        // Merge equivalent properties and process disjoints.
        for (const property of rawProperties) {
            this.#processEquivalentIds(property, this.propertyMap)
            this.#processDisjoints(property)
            AttributeParser.parsePropertyAttributes(property)
        }

        // Add additional information to the properties
        for (const property of rawProperties) {
            // Properties of merged classes should point to/from the visible equivalent class
            let propertyWasRerouted = false
            if (property.domain === undefined) {
                console.warn("No Domain was found for id: " + property.id)
                return []
            }
            if (this.#wasNodeMerged(property.domain)) {
                property.domain = property.domain.equivalentBase
                propertyWasRerouted = true
            }

            if (property.range === undefined) {
                console.warn("No range was found for id: " + property.id)
                return []
            }
            if (this.#wasNodeMerged(property.range)) {
                property.range = property.range.equivalentBase
                propertyWasRerouted = true
            }

            if (propertyWasRerouted) {
                // But there should not be two equal properties between the same domain and range.
                const equalProperty = this.#getOtherEqualProperty(
                    rawProperties,
                    property,
                )
                if (equalProperty) {
                    property.visible = false
                    if (equalProperty.redundantProperties instanceof Array) {
                        equalProperty.redundantProperties.push(property)
                    } else {
                        equalProperty.redundantProperties = [property]
                    }
                }
            }

            // Hide property if source or target node is hidden
            if (!property.domain.visible || !property.range.visible) {
                property.visible = false
            }

            // Collect all properties that should be displayed
            if (property.visible) {
                properties.push(property)
            }
        }
        return properties
    }

    /**
     * @param {string[] | BaseProperty[]} subOrSuperPropertiesArray
     */
    #referenceSubOrSuperProperties(subOrSuperPropertiesArray) {
        if (!subOrSuperPropertiesArray) {
            return
        }
        for (let i = 0; i < subOrSuperPropertiesArray.length; ++i) {
            // @ts-ignore
            const subOrSuperPropertyId = this.#findId(
                subOrSuperPropertiesArray[i],
            )
            const subOrSuperProperty =
                this.propertyMap.get(subOrSuperPropertyId)

            if (subOrSuperProperty) {
                // Replace id with object
                subOrSuperPropertiesArray[i] = subOrSuperProperty
            } else {
                console.warn(
                    "No sub-/superproperty was found for id: " +
                        subOrSuperPropertyId,
                )
            }
        }
    }

    /**
     * @param {BaseNode} node
     */
    #wasNodeMerged(node) {
        return !node.visible && node.equivalentBase
    }

    /**
     * @param {BaseProperty[]} properties
     * @param {BaseProperty} referenceProperty
     */
    #getOtherEqualProperty(properties, referenceProperty) {
        for (const property of properties) {
            if (referenceProperty === property) {
                continue
            }
            if (
                referenceProperty.domain !== property.domain ||
                referenceProperty.range !== property.range
            ) {
                continue
            }

            // Check for an equal IRI, if non existent compare label and type
            if (referenceProperty.iri && property.iri) {
                if (referenceProperty.iri === property.iri) {
                    return property
                }
            } else if (
                referenceProperty.type === property.type &&
                referenceProperty.defaultLabel() === property.defaultLabel()
            ) {
                return property
            }
        }
        return undefined
    }

    /**
     * Generates and adds properties for links to set operators.
     * @param {BaseNode[]} nodes
     * @param {any[]} properties JSON property objects
     */
    #addSetOperatorProperties(nodes, properties) {
        /**
         * @param {string} domainId
         * @param {string[]} rangeIds
         * @param {string} operatorType
         */
        function addProperties(domainId, rangeIds, operatorType) {
            if (!rangeIds) {
                return
            }

            for (let i = 0; i < rangeIds.length; i++) {
                const rangeId = rangeIds[i]
                const property = {
                    id:
                        "GENERATED-" +
                        operatorType +
                        "-" +
                        domainId +
                        "-" +
                        rangeId +
                        "-" +
                        i,
                    type: "setOperatorProperty",
                    domain: domainId,
                    range: rangeId,
                }
                properties.push(property)
            }
        }

        for (const node of nodes) {
            addProperties(node.id, node.complement, "COMPLEMENT")
            addProperties(node.id, node.intersection, "INTERSECTION")
            addProperties(node.id, node.union, "UNION")
            addProperties(node.id, node.disjointUnion, "DISJOINTUNION")
        }
    }

    /**
     * Replaces the ids of equivalent nodes/properties with the matching objects, cross references them
     * and tags them as processed.
     * @note This mutates `element` and its `equivalents`.
     * @param {BaseNode | BaseProperty} element a node or a property
     * @param {Map<string,BaseNode> | Map<string,BaseProperty>} elementMap a map where nodes/properties can be looked up
     */
    #processEquivalentIds(element, elementMap) {
        if (!element.equivalents || element.equivalentBase) {
            return
        }

        // Replace ids with the corresponding objects
        for (let i = 0; i < element.equivalents.length; ++i) {
            const equivalentId = this.#findId(element.equivalents[i])
            const equivalentObject = elementMap.get(equivalentId)

            if (equivalentObject) {
                if (!(equivalentObject.equivalents instanceof Array)) {
                    equivalentObject.equivalents = []
                }
                // Cross reference both objects
                equivalentObject.equivalents.push(element)
                equivalentObject.equivalentBase = element
                element.equivalents[i] = equivalentObject
                // Hide other equivalent nodes
                equivalentObject.visible = false
            } else {
                console.warn(
                    "No class/property was found for equivalent id: " +
                        equivalentId,
                )
            }
        }
    }

    /**
     * Adds the attributes of the additional object to the base object, but doesn't
     * overwrite existing ones.
     * @param {{ [x: string]: any; }} base the base object
     * @param {{ [x: string]: any; }} addition the object with additional data
     * @returns the combination is also returned
     */
    #addAdditionalAttributes(base, addition) {
        // Check for an undefined value
        addition = addition || {}

        for (const addAttribute in addition) {
            // Add the attribute if it doesn't exist
            if (
                !(addAttribute in base) &&
                addition.hasOwnProperty(addAttribute)
            ) {
                base[addAttribute] = addition[addAttribute] // TODO: Check if we should use an element's "attribute" here
            }
        }
        return base
    }

    /**
     * Replaces the namespace (and the separator) if one exists and returns the new value.
     * @param {string} address the address with a namespace in it
     * @param {any[]} namespaces an array of namespaces
     * @returns {string} the processed address with the (possibly) replaced namespace
     */
    #replaceNamespace(address, namespaces) {
        const separatorIndex = address.indexOf(":")
        if (separatorIndex === -1) {
            return address
        }
        const namespaceName = address.substring(0, separatorIndex)

        for (const namespace of namespaces) {
            if (namespaceName === namespace.name) {
                return namespace.iri + address.substring(separatorIndex + 1)
            }
        }
        return address
    }

    /**
     * @note This mutates `properties` and `nodes`
     * @param {BaseProperty[]} properties
     * @param {BaseNode[]} nodes
     */
    mergeRangesOfEquivalentProperties(properties, nodes) {
        let domainIDs = new Set()
        let rangeIDs = new Set()
        let nodeIdsToHide = new Set()
        let processedPropertyIDs = new Set()
        let mergeNodes = []

        for (const property of properties) {
            domainIDs.add(property.domain.id)
            rangeIDs.add(property.range.id)
        }

        for (const property of properties) {
            let propertyWithEquivalents = [property]
            if (
                !property.equivalents ||
                property.equivalents.length === 0 ||
                processedPropertyIDs.has(property.id)
            ) {
                continue
            } else {
                // Add the equivalent property instances from their ID
                for (const equivalentProperty of property.equivalents) {
                    propertyWithEquivalents.push(
                        this.propertyMap.get(equivalentProperty.id),
                    )
                }
                if (propertyWithEquivalents.length === 1) {
                    continue
                }
            }

            const mergeNode = this.#findMergeNode(propertyWithEquivalents)
            if (mergeNode) {
                mergeNodes.push(this.#createDefaultMergeNode(property))
                for (const equivalentProperty of propertyWithEquivalents) {
                    const oldRangeId = equivalentProperty.range.id
                    equivalentProperty.range.id = mergeNode.id
                    // isDomainOrRangeOfOtherProperty
                    if (
                        !(domainIDs.has(oldRangeId) || rangeIDs.has(oldRangeId))
                    ) {
                        nodeIdsToHide.add(oldRangeId)
                    }
                    processedPropertyIDs.add(equivalentProperty.id)
                }
            }
        }
        // @ts-ignore
        return this.#filterVisibleNodes(nodes.concat(mergeNodes), nodeIdsToHide)
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     * @returns {BaseNode | void}
     */
    #findMergeNode(propertyWithEquivalents) {
        let typeMap = this.#mapPropertiesRangesToType(propertyWithEquivalents)
        let typeSet = new Set(typeMap.keys())

        // default types are the fallback values and should be ignored for the type determination
        typeSet.delete(this.OBJECT_PROPERTY_DEFAULT_RANGE_TYPE)
        typeSet.delete(this.DATA_PROPERTY_DEFAULT_RANGE_TYPE)

        // exactly one type to chose from -> take the node of this type as range
        if (typeSet.size === 1) {
            const ranges = typeMap.get(typeSet.values().next().value)
            if (ranges.length === 1) {
                return ranges[0]
            }
        }
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     */
    #mapPropertiesRangesToType(propertyWithEquivalents) {
        /**
         * @type {Map<string,BaseNode[]>}
         */
        let typeMap = new Map()
        for (const property of propertyWithEquivalents) {
            if (property === undefined) {
                throw new TypeError(
                    `Property cannot be '${property}' in this context`,
                )
            }
            const range = this.nodeMap.get(property.range.id)
            const type = range.type

            if (!typeMap.has(type)) {
                typeMap.set(type, [])
            }
            typeMap.get(type).push(range)
        }
        return typeMap
    }

    /**
     * @param {BaseProperty} property
     */
    #createDefaultMergeNode(property) {
        let range
        if (ElementTools.isDatatypeProperty(property)) {
            range = new RdfsLiteral(this.graph)
        } else {
            range = new OwlThing(this.graph)
        }
        range.id = this.PREFIX + property.id
        return range
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {Set<string>} nodeIdsToHide
     */
    #filterVisibleNodes(nodes, nodeIdsToHide) {
        const filteredNodes = []
        for (const node of nodes) {
            if (!nodeIdsToHide.has(node.id)) {
                filteredNodes.push(node)
            } else {
                // Remove hidden nodes from the map
                this.nodeMap.delete(node.id)
            }
        }
        return filteredNodes
    }

    /**
     * Looks whether the passed object is already the id or if it was replaced
     * with the object that belongs to the id.
     * @param {string | BaseElement} object an id, a class or a property
     * @returns {string | undefined} the id of the passed object or undefined
     */
    #findId(object) {
        if (!object) {
            return undefined
        } else if (typeof object === "string") {
            return object
        } else if ("id" in object) {
            return object.id
        } else {
            console.warn("No Id was found for this object: " + object)
            return undefined
        }
    }
}
