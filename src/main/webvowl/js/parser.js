import { BaseElement } from './elements/BaseElement';
import { BaseNode } from './elements/nodes/BaseNode';
import nodePrototypeMapFactory from './elements/nodes/nodeMap';
import { BaseProperty } from './elements/properties/BaseProperty';
import OwlDisjointWith from './elements/properties/implementations/OwlDisjointWith';
import propertyPrototypeMapFactory from './elements/properties/propertyMap';
import attributeParserFactory from './parsing/attributeParser';
import equivalentPropertyMergerFactory from './parsing/equivalentPropertyMerger';
const attributeParser = attributeParserFactory();
const equivalentPropertyMerger = equivalentPropertyMergerFactory();
const nodePrototypeMap = nodePrototypeMapFactory();
const propertyPrototypeMap = propertyPrototypeMapFactory();


export class Parser {
    /**
     * Encapsulates the parsing and preparation logic of the input data.
     * @param {any} graph the graph object that will be passed to the elements
     */
    constructor(graph) {
        this.graph = graph
        this.nodes = undefined
        this.properties = undefined
        this.classMap = undefined
        this.settingsData = undefined
        this.settingsImported = false
        this.settingsImportGraphZoomAndTranslation = false
        this.dictionary = []
        this.propertyMap = undefined
    }

    getDictionary() {
        return dictionary;
    }

    setDictionary(d) {
        dictionary = d;
    }

    settingsImported() {
        return settingsImported;
    }

    settingsImportGraphZoomAndTranslation() {
        return settingsImportGraphZoomAndTranslation;
    }

    parseSettings() {
        settingsImported = true;
        settingsImportGraphZoomAndTranslation = false;

        if (!settingsData) {
            settingsImported = false;
            return;
        }
        /** global settings **********************************************************/
        if (settingsData.global) {
            if (settingsData.global.zoom) {
                const zoomFactor = settingsData.global.zoom;
                graph.setZoom(zoomFactor);
                settingsImportGraphZoomAndTranslation = true;
            }

            if (settingsData.global.translation) {
                const translation = settingsData.global.translation;
                graph.setTranslation(translation);
                settingsImportGraphZoomAndTranslation = true;
            }

            if (settingsData.global.paused) {
                const paused = settingsData.global.paused;
                graph.options().pauseMenu().setPauseValue(paused);
            }
        }
        /** Gravity Settings  **********************************************************/
        if (settingsData.gravity) {
            if (settingsData.gravity.classDistance) {
                const classDistance = settingsData.gravity.classDistance;
                graph.options().classDistance(classDistance);
            }
            if (settingsData.gravity.datatypeDistance) {
                const datatypeDistance = settingsData.gravity.datatypeDistance;
                graph.options().datatypeDistance(datatypeDistance);
            }
            graph.options().gravityMenu().reset(); // reads the options values and sets the gui values
        }


        // shared variable declaration

        const i;
        const id;
        const checked;
        /** Filter Settings **********************************************************/
        if (settingsData.filter) {
            // checkbox settings
            if (settingsData.filter.checkBox) {
                const filter_cb = settingsData.filter.checkBox;
                for (i = 0; i < filter_cb.length; i++) {
                    id = filter_cb[i].id;
                    checked = filter_cb[i].checked;
                    graph.options().filterMenu().setCheckBoxValue(id, checked);
                }
            }
            // node degree filter settings
            if (settingsData.filter.degreeSliderValue) {
                const degreeSliderValue = settingsData.filter.degreeSliderValue;
                graph.options().filterMenu().setDegreeSliderValue(degreeSliderValue);
            }
            graph.options().filterMenu().updateSettings();
        }

        /** Modes Setting **********************************************************/
        if (settingsData.modes) {
            // checkbox settings
            if (settingsData.modes.checkBox) {
                const modes_cb = settingsData.modes.checkBox;
                for (i = 0; i < modes_cb.length; i++) {
                    id = modes_cb[i].id;
                    checked = modes_cb[i].checked;
                    graph.options().modeMenu().setCheckBoxValue(id, checked);
                }
            }
            // color switch settings
            const state = settingsData.modes.colorSwitchState;
            // state could be undefined
            if (state === true || state === false) {
                graph.options().modeMenu().setColorSwitchState(state);
            }
            graph.options().modeMenu().updateSettings();
        }
        graph.updateStyle(); // updates graph representation(setting charges and distances)
    }

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
        if (ontologyData.settings) settingsData = ontologyData.settings;
        else settingsData = undefined;

        let lowercaseNodePrototypeMap = createLowerCasePrototypeMap(nodePrototypeMap);
        let lowercasePropertyPrototypeMap = createLowerCasePrototypeMap(propertyPrototypeMap);

        const classes = combineClassesOrProperties(ontologyData.class, ontologyData.classAttribute, lowercaseNodePrototypeMap, combineClasses),
            datatypes = combineClassesOrProperties(ontologyData.datatype, ontologyData.datatypeAttribute, lowercaseNodePrototypeMap, combineClasses),
            combinedClassesAndDatatypes = classes.concat(datatypes),
            unparsedProperties = ontologyData.property || [],
            combinedProperties;

