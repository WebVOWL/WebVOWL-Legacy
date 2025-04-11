import { BaseNode } from '../../elements/nodes/BaseNode';
import { BaseProperty } from '../../elements/properties/BaseProperty';
import { OwlDisjointWith } from '../../elements/properties/implementations/OwlDisjointWith';
import { AbstractFilter } from './abstractFilter';


export class DisjointFilter extends AbstractFilter {
    constructor() {
        super(true)
    }

    /**
     * If enabled, all disjointWith properties are filtered.
     * This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        this.filteredNodes = nodes;
        this.filteredProperties = properties;

        if (this.enabled) {
            this.filteredProperties = this.#removeDisjointWithProperties(properties);
        }
    }

    /**
     * @param {BaseProperty[]} properties
     */
    #removeDisjointWithProperties(properties) {
        let cleanedProperties = []
        for (const property of properties) {
            if (!(property instanceof OwlDisjointWith)) {
                cleanedProperties.push(property);
            }
        }
        return cleanedProperties;
    }
}