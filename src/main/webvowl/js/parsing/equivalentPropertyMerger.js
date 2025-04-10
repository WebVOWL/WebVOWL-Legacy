import { BaseNode } from '../elements/nodes/BaseNode';
import { OwlThing } from '../elements/nodes/implementations/OwlThing';
import { RdfsLiteral } from '../elements/nodes/implementations/RdfsLiteral';
import { BaseProperty } from '../elements/properties/BaseProperty';
import { ElementTools } from '../util/elementTools';


const PREFIX = "GENERATED-MERGED_RANGE-"
const OBJECT_PROPERTY_DEFAULT_RANGE_TYPE = "owl:Thing"
const DATA_PROPERTY_DEFAULT_RANGE_TYPE = "rdfs:Literal"


export class EquivalentPropertyMerger {
    /**
     * @param {BaseProperty[]} properties
     * @param {BaseNode[]} nodes
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

    /**
     * @param {{ [x: string]: any; }} propertyMap
     */
    static #createIdToPropertyMapper(propertyMap) {
        return function (/** @type {string | number} */ id) {
            return propertyMap[id];
        };
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     * @param {{}} nodeMap
     */
    static #findMergeNode(propertyWithEquivalents, nodeMap) {
        var typeMap = this.#mapPropertiesRangesToType(propertyWithEquivalents, nodeMap);
        var typeSet = new Set(typeMap.keys());

        // default types are the fallback values and should be ignored for the type determination
        typeSet.delete(OBJECT_PROPERTY_DEFAULT_RANGE_TYPE);
        typeSet.delete(DATA_PROPERTY_DEFAULT_RANGE_TYPE);

        // exactly one type to chose from -> take the node of this type as range
        if (typeSet.size === 1) {
            var type = typeSet.values().next();
            var ranges = typeMap.get(type);

            if (ranges.length === 1) {
                return ranges[0];
            }
        }
    }

    /**
     * @param {BaseProperty[]} properties
     * @param {{ [x: string]: any; }} nodeMap
     */
    static #mapPropertiesRangesToType(properties, nodeMap) {
        var typeMap = new Map();
        for (const property of properties) {
            if (property === undefined) {
                //@ WORKAROUND
                throw new TypeError(`Property cannot be '${property}' in this context`)
            }
            const range = nodeMap[property.range.id];
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
     * @param {any} graph
     */
    static #createDefaultMergeNode(property, graph) {
        var range;
        if (ElementTools.isDatatypeProperty(property)) {
            range = new RdfsLiteral(graph);
        } else {
            range = new OwlThing(graph);
        }
        range.id = PREFIX + property.id;
        return range;
    }

    /**
     * @param {BaseProperty[]} propertyWithEquivalents
     * @param {BaseNode} mergeNode
     * @param {BaseProperty[]} properties
     * @param {Set<string>} processedPropertyIds
     */
    static #replaceRangesAndCollectNodesToHide(propertyWithEquivalents, mergeNode, properties, processedPropertyIds) {
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
    static #isDomainOrRangeOfOtherProperty(nodeId, properties) {
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
    static #filterVisibleNodes(nodes, nodeIdsToHide) {
        var filteredNodes = [];
        for (const node of nodes) {
            if (!nodeIdsToHide.has(node.id)) {
                filteredNodes.push(node);
            }
        }
        return filteredNodes;
    }
}