        // Inject properties for unions, intersections, ...
        addSetOperatorProperties(combinedClassesAndDatatypes, unparsedProperties);
        combinedProperties = combineClassesOrProperties(unparsedProperties, ontologyData.propertyAttribute, lowercasePropertyPrototypeMap, combineProperties);
        classMap = mapElements(combinedClassesAndDatatypes);
        propertyMap = mapElements(combinedProperties);
        mergeRangesOfEquivalentProperties(combinedProperties, combinedClassesAndDatatypes);

        // Process the graph data
        convertTypesToIris(combinedClassesAndDatatypes, ontologyData.namespace);
        convertTypesToIris(combinedProperties, ontologyData.namespace);
        nodes = createNodeStructure(combinedClassesAndDatatypes, classMap);
        properties = createPropertyStructure(combinedProperties, classMap, propertyMap);
    }

    /**
     * @return the preprocessed nodes
     */
    nodes() {
        return nodes;
    }

    /**
     * @returns the preprocessed properties
     */
    properties() {
        return properties;
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
        const options = graph.options();
        const loadingModule = options.loadingModule();

        if (!jsonObject && filename === undefined) {
            loadingModule.notValidJsonFile();
            return [undefined, isValidData];
        }

        if (!filename) {
            // First look if an ontology title exists, otherwise take the alternative filename
            // @ts-ignore
            const ontologyNames = jsonObject.header ? jsonObject.header.title : undefined;
            const ontologyName = languageTools.textInLanguage(ontologyNames);

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
     */
    #combineClassesOrProperties(baseObjects, attributes, prototypeMap, callable) {
        let combinations = [];

        if (baseObjects) {
            let classMap = new Map();
            if (attributes) {
                for (let i = 0; i < attributes.length; i++) {
                    classMap.set(attributes[i].id, attributes[i]);
                }
            }

            baseObjects.forEach(function (element) {
                let matchingAttribute;
                if (attributes) {
                    // Look for an attribute with the same id and merge them
                    matchingAttribute = classMap.get(element.id);
                    addAdditionalAttributes(element, matchingAttribute);
                }

                // Then look for a prototype to add its properties
                let Prototype = prototypeMap.get(element.type.toLowerCase());
                if (Prototype) {
                    // addAdditionalAttributes(element, Prototype); // TODO might be unnecessary
                    let object = callable(element, Prototype);
                    //class element pin
                    if (element.pinned === true) {
                        object.pinned = true;
                        graph.options().pickAndPinModule().addPinnedElement(object);
                    }
                    if (element.attributes) {
                        object.attributes = element.attributes.concat(object.attributes);
                    }
                    combinations.push(object);
                } else {
                    console.error("Unknown element type: " + element.type);
                }
            });
        }
        return combinations;
    }

    #combineClasses(element, Prototype) {
        let node = new Prototype(graph);
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
            element.individuals.forEach(function (individual) {
                let individualNode = new Prototype(graph);
                individualNode.label = individual.labels;
                individualNode.iri = individual.iri;
                node.individuals.push(individualNode);
            });
        }
        return node;
    }

    #combineProperties(element, Prototype) {
        let property = new Prototype(graph);
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
        return property;
    }

    #createLowerCasePrototypeMap(prototypeMap) {
        return d3.map(prototypeMap.values(), function (Prototype) { // FIXME: Check Map docs
            return new Prototype().type.toLowerCase();
        });
    }

    /**
     * @param {BaseProperty[]} properties
     * @param {BaseNode[]} nodes
     */
    #mergeRangesOfEquivalentProperties(properties, nodes) {
        // pass clones of arrays into the merger to keep the current functionality of this module
        const newNodes = equivalentPropertyMerger.merge(properties.slice(), nodes.slice(), this.propertyMap, this.classMap, this.graph);

        // replace all the existing nodes and map the nodes again
        nodes.length = 0;
        Array.prototype.push.apply(nodes, newNodes);
        this.classMap = this.#mapElements(nodes);
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
            attributeParser.parseClassAttributes(node);
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
            attributeParser.parsePropertyAttributes(property);
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
     * @param classes unprocessed classes
     * @param properties unprocessed properties
     */
    #addSetOperatorProperties(classes, properties) {
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

        for (const cls of classes) {
            addProperties(cls.id, cls.complement, "COMPLEMENT");
            addProperties(cls.id, cls.intersection, "INTERSECTION");
            addProperties(cls.id, cls.union, "UNION");
            addProperties(cls.id, cls.disjointUnion, "DISJOINTUNION");
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
     * @param elements classes or properties
     * @param namespaces an array of namespaces
     */
    #convertTypesToIris(elements, namespaces) {
        for (const element of elements) {
            if (typeof element.iri === "string") {
                element.iri = this.#replaceNamespace(element.iri, namespaces);
            }
        }
    }

    /**
     * Creates a map by mapping the array with the passed function.
     * @param array the array
     */
    #mapElements(array) {
        const map = {};
        for (const i = 0, length = array.length; i < length; i++) {
            const element = array[i];
            map[element.id] = element;
        }
        return map;
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
                base[addAttribute] = addition[addAttribute];
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