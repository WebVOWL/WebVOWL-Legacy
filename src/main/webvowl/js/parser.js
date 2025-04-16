import { BaseElement } from './elements/BaseElement';
import { BaseNode } from './elements/nodes/BaseNode';
import { OwlThing } from './elements/nodes/implementations/OwlThing';
import { RdfsLiteral } from './elements/nodes/implementations/RdfsLiteral';
import nodeClassMap from './elements/nodes/nodeMap';
import { BaseProperty } from './elements/properties/BaseProperty';
import { OwlDisjointWith } from './elements/properties/implementations/OwlDisjointWith';
import propertyClassMap from './elements/properties/propertyMap';
import { AttributeParser } from './parsing/attributeParser';
import { EquivalentPropertyMerger } from './parsing/equivalentPropertyMerger';
import { ElementTools } from './util/elementTools';
import { LanguageTools } from './util/languageTools';


export class Parser {
    PREFIX = "GENERATED-MERGED_RANGE-"
    OBJECT_PROPERTY_DEFAULT_RANGE_TYPE = "owl:Thing"
    DATA_PROPERTY_DEFAULT_RANGE_TYPE = "rdfs:Literal"

    /**
     * Encapsulates the parsing and preparation logic of the input data.
     * @param {any} graph the graph object that will be passed to the elements
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

        // NOTE: Disabled to save memory while these attributes are not used
        // this.settingsData = undefined
        // this.settingsImported = false
        // this.settingsImportGraphZoomAndTranslation = false
    }

    // NOTE: Disabled to save memory while this method is not used
    // Remember to enable a call to parseSettings in graph.js and some code in `parse` of this class if this method ever used
    // parseSettings() {
    //     this.settingsImported = true;
    //     this.settingsImportGraphZoomAndTranslation = false;

    //     if (!this.settingsData) {
    //         this.settingsImported = false;
    //         return;
    //     }
    //     /** global settings **********************************************************/
    //     if (this.settingsData.global) {
    //         if (this.settingsData.global.zoom) {
    //             const zoomFactor = this.settingsData.global.zoom;
    //             this.graph.setZoom(zoomFactor);
    //             this.settingsImportGraphZoomAndTranslation = true;
    //         }

    //         if (this.settingsData.global.translation) {
    //             const translation = this.settingsData.global.translation;
    //             this.graph.setTranslation(translation);
    //             this.settingsImportGraphZoomAndTranslation = true;
    //         }

    //         if (this.settingsData.global.paused) {
    //             const paused = this.settingsData.global.paused;
    //             this.graph.options.pauseMenu().setPauseValue(paused);
    //         }
    //     }
    //     /** Gravity Settings  **********************************************************/
    //     if (this.settingsData.gravity) {
    //         if (this.settingsData.gravity.classDistance) {
    //             const classDistance = this.settingsData.gravity.classDistance;
    //             this.graph.options.classDistance(classDistance);
    //         }
    //         if (this.settingsData.gravity.datatypeDistance) {
    //             const datatypeDistance = this.settingsData.gravity.datatypeDistance;
    //             this.graph.options.datatypeDistance(datatypeDistance);
    //         }
    //         this.graph.options.gravityMenu().reset(); // reads the options values and sets the gui values
    //     }

    //     /** Filter Settings **********************************************************/
    //     if (this.settingsData.filter) {
    //         // checkbox settings
    //         if (this.settingsData.filter.checkBox) {
    //             for (const filterCheckbox of this.settingsData.filter.checkBox) {
    //                 this.graph.options.filterMenu().setCheckBoxValue(filterCheckbox.id, filterCheckbox.checked);
    //             }
    //         }
    //         // node degree filter settings
    //         if (this.settingsData.filter.degreeSliderValue) {
    //             this.graph.options.filterMenu().setDegreeSliderValue(this.settingsData.filter.degreeSliderValue);
    //         }
    //         this.graph.options.filterMenu().updateSettings();
    //     }

