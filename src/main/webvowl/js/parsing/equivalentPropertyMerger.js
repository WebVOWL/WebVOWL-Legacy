import { OwlThing } from '../elements/nodes/implementations/OwlThing';
import { RdfsLiteral } from '../elements/nodes/implementations/RdfsLiteral';
import elementToolsFactory from '../util/elementTools';
const elementTools = elementToolsFactory();


const PREFIX = "GENERATED-MERGED_RANGE-"
const OBJECT_PROPERTY_DEFAULT_RANGE_TYPE = "owl:Thing"
const DATA_PROPERTY_DEFAULT_RANGE_TYPE = "rdfs:Literal"


export class EquivalentPropertyMerger {
    /**
     * @param {Array} properties
     * @param {Array} nodes
     * @param {Object} propertyMap
     * @param {Object} nodeMap
     * @param {Object} graph
     * @returns
     */
    static merge(properties, nodes, propertyMap, nodeMap, graph) {
        var totalNodeIdsToHide = new Set();
        var processedPropertyIds = new Set();
        var mergeNodes = [];

        for (const property of properties) {
            const equivalents = property.equivalents.map(this.#createIdToPropertyMapper(propertyMap));

            if (equivalents.length === 0 || processedPropertyIds.has(property.id)) {
                continue;
            }

            const propertyWithEquivalents = equivalents.concat(property);
            var mergeNode = this.#findMergeNode(propertyWithEquivalents, nodeMap);

            if (!mergeNode) {
                if (mergeNode !== undefined) {
                    mergeNode = this.#createDefaultMergeNode(property, graph);
                    mergeNodes.push(mergeNode);
                }
            }

            // FIXME: This call makes this function's runtime O(n^2) w.r.t. properties
            const nodeIdsToHide = this.#replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties, processedPropertyIds);
            for (const hiddenNodeID of nodeIdsToHide) {
                totalNodeIdsToHide.add(hiddenNodeID);
            }
        }
        // FIXME: This call can be optimized away and replaced with info from `nodes` of this function
        return this.#filterVisibleNodes(nodes.concat(mergeNodes), totalNodeIdsToHide);
    }

    static #createIdToPropertyMapper(propertyMap) {
        return function (id) {
            return propertyMap[id];
        };
    }

    static #findMergeNode(propertyWithEquivalents, nodeMap) {
        var typeMap = this.#mapPropertiesRangesToType(propertyWithEquivalents, nodeMap);
        var typeSet = new Set(typeMap.keys());

        // default types are the fallback values and should be ignored for the type determination
        typeSet.delete(OBJECT_PROPERTY_DEFAULT_RANGE_TYPE);
        typeSet.delete(DATA_PROPERTY_DEFAULT_RANGE_TYPE);

        // exactly one type to chose from -> take the node of this type as range
        if (typeSet.size === 1) {
            var type = typeSet.values()[0];
            var ranges = typeMap.get(type);

            if (ranges.length === 1) {
                return ranges[0];
            }
        }
    }

    /**
     *
     * @param {Array} properties
     * @param {Object} nodeMap
     * @returns {Map}
     */
    static #mapPropertiesRangesToType(properties, nodeMap) {
        var typeMap = new Map();
        for (const property of properties) {
            if (property === undefined) {
                //@ WORKAROUND
                throw new TypeError(`Property cannot be '${property}' in this context`)
            }
            const range = nodeMap[property.range];
            const type = range.type;

            if (!typeMap.has(type)) {
                typeMap.set(type, []);
            }
            typeMap.get(type).push(range);
        }
        return typeMap;
    }

    static #createDefaultMergeNode(property, graph) {
        var range;
        if (elementTools.isDatatypeProperty(property)) {
            range = new RdfsLiteral(graph);
        } else {
            range = new OwlThing(graph);
        }
        range.id = PREFIX + property.id;
        return range;
    }

    static #replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties, processedPropertyIds) {
        var nodesToHide = [];

        for (let property of propertyWithEquivalents) {
            if (property === undefined || mergeNode === undefined) {
                //@ WORKAROUND
                throw new TypeError(`Property (${property}) and mergeNode (${mergeNode}) cannot be undefined in this context`)
            }
            var oldRangeId = property.range;
            property.range = mergeNode.id;
            if (!this.#isDomainOrRangeOfOtherProperty(oldRangeId, properties)) {
                nodesToHide.push(oldRangeId);
            }
            processedPropertyIds.add(property.id);
        }
        return nodesToHide;
    }

    static #isDomainOrRangeOfOtherProperty(nodeId, properties) {
        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            if (property.domain === nodeId || property.range === nodeId) {
                return true;
            }
        }
        return false;
    }

    static #filterVisibleNodes(nodes, nodeIdsToHide) {
        var filteredNodes = [];
        nodes.forEach(function (node) {
            if (!nodeIdsToHide.has(node.id)) {
                filteredNodes.push(node);
            }
        });
        return filteredNodes;
    }
}