let OwlDisjointWith = require("./elements/properties/implementations/OwlDisjointWith");
let attributeParser = require("./parsing/attributeParser")();
let equivalentPropertyMerger = require("./parsing/equivalentPropertyMerger")();
let nodePrototypeMap = require("./elements/nodes/nodeMap")();
let propertyPrototypeMap = require("./elements/properties/propertyMap")();

/**
 * Encapsulates the parsing and preparation logic of the input data.
 * @param graph the graph object that will be passed to the elements
 * @returns {{}}
 */
module.exports = function (graph) {
    let parser = {},
        nodes,
        properties,
        classMap,
        settingsData,
        settingsImported = false,
        settingsImportGraphZoomAndTranslation = false,
        dictionary = [],
        propertyMap,
        NodePrototypeMap,
        PropertyPrototypeMap;

    parser.getDictionary = function () {
        return dictionary;
    };

    parser.setDictionary = function (d) {
        dictionary = d;
    };

    parser.settingsImported = function () {
        return settingsImported;
    };
    parser.settingsImportGraphZoomAndTranslation = function () {
        return settingsImportGraphZoomAndTranslation;
    };

    parser.getLowerCaseNodePrototypeMap = function () {
        return NodePrototypeMap;
    };

    parser.getLowerCasePropertyPrototypeMap = function () {
        return PropertyPrototypeMap;
    };

    parser.parseSettings = function () {
        settingsImported = true;
        settingsImportGraphZoomAndTranslation = false;

        if (!settingsData) {
            settingsImported = false;
            return;
        }
        /** global settings **********************************************************/
        if (settingsData.global) {
            if (settingsData.global.zoom) {
                let zoomFactor = settingsData.global.zoom;
                graph.setZoom(zoomFactor);
                settingsImportGraphZoomAndTranslation = true;
            }

            if (settingsData.global.translation) {
                let translation = settingsData.global.translation;
                graph.setTranslation(translation);
                settingsImportGraphZoomAndTranslation = true;
            }

            if (settingsData.global.paused) {
                let paused = settingsData.global.paused;
                graph.options().pausedMenu().setPauseValue(paused);
            }
        }
        /** Gravity Settings  **********************************************************/
        if (settingsData.gravity) {
            if (settingsData.gravity.classDistance) {
                let classDistance = settingsData.gravity.classDistance;
                graph.options().classDistance(classDistance);
            }
            if (settingsData.gravity.datatypeDistance) {
                let datatypeDistance = settingsData.gravity.datatypeDistance;
                graph.options().datatypeDistance(datatypeDistance);
            }
            graph.options().gravityMenu().reset(); // reads the options values and sets the gui values
        }
        /** Filter Settings **********************************************************/
        if (settingsData.filter) {
            // checkbox settings
            if (settingsData.filter.checkBox) {
                let filter_cb = settingsData.filter.checkBox;
                for (let i = 0; i < filter_cb.length; i++) {
                    let id = filter_cb[i].id;
                    let checked = filter_cb[i].checked;
                    graph.options().filterMenu().setCheckBoxValue(id, checked);
                }
            }
            // node degree filter settings
            if (settingsData.filter.degreeSliderValue) {
                let degreeSliderValue = settingsData.filter.degreeSliderValue;
                graph.options().filterMenu().setDegreeSliderValue(degreeSliderValue);
            }
            graph.options().filterMenu().updateSettings();
        }

        /** Modes Setting **********************************************************/
        if (settingsData.modes) {
            // checkbox settings
            if (settingsData.modes.checkBox) {
                let modes_cb = settingsData.modes.checkBox;
                for (let i = 0; i < modes_cb.length; i++) {
                    let id = modes_cb[i].id;
                    let checked = modes_cb[i].checked;
                    graph.options().modeMenu().setCheckBoxValue(id, checked);
                }
            }
            // color switch settings
            let state = settingsData.modes.colorSwitchState;
            // state could be undefined
            if (state === true || state === false) {
                graph.options().modeMenu().setColorSwitchState(state);
            }
            graph.options().modeMenu().updateSettings();
        }
        graph.updateStyle(); // updates graph representation(setting charges and distances)
    };

    /**
     * Parses the ontology data and preprocesses it (e.g. connecting inverse properties and so on).
     * @param ontologyData the loaded ontology json file
     */
    parser.parse = function (ontologyData) {
        if (!ontologyData) {
            nodes = [];
            properties = [];
            dictionary = [];
            return;
        }
        dictionary = [];
        settingsData = ontologyData.settings ? ontologyData.settings : undefined

        NodePrototypeMap = createLowerCasePrototypeMap(nodePrototypeMap);
        PropertyPrototypeMap = createLowerCasePrototypeMap(propertyPrototypeMap);

        let classes = combineClassesOrProperties(ontologyData.class, ontologyData.classAttribute, NodePrototypeMap, combineClasses),
            datatypes = combineClassesOrProperties(ontologyData.datatype, ontologyData.datatypeAttribute, NodePrototypeMap, combineClasses),
            combinedClassesAndDatatypes = classes.concat(datatypes),
            unparsedProperties = ontologyData.property || [],
            combinedProperties;

        // Inject properties for unions, intersections, ...
        addSetOperatorProperties(combinedClassesAndDatatypes, unparsedProperties);
        combinedProperties = combineClassesOrProperties(unparsedProperties, ontologyData.propertyAttribute, PropertyPrototypeMap, combineProperties);
        classMap = mapElements(combinedClassesAndDatatypes);
        propertyMap = mapElements(combinedProperties);
        mergeRangesOfEquivalentProperties(combinedProperties, combinedClassesAndDatatypes);

        // Process the graph data
        convertTypesToIris(combinedClassesAndDatatypes, ontologyData.namespace);
        convertTypesToIris(combinedProperties, ontologyData.namespace);
        nodes = createNodeStructure(combinedClassesAndDatatypes, classMap);
        properties = createPropertyStructure(combinedProperties, classMap, propertyMap);
    };

    /**
     * @return {Array} the preprocessed nodes
     */
    parser.nodes = function () {
        return nodes;
    };

    /**
     * @returns {Array} the preprocessed properties
     */
    parser.properties = function () {
        return properties;
    };


    /**
     * Combines the passed objects with its attributes and prototypes. This also applies
     * attributes defined in the base of the prototype.
     */
    function combineClassesOrProperties(baseObjects, attributes, prototypeMap, callable) {
        let combinations = [];
        let classMap = new Map();

        if (attributes) {
            for (let i = 0; i < attributes.length; i++) {
                classMap.set(attributes[i].id, attributes[i]);
            }
        }

        if (baseObjects) {
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
                        object.pinned(true);
                        graph.options().pickAndPinModule().addPinnedElement(object);
                    }
                    if (element.attributes) {
                        let deduplicatedAttributes = new Set(element.attributes.concat(object.attributes()));
                        object.attributes(deduplicatedAttributes.values());
                    }
                    combinations.push(object);
                } else {
                    console.error("Unknown element type: " + element.type);
                }
            });
        }
        return combinations;
    }

    function combineClasses(element, Prototype) {
        let node = new Prototype(graph);
        node.annotations(element.annotations)
            .baseIri(element.baseIri)
            .comment(element.comment)
            .complement(element.complement)
            .disjointUnion(element.disjointUnion)
            .description(element.description)
            .equivalents(element.equivalent)
            .id(element.id)
            .intersection(element.intersection)
            .label(element.label)
            // .type(element.type) Ignore, because we predefined it
            .union(element.union)
            .iri(element.iri);
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
                individualNode.label(individual.labels)
                    .iri(individual.iri);

                node.individuals().push(individualNode);
            });
        }
        return node;
    }

    function combineProperties(element, Prototype) {
        let property = new Prototype(graph);
        property.annotations(element.annotations)
            .baseIri(element.baseIri)
            .cardinality(element.cardinality)
            .comment(element.comment)
            .domain(element.domain)
            .description(element.description)
            .equivalents(element.equivalent)
            .id(element.id)
            .inverse(element.inverse)
            .label(element.label)
            .minCardinality(element.minCardinality)
            .maxCardinality(element.maxCardinality)
            .range(element.range)
            .subproperties(element.subproperty)
            .superproperties(element.superproperty)
            // .type(element.type) Ignore, because we predefined it
            .iri(element.iri);
        if (element.pos) {
            property.x = element.pos[0];
            property.y = element.pos[1];
            property.px = element.pos[0];
            property.py = element.pos[1];
        }
        return property;
    }

    function createLowerCasePrototypeMap(prototypeMap) {
        return new Map(prototypeMap.values(), function (value) {
            return value.toLowerCase();
        });
    }

    function mergeRangesOfEquivalentProperties(properties, nodes) {
        // pass clones of arrays into the merger to keep the current functionality of this module
        let newNodes = equivalentPropertyMerger.merge(properties.slice(), nodes.slice(), propertyMap, classMap, graph);

        // replace all the existing nodes and map the nodes again
        nodes.length = 0;
        Array.prototype.push.apply(nodes, newNodes);
        classMap = mapElements(nodes);
    }

    /**
     * Checks all attributes which have to be rewritten.
     * For example:
     * <b>equivalent</b> is filled with only ID's of the corresponding nodes. It would be better to used the
     * object instead of the ID so we swap the ID's with the correct object reference and can delete it from drawing
     * because it is not necessary.
     */
    function createNodeStructure(rawNodes, classMap) {
        let nodes = [];

        // Set the default values
        let maxIndividualCount = 0;
        rawNodes.forEach(function (node) {
            maxIndividualCount = Math.max(maxIndividualCount, node.individuals().length);
            node.visible(true);
        });

        rawNodes.forEach(function (node) {
            // Merge and connect the equivalent nodes
            processEquivalentIds(node, classMap);

            attributeParser.parseClassAttributes(node);

            node.maxIndividualCount(maxIndividualCount);
        });

        // Collect all nodes that should be displayed
        rawNodes.forEach(function (node) {
            if (node.visible()) {
                nodes.push(node);
            }
        });

        return nodes;
    }

    /**
     * Sets the disjoint attribute of the nodes if a disjoint label is found.
     * @param property
     */
    function processDisjoints(property) {
        if (property instanceof OwlDisjointWith === false) {
            return;
        }

        let domain = property.domain(),
            range = property.range();

        // Check the domain.
        if (!domain.disjointWith()) {
            domain.disjointWith([]);
        }

        // Check the range.
        if (!range.disjointWith()) {
            range.disjointWith([]);
        }

        domain.disjointWith().push(property.range());
        range.disjointWith().push(property.domain());
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
    function createPropertyStructure(rawProperties, classMap, propertyMap) {
        let properties = [];
        // Set default values
        rawProperties.forEach(function (property) {
            property.visible(true);
        });

        // Connect properties
        rawProperties.forEach(function (property) {
            let domain,
                range,
                domainObject,
                rangeObject,
                inverse;

            /* Skip properties that have no information about their domain and range, like
             inverse properties with optional inverse and optional domain and range attributes */
            if ((property.domain() && property.range()) || property.inverse()) {

                let inversePropertyId = findId(property.inverse());
                // Look if an inverse property exists
                if (inversePropertyId) {
                    inverse = propertyMap[inversePropertyId];
                    if (!inverse) {
                        console.warn("No inverse property was found for id: " + inversePropertyId);
                        property.inverse(undefined);
                    }
                }

                // Either domain and range are set on this property or at the inverse
                if (typeof property.domain() !== "undefined" && typeof property.range() !== "undefined") {
                    domain = findId(property.domain());
                    range = findId(property.range());

                    domainObject = classMap[domain];
                    rangeObject = classMap[range];
                } else if (inverse) {
                    // Domain and range need to be switched
                    domain = findId(inverse.range());
                    range = findId(inverse.domain());

                    domainObject = classMap[domain];
                    rangeObject = classMap[range];
                } else {
                    console.warn("Domain and range not found for property: " + property.id());
                }

                // Set the references on this property
                property.domain(domainObject);
                property.range(rangeObject);

                // Also set the attributes of the inverse property
                if (inverse) {
                    property.inverse(inverse);
                    inverse.inverse(property);

                    // Switch domain and range
                    inverse.domain(rangeObject);
                    inverse.range(domainObject);
                }
            }
            // Reference sub- and superproperties
            referenceSubOrSuperProperties(property.subproperties());
            referenceSubOrSuperProperties(property.superproperties());
        });

        // Merge equivalent properties and process disjoints.
        rawProperties.forEach(function (property) {
            processEquivalentIds(property, propertyMap);
            processDisjoints(property);

            attributeParser.parsePropertyAttributes(property);
        });
        // Add additional information to the properties
        rawProperties.forEach(function (property) {
            // Properties of merged classes should point to/from the visible equivalent class
            let propertyWasRerouted = false;

            if (property.domain() === undefined) {
                console.warn("No Domain was found for id:" + property.id());
                return;
            }

            if (wasNodeMerged(property.domain())) {
                property.domain(property.domain().equivalentBase());
                propertyWasRerouted = true;
            }
            if (property.range() === undefined) {
                console.warn("No range was found for id:" + property.id());
                return;
            }
            if (wasNodeMerged(property.range())) {
                property.range(property.range().equivalentBase());
                propertyWasRerouted = true;
            }

            if (propertyWasRerouted) {
                // But there should not be two equal properties between the same domain and range.
                let equalProperty = getOtherEqualProperty(rawProperties, property);
                if (equalProperty) {
                    property.visible(false);
                    equalProperty.redundantProperties().push(property);
                }
            }

            // Hide property if source or target node is hidden
            if (!property.domain().visible() || !property.range().visible()) {
                property.visible(false);
            }

            // Collect all properties that should be displayed
            if (property.visible()) {
                properties.push(property);
            }
        });
        return properties;
    }

    function referenceSubOrSuperProperties(subOrSuperPropertiesArray) {
        let i, l;

        if (!subOrSuperPropertiesArray) {
            return;
        }

        for (i = 0, l = subOrSuperPropertiesArray.length; i < l; ++i) {
            let subOrSuperPropertyId = findId(subOrSuperPropertiesArray[i]);
            let subOrSuperProperty = propertyMap[subOrSuperPropertyId];

            if (subOrSuperProperty) {
                // Replace id with object
                subOrSuperPropertiesArray[i] = subOrSuperProperty;
            } else {
                console.warn("No sub-/superproperty was found for id: " + subOrSuperPropertyId);
            }
        }
    }

    function wasNodeMerged(node) {
        return !node.visible() && node.equivalentBase();
    }

    function getOtherEqualProperty(properties, referenceProperty) {
        let i, l, property;

        for (i = 0, l = properties.length; i < l; i++) {
            property = properties[i];

            if (referenceProperty === property) {
                continue;
            }
            if (referenceProperty.domain() !== property.domain() ||
                referenceProperty.range() !== property.range()) {
                continue;
            }

            // Check for an equal IRI, if non existent compare label and type
            if (referenceProperty.iri() && property.iri()) {
                if (referenceProperty.iri() === property.iri()) {
                    return property;
                }
            } else if (referenceProperty.type() === property.type() &&
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
    function addSetOperatorProperties(classes, properties) {
        function addProperties(domainId, rangeIds, operatorType) {
            if (!rangeIds) {
                return;
            }

            rangeIds.forEach(function (rangeId, index) {
                let property = {
                    id: "GENERATED-" + operatorType + "-" + domainId + "-" + rangeId + "-" + index,
                    type: "setOperatorProperty",
                    domain: domainId,
                    range: rangeId
                };

                properties.push(property);
            });
        }

        classes.forEach(function (clss) {
            addProperties(clss.id(), clss.complement(), "COMPLEMENT");
            addProperties(clss.id(), clss.intersection(), "INTERSECTION");
            addProperties(clss.id(), clss.union(), "UNION");
            addProperties(clss.id(), clss.disjointUnion(), "DISJOINTUNION");
        });
    }

    /**
     * Replaces the ids of equivalent nodes/properties with the matching objects, cross references them
     * and tags them as processed.
     * @param element a node or a property
     * @param elementMap a map where nodes/properties can be looked up
     */
    function processEquivalentIds(element, elementMap) {
        let eqIds = element.equivalents();

        if (!eqIds || element.equivalentBase()) {
            return;
        }

        // Replace ids with the corresponding objects
        for (let i = 0, l = eqIds.length; i < l; ++i) {
            let eqId = findId(eqIds[i]);
            let eqObject = elementMap[eqId];

            if (eqObject) {
                // Cross reference both objects
                eqObject.equivalents(eqObject.equivalents());
                eqObject.equivalents().push(element);
                eqObject.equivalentBase(element);
                eqIds[i] = eqObject;

                // Hide other equivalent nodes
                eqObject.visible(false);
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
    function convertTypesToIris(elements, namespaces) {
        elements.forEach(function (element) {
            if (typeof element.iri() === "string") {
                element.iri(replaceNamespace(element.iri(), namespaces));
            }
        });
    }

    /**
     * Creates a map by mapping the array with the passed function.
     * @param array the array
     * @returns {{}}
     */
    function mapElements(array) {
        let map = {};
        for (let i = 0, length = array.length; i < length; i++) {
            let element = array[i];
            map[element.id()] = element;
        }
        return map;
    }

    /**
     * Adds the attributes of the additional object to the base object, but doesn't
     * overwrite existing ones.
     *
     * @param base the base object
     * @param addition the object with additional data
     * @returns the combination is also returned
     */
    function addAdditionalAttributes(base, addition) {
        // Check for an undefined value
        addition = addition || {};

        for (let addAttribute in addition) {
            // Add the attribute if it doesn't exist
            if (!(addAttribute in base) && addition.hasOwnProperty(addAttribute)) {
                base[addAttribute] = addition[addAttribute];
            }
        }
        return base;
    }

    /**
     * Replaces the namespace (and the separator) if one exists and returns the new value.
     * @param address the address with a namespace in it
     * @param namespaces an array of namespaces
     * @returns {string} the processed address with the (possibly) replaced namespace
     */
    function replaceNamespace(address, namespaces) {
        let separatorIndex = address.indexOf(":");
        if (separatorIndex === -1) {
            return address;
        }
        let namespaceName = address.substring(0, separatorIndex);

        for (let i = 0, length = namespaces.length; i < length; ++i) {
            let namespace = namespaces[i];
            if (namespaceName === namespace.name) {
                return namespace.iri + address.substring(separatorIndex + 1);
            }
        }

        return address;
    }

    /**
     * Looks whether the passed object is already the id or if it was replaced
     * with the object that belongs to the id.
     * @param object an id, a class or a property
     * @returns {string} the id of the passed object or undefined
     */
    function findId(object) {
        if (!object) {
            return undefined;
        } else if (typeof object === "string") {
            return object;
        } else if ("id" in object) {
            return object.id();
        } else {
            console.warn("No Id was found for this object: " + object);
            return undefined;
        }
    }

    return parser;
};