    //     /** Modes Setting **********************************************************/
    //     if (this.settingsData.modes) {
    //         // checkbox settings
    //         if (this.settingsData.modes.checkBox) {
    //             for (const modeCheckbox of this.settingsData.modes.checkBox) {
    //                 this.graph.options.modeMenu().setCheckBoxValue(modeCheckbox.id, modeCheckbox.checked);
    //             }
    //         }
    //         // color switch settings
    //         this.graph.options.modeMenu().setColorSwitchState(Boolean(this.settingsData.modes.colorSwitchState));
    //         this.graph.options.modeMenu().updateSettings();
    //     }
    //     this.graph.updateStyle(); // updates graph representation(setting charges and distances)
    // }

    /**
     * Parses the ontology data and preprocesses it (e.g. connecting inverse properties and so on).
     * @param ontologyData the loaded ontology json file
     */
    parse(ontologyData) {
        if (!ontologyData) {
            nodes = [];
            properties = [];
            dictionary = [];
            return;
        }
        dictionary = [];
        // if (ontologyData.settings) {
        //     this.settingsData = ontologyData.settings;
        // } else {
        //     this.settingsData = undefined;
        // }

        // Create node objects
        const combinedClassesAndDatatypes = this.#combineClassesOrProperties(
            [ontologyData.class, ontologyData.datatype],
            [ontologyData.classAttribute, ontologyData.datatypeAttribute],
            ontologyData.namespace,
            nodeClassMap,
            this.#combineClasses
        )


        const unparsedProperties = ontologyData.property || []

        // Inject properties for unions, intersections, ...
        // @ts-ignore
        this.#addSetOperatorProperties(combinedClassesAndDatatypes, unparsedProperties)

