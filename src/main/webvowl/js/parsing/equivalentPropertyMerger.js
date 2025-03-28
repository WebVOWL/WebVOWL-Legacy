let OwlThing = require("../elements/nodes/implementations/OwlThing");
let RdfsLiteral = require("../elements/nodes/implementations/RdfsLiteral");
let elementTools = require("../util/elementTools")();

let equivalentPropertyMerger = {};
module.exports = function () {
    return equivalentPropertyMerger;
};

let PREFIX = "GENERATED-MERGED_RANGE-";
let OBJECT_PROPERTY_DEFAULT_RANGE_TYPE = "owl:Thing";
let DATA_PROPERTY_DEFAULT_RANGE_TYPE = "rdfs:Literal";


equivalentPropertyMerger.merge = function (properties, nodes, propertyMap, nodeMap, graph) {
    let totalNodeIdsToHide = new Set();
    let processedPropertyIds = new Set();
    let mergeNodes = [];

    for (let i = 0; i < properties.length; i++) {
        let property = properties[i];
        let equivalents = property.equivalents().map(createIdToPropertyMapper(propertyMap));

        if (equivalents.length === 0 || processedPropertyIds.has(property.id())) {
            continue;
        }

        let propertyWithEquivalents = equivalents.concat(property);

        let mergeNode = findMergeNode(propertyWithEquivalents, nodeMap);
        if (!mergeNode) {
            if (mergeNode !== undefined) {
                mergeNode = createDefaultMergeNode(property, graph);
                mergeNodes.push(mergeNode);
            }
        }

        let nodeIdsToHide = replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties,
            processedPropertyIds);
        for (let j = 0; j < nodeIdsToHide.length; j++) {
            totalNodeIdsToHide.add(nodeIdsToHide[j]);
        }
    }
    return filterVisibleNodes(nodes.concat(mergeNodes), totalNodeIdsToHide);
};

function createIdToPropertyMapper(propertyMap) {
    return function (id) {
        return propertyMap[id];
    };
}

function findMergeNode(propertyWithEquivalents, nodeMap) {
    let typeMap = mapPropertiesRangesToType(propertyWithEquivalents, nodeMap);
    let typeSet = new Set(typeMap.keys());

    // default types are the fallback values and should be ignored for the type determination
    typeSet.remove(OBJECT_PROPERTY_DEFAULT_RANGE_TYPE);
    typeSet.remove(DATA_PROPERTY_DEFAULT_RANGE_TYPE);

    // exactly one type to chose from -> take the node of this type as range
    if (typeSet.size === 1) {
        let type = typeSet.values()[0];
        let ranges = typeMap.get(type);

        if (ranges.length === 1) {
            return ranges[0];
        }
    }
}

function mapPropertiesRangesToType(properties, nodeMap) {
    let typeMap = new Map();
    properties.forEach(function (property) {
        if (property === undefined) { //@ WORKAROUND
            return;
        }
        let range = nodeMap[property.range()];
        let type = range.type();
        if (!typeMap.get(type)) {
            typeMap.set(type, []);
        }
        typeMap.get(type).push(range);
    });
    return typeMap;
}

function createDefaultMergeNode(property, graph) {
    let range;
    if (elementTools.isDatatypeProperty(property)) {
        range = new RdfsLiteral(graph);
    } else {
        range = new OwlThing(graph);
    }
    range.id(PREFIX + property.id());
    return range;
}

function replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties, processedPropertyIds) {
    let nodesToHide = [];
    propertyWithEquivalents.forEach(function (property) {
        if (property === undefined || mergeNode === undefined) { // @ WORKAROUND
            return;
        }
        let oldRangeId = property.range();
        property.range(mergeNode.id());
        if (!isDomainOrRangeOfOtherProperty(oldRangeId, properties)) {
            nodesToHide.push(oldRangeId);
        }

        processedPropertyIds.add(property.id());
    });
    return nodesToHide;
}

function isDomainOrRangeOfOtherProperty(nodeId, properties) {
    for (let i = 0; i < properties.length; i++) {
        let property = properties[i];
        if (property.domain() === nodeId || property.range() === nodeId) {
            return true;
        }
    }
    return false;
}

function filterVisibleNodes(nodes, nodeIdsToHide) {
    let filteredNodes = [];
    nodes.forEach(function (node) {
        if (!nodeIdsToHide.has(node.id())) {
            filteredNodes.push(node);
        }
    });
    return filteredNodes;
}