        // Create property objects
        const combinedProperties = this.#combineClassesOrProperties(
            [unparsedProperties],
            [ontologyData.propertyAttribute],
            ontologyData.namespace,
            propertyClassMap,
            // @ts-ignore
            this.#combineProperties
        )

        this.#mergeRangesOfEquivalentProperties(combinedProperties, combinedClassesAndDatatypes);

        // Process the graph data
        this.#convertTypesToIris(combinedClassesAndDatatypes, ontologyData.namespace);
        this.#convertTypesToIris(combinedProperties, ontologyData.namespace);
        nodes = this.#createNodeStructure(combinedClassesAndDatatypes, classMap);
        properties = this.#createPropertyStructure(combinedProperties, classMap, propertyMap);
    }

    /**
     * Parse `jsonObject` and ensure the graph data is valid
     * @param {{}} jsonObject
     * @param {string} filename
     * @param {string} alternativeFilename
     * @returns {[{} | undefined, boolean]} Whether `jsonObject` is valid graph data
     */
    parseOntologyFromText(jsonObject, filename, alternativeFilename) {
        let isValidData = false;
        const options = this.graph.options;
        const loadingModule = options.loadingModule();

        if (!jsonObject && filename === undefined) {
            loadingModule.notValidJsonFile();
            return [undefined, isValidData];
        }

        if (!filename) {
            // First look if an ontology title exists, otherwise take the alternative filename
            // @ts-ignore
            const ontologyNames = jsonObject.header ? jsonObject.header.title : undefined;
            const ontologyName = LanguageTools.textInLanguage(ontologyNames);

            if (ontologyName) {
                filename = ontologyName;
            } else {
                filename = alternativeFilename;
            }
        }

        // check if we have graph data
        // @ts-ignore
        isValidData = jsonObject.class !== undefined && jsonObject.class.length > 0;

        if (isValidData) {
            const ontologyMenu = options.ontologyMenu();
            const exportMenu = options.exportMenu();
            options.data(jsonObject);
            loadingModule.validJsonFile();
            if (ontologyMenu.shouldCacheOntology(jsonObject)) {
                ontologyMenu.setCachedOntology(filename, jsonObject);
                exportMenu.setJsonText(jsonObject);
            }
            exportMenu.setFilename(filename);
        }
        return [jsonObject, isValidData];
    }

    /**
     * Combines the passed objects with its attributes and prototypes. This also applies
     * attributes defined in the base of the prototype.
     * @param {any[][]} baseObjects
     * @param {any[][]} attributes
     * @param {any[]} namespaces
     * @param {Map<string, new (graph: any) => BaseElement>} prototypeMap
     * @param {(element: any, Prototype: new (graph: any) => BaseElement) => BaseElement} callable
     */
    #combineClassesOrProperties(baseObjects, attributes, namespaces, prototypeMap, callable) {
        if (baseObjects.length !== attributes.length) {
            throw new Error(
                `Cannot combine arrays of different size. BaseObject has size ${baseObjects.length} and objectAttribute has size ${attributes.length}`
            )
        }

        let combined = [];

        for (let i = 0; i < baseObjects.length; i++) {
            let objectMap = new Map();
            if (attributes[i]) {
                for (const attribute of attributes[i]) {
                    objectMap.set(attribute.id, attribute);
                }
            }

            for (const element of baseObjects[i]) {
                if (attributes[i]) {
                    // Look for an attribute with the same id and merge them
                    const matchingAttribute = objectMap.get(element.id);
                    this.#addAdditionalAttributes(element, matchingAttribute); // TODO: Ensure correctess of this call
                }

                // Then look for a prototype to add its properties
                let Prototype = prototypeMap.get(element.type.toLowerCase());
                if (Prototype) {
                    // Should be unnecessary, as attributes defined in the Prototype should be present in the ontology data
                    // addAdditionalAttributes(element, Prototype);

                    // Create an instance of a node or property (according to `element`'s type)
                    let object = callable(element, Prototype);

                    // Class element pin
                    if (element.pinned === true) {
                        object.pinned = true;
                        this.graph.options.pickAndPinModule().addPinnedElement(object);
                    }

                    // Combine attributes
                    if (element.attributes) {
                        object.attributes = element.attributes.concat(object.attributes);
                    }

                    // convert types to IRIs
                    if (typeof element.iri === "string") {
                        element.iri = this.#replaceNamespace(element.iri, namespaces)
                    }
                    combined.push(object);
                } else {
                    console.error("Unknown element type: " + element.type);
                }
            }
        }
        return combined;
    }

    /**
     * @param {any} element A node object from the parsed JSON object
     * @param {new (graph: any) => BaseNode} Prototype The node class that matches `element`'s type
     * Note: all `element` properties are strings or JSON objects
     */
    #combineClasses(element, Prototype) {
        let node = new Prototype(this.graph);
        node.annotations = element.annotations;
        node.baseIri = element.baseIri;
        node.comment = element.comment;
        node.complement = element.complement;
        node.disjointUnion = element.disjointUnion;
        node.description = element.description;
        node.equivalents = element.equivalent;
        node.id = element.id;
        node.intersection = element.intersection;
        node.label = element.label;
        // node.type=element.type; Ignore, because we predefined it
        node.union = element.union;
        node.iri = element.iri;
        if (element.pos) {
            node.x = element.pos[0];
            node.y = element.pos[1];
            node.px = node.x;
            node.py = node.y;
        }

        // Create node objects for all individuals
        if (element.individuals) {
            for (const individual of element.individuals) {
                let individualNode = new Prototype(this.graph);
                individualNode.label = individual.labels;
                individualNode.iri = individual.iri;
                node.individuals.push(individualNode);
            };
        }
        this.nodeMap.set(node.id, node)
        return node;
    }

    /**
     * @param {any} element A property object from the parsed JSON object
     * @param {new (graph: any) => BaseProperty} Prototype The property class that matches `element`'s type
     */
    #combineProperties(element, Prototype) {
        let property = new Prototype(this.graph);
        property.annotations = element.annotations;
        property.baseIri = element.baseIri;
        property.cardinality = element.cardinality;
        property.comment = element.comment;
        property.domain = element.domain;
        property.description = element.description;
        property.equivalents = element.equivalent;
        property.id = element.id;
        property.inverse = element.inverse;
        property.label = element.label;
        property.minCardinality = element.minCardinality;
        property.maxCardinality = element.maxCardinality;
        property.range = element.range;
        property.subproperties = element.subproperty;
        property.superproperties = element.superproperty;
        // property.type=element.type; Ignore, because we predefined it
        property.iri = element.iri;
        if (element.pos) {
            property.x = element.pos[0];
            property.y = element.pos[1];
            property.px = element.pos[0];
            property.py = element.pos[1];
        }
        this.propertyMap.set(property.id, property)
        return property;
    }

    /**
     * @param {BaseProperty[]} properties
     * @param {BaseNode[]} nodes
     */
    #mergeRangesOfEquivalentProperties(properties, nodes) {
        // pass clones of arrays into the merger to keep the current functionality of this module
        const newNodes = EquivalentPropertyMerger.merge(properties.slice(), nodes.slice(), this.propertyMap, this.nodeMap, this.graph);

        // replace all the existing nodes and map the nodes again
        nodes.length = 0;
        Array.prototype.push.apply(nodes, newNodes);
        this.nodeMap = this.#mapElements(nodes);
    }

    /**
     * Checks all attributes which have to be rewritten.
     * For example:
     * <b>equivalent</b> is filled with only ID's of the corresponding nodes. It would be better to used the
     * object instead of the ID so we swap the ID's with the correct object reference and can delete it from drawing
     * because it is not necessary.
     */
    #createNodeStructure(rawNodes, classMap) {
        let nodes = [];

        // Set the default values
        rawNodes.forEach(function (node) { // FIXME: Should be removed
            node.visible = true;
        });

        for (const node of rawNodes) {
            // Merge and connect the equivalent nodes
            this.#processEquivalentIds(node, classMap);
            AttributeParser.parseClassAttributes(node);
        }

        // Collect all nodes that should be displayed
        for (const node of rawNodes) {
            if (node.visible) {
                nodes.push(node);
            }
        };
        return nodes;
    }

    /**
     * Sets the disjoint attribute of the nodes if a disjoint label is found.
     * @param {BaseProperty} property
     */
    #processDisjoints(property) {
        if (property instanceof OwlDisjointWith === false) {
            return;
        }

        const domain = property.domain;
        const range = property.range;

        // Check the domain.
        if (!domain.disjointWith) {
            domain.disjointWith = [];
        }

        // Check the range.
        if (!range.disjointWith) {
            range.disjointWith = [];
        }

        domain.disjointWith.push(property.range);
        range.disjointWith.push(property.domain);
    }

    /**
     * Connect all properties and also their sub- and superproperties.
     * We iterate over the rawProperties array because it is way faster than iterating
     * over an object and its attributes.
     *
     * @param rawProperties the properties
     * @param classMap a map of all classes
     * @param propertyMap the properties in a map
     */
    #createPropertyStructure(rawProperties, classMap, propertyMap) {
        let properties = [];
        // Set default values
        rawProperties.forEach(function (property) { // FIXME: Should be removed
            property.visible = true;
        });

        // Connect properties
        for (const property of rawProperties) {
            /* Skip properties that have no information about their domain and range, like
             inverse properties with optional inverse and optional domain and range attributes */
            if ((property.domain && property.range) || property.inverse) {
                let domainObject;
                let rangeObject;
                const inversePropertyId = this.#findId(property.inverse);
                const inverse = propertyMap[inversePropertyId];
                if (!inverse) {
                    console.warn("No inverse property was found for id: " + inversePropertyId);
                    property.inverse = undefined;
                }
                // Either domain and range are set on this property or at the inverse
                if (typeof property.domain !== "undefined" && typeof property.range !== "undefined") {
                    domainObject = classMap[this.#findId(property.domain)];
                    rangeObject = classMap[this.#findId(property.range)];
                } else if (inverse) {
                    // Domain and range need to be switched
                    domainObject = classMap[this.#findId(inverse.range)];
                    rangeObject = classMap[this.#findId(inverse.domain)];
                } else {
                    console.warn("Domain and range not found for property: " + property.id);
                }
                // Set the references on this property
                property.domain = domainObject;
                property.range = rangeObject;

                // Also set the attributes of the inverse property
                if (inverse) {
                    property.inverse = inverse;
                    inverse.inverse = property;

                    // Switch domain and range
                    inverse.domain = rangeObject;
                    inverse.range = domainObject;
                }
            }
            // Reference sub- and superproperties
            this.#referenceSubOrSuperProperties(property.subproperties);
            this.#referenceSubOrSuperProperties(property.superproperties);
        }

        // Merge equivalent properties and process disjoints.
        for (const property of rawProperties) {
            this.#processEquivalentIds(property, propertyMap);
            this.#processDisjoints(property);
            AttributeParser.parsePropertyAttributes(property);
        }

        // Add additional information to the properties
        for (const property of rawProperties) {
            // Properties of merged classes should point to/from the visible equivalent class
            let propertyWasRerouted = false;
            if (property.domain === undefined) {
                console.warn("No Domain was found for id:" + property.id);
                return [];
            }
            if (this.#wasNodeMerged(property.domain)) {
                property.domain = property.domain.equivalentBase;
                propertyWasRerouted = true;
            }

            if (property.range === undefined) {
                console.warn("No range was found for id:" + property.id);
                return [];
            }
            if (this.#wasNodeMerged(property.range)) {
                property.range = property.range.equivalentBase;
                propertyWasRerouted = true;
            }

            if (propertyWasRerouted) {
                // But there should not be two equal properties between the same domain and range.
                const equalProperty = this.#getOtherEqualProperty(rawProperties, property);
                if (equalProperty) {
                    property.visible = false;
                    if (equalProperty.redundantProperties instanceof Array) {
                        equalProperty.redundantProperties.push(property);
                    } else {
                        equalProperty.redundantProperties = [property];
                    }
                }
            }

            // Hide property if source or target node is hidden
            if (!property.domain.visible || !property.range.visible) {
                property.visible = false;
            }

            // Collect all properties that should be displayed
            if (property.visible) {
                properties.push(property);
            }
        };
        return properties;
    }

    #referenceSubOrSuperProperties(subOrSuperPropertiesArray) {
        if (!subOrSuperPropertiesArray) {
            return;
        }
        for (let i = 0; i < subOrSuperPropertiesArray.length; ++i) {
            const subOrSuperPropertyId = this.#findId(subOrSuperPropertiesArray[i]);
            const subOrSuperProperty = this.propertyMap[subOrSuperPropertyId];

            if (subOrSuperProperty) {
                // Replace id with object
                subOrSuperPropertiesArray[i] = subOrSuperProperty;
            } else {
                console.warn("No sub-/superproperty was found for id: " + subOrSuperPropertyId);
            }
        }
    }

    #wasNodeMerged(node) {
        return !node.visible && node.equivalentBase;
    }

    #getOtherEqualProperty(properties, referenceProperty) {
        for (const property of properties) {
            if (referenceProperty === property) {
                continue;
            }
            if (referenceProperty.domain !== property.domain
                || referenceProperty.range !== property.range) {
                continue;
            }

            // Check for an equal IRI, if non existent compare label and type
            if (referenceProperty.iri && property.iri) {
                if (referenceProperty.iri === property.iri) {
                    return property;
                }
            } else if (referenceProperty.type === property.type &&
                referenceProperty.defaultLabel() === property.defaultLabel()) {
                return property;
            }
        }
        return undefined;
    }

    /**
     * Generates and adds properties for links to set operators.
     * @param {BaseNode[]} nodes
     * @param {any[]} properties unprocessed properties
     */
    #addSetOperatorProperties(nodes, properties) {
        /**
         * @param {string} domainId
         * @param {string[]} rangeIds
         * @param {string} operatorType
         */
        function addProperties(domainId, rangeIds, operatorType) {
            if (!rangeIds) {
                return;
            }

            for (let i = 0; i < rangeIds.length; i++) {
                const rangeId = rangeIds[i];
                const property = {
                    id: "GENERATED-" + operatorType + "-" + domainId + "-" + rangeId + "-" + i,
                    type: "setOperatorProperty",
                    domain: domainId,
                    range: rangeId
                };
                properties.push(property);
            }
        }

        for (const node of nodes) {
            addProperties(node.id, node.complement, "COMPLEMENT");
            addProperties(node.id, node.intersection, "INTERSECTION");
            addProperties(node.id, node.union, "UNION");
            addProperties(node.id, node.disjointUnion, "DISJOINTUNION");
        }
    }

    /**
     * Replaces the ids of equivalent nodes/properties with the matching objects, cross references them
     * and tags them as processed.
     * @param element a node or a property
     * @param elementMap a map where nodes/properties can be looked up
     * @note This method mutates `element`
     */
    #processEquivalentIds(element, elementMap) {
        const eqIds = element.equivalents;
        if (!eqIds || element.equivalentBase) {
            return;
        }

        // Replace ids with the corresponding objects
        for (let i = 0; i < eqIds.length; ++i) {
            const eqId = this.#findId(eqIds[i]);
            const eqObject = elementMap[eqId];

            if (eqObject) {
                // Cross reference both objects
                eqObject.equivalents = eqObject.equivalents;
                eqObject.equivalents.push(element);
                eqObject.equivalentBase = element;
                eqIds[i] = eqObject;
                // Hide other equivalent nodes
                eqObject.visible = false;
            } else {
                console.warn("No class/property was found for equivalent id: " + eqId);
            }
        }
    }

    /**
     * Tries to convert the type to an iri and sets it.
     * @param element classes or properties
     * @param namespaces an array of namespaces
     */
    #convertTypesToIris(element, namespaces) {
        for (const element of element) {
            if (typeof element.iri === "string") {
                element.iri = this.#replaceNamespace(element.iri, namespaces);
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
        addition = addition || {};

        for (const addAttribute in addition) {
            // Add the attribute if it doesn't exist
            if (!(addAttribute in base) && addition.hasOwnProperty(addAttribute)) {
                base[addAttribute] = addition[addAttribute]; // TODO: Check if we should use an element's "attribute" here
            }
        }
        return base;
    }

    /**
     * Replaces the namespace (and the separator) if one exists and returns the new value.
     * @param {string} address the address with a namespace in it
     * @param {any[]} namespaces an array of namespaces
     * @returns {string} the processed address with the (possibly) replaced namespace
     */
    #replaceNamespace(address, namespaces) {
        const separatorIndex = address.indexOf(":");
        if (separatorIndex === -1) {
            return address;
        }
        const namespaceName = address.substring(0, separatorIndex);

        for (const namespace of namespaces) {
            if (namespaceName === namespace.name) {
                return namespace.iri + address.substring(separatorIndex + 1);
            }
        }
        return address;
    }

    #merge(properties, nodes) {
        let totalNodeIdsToHide = new Set()
        let processedPropertyIds = new Set()
        let mergeNodes = []

        for (const property of properties) {
            let propertyWithEquivalents = [property]
            if (processedPropertyIds.has(property.id)) {
                continue
            } else {
                // Add the equivalent property instance from its ID
                for (const equivalentProperty of property.equivalents) {
                    propertyWithEquivalents.push(this.propertyMap.get(equivalentProperty.id))
                }
                if (propertyWithEquivalents.length === 0) {
                    continue
                }
            }

            const mergeNode = this.#findMergeNode(propertyWithEquivalents)
            if (mergeNode) {
                mergeNodes.push(this.#createDefaultMergeNode(property))
            }

            // FIXME: This call makes this function's runtime O(n^2) w.r.t. properties
            const nodeIdsToHide = this.#replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNodes.at(-1), properties, processedPropertyIds);
            for (const hiddenNodeID of nodeIdsToHide) {
                totalNodeIdsToHide.add(hiddenNodeID);
            }
        }
        // FIXME: This call can be optimized away and replaced with info from `nodes` of this function
        return this.#filterVisibleNodes(nodes.concat(mergeNodes), totalNodeIdsToHide);
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     * @returns {BaseNode | void}
     */
    #findMergeNode(propertyWithEquivalents) {
        let typeMap = this.#mapPropertiesRangesToType(propertyWithEquivalents);
        let typeSet = new Set(typeMap.keys());

        // default types are the fallback values and should be ignored for the type determination
        typeSet.delete(this.OBJECT_PROPERTY_DEFAULT_RANGE_TYPE);
        typeSet.delete(this.DATA_PROPERTY_DEFAULT_RANGE_TYPE);

        // exactly one type to chose from -> take the node of this type as range
        if (typeSet.size === 1) {
            const ranges = typeMap.get(typeSet.values().next().value);
            if (ranges.length === 1) {
                return ranges[0];
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
        let typeMap = new Map();
        for (const property of propertyWithEquivalents) {
            if (property === undefined) {
                throw new TypeError(`Property cannot be '${property}' in this context`)
            }
            const range = this.nodeMap.get(property.range.id);
            const type = range.type;

            if (!typeMap.has(type)) {
                typeMap.set(type, []);
            }
            typeMap.get(type).push(range);
        }
        return typeMap;
    }

    /**
     * @param {BaseProperty} property
     */
    #createDefaultMergeNode(property) {
        let range;
        if (ElementTools.isDatatypeProperty(property)) {
            range = new RdfsLiteral(this.graph);
        } else {
            range = new OwlThing(this.graph);
        }
        range.id = this.PREFIX + property.id;
        return range;
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     * @param {BaseNode} mergeNode
     * @param {BaseProperty[]} properties
     * @param {Set<string>} processedPropertyIds
     */
    #replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties, processedPropertyIds) {
        var nodesToHide = [];

        for (let property of propertyWithEquivalents) {
            if (property === undefined || mergeNode === undefined) {
                //@ WORKAROUND
                throw new TypeError(`Property (${property}) and mergeNode (${mergeNode}) cannot be undefined in this context`)
            }
            const oldRangeId = property.range.id;
            property.range.id = mergeNode.id;
            if (!this.#isDomainOrRangeOfOtherProperty(oldRangeId, properties)) {
                nodesToHide.push(oldRangeId);
            }
            processedPropertyIds.add(property.id);
        }
        return nodesToHide;
    }

    /**
     * @param {string} nodeId
     * @param {BaseProperty[]} properties
     */
    #isDomainOrRangeOfOtherProperty(nodeId, properties) {
        for (const property of properties) {
            if (property.domain.id === nodeId || property.range.id === nodeId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {Set<string>} nodeIdsToHide
     */
    #filterVisibleNodes(nodes, nodeIdsToHide) {
        var filteredNodes = [];
        for (const node of nodes) {
            if (!nodeIdsToHide.has(node.id)) {
                filteredNodes.push(node);
            }
        }
        return filteredNodes;
    }

    /**
     * Looks whether the passed object is already the id or if it was replaced
     * with the object that belongs to the id.
     * @param {string | BaseElement} object an id, a class or a property
     * @returns {string | undefined} the id of the passed object or undefined
     */
    #findId(object) {
        if (!object) {
            return undefined;
        } else if (typeof object === "string") {
            return object;
        } else if ("id" in object) {
            return object.id;
        } else {
            console.warn("No Id was found for this object: " + object);
            return undefined;
        }
    }
}