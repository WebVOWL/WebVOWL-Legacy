import { BaseNode } from '../../elements/nodes/BaseNode';
import { BaseProperty } from '../../elements/properties/BaseProperty';
import { ElementTools } from '../../util/elementTools';
import { FilterTools } from '../../util/filterTools';
import { AbstractFilter } from './abstractFilter';


export class DataTypeFilter extends AbstractFilter {
    constructor() {
        super(false)
    }

    /**
     * If enabled, all datatypes and literals including connected properties are filtered.
     * This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (this.enabled) {
            const filteredData = FilterTools.filterNodesAndTidy(nodes, properties, this.#isNoDatatypeOrLiteral);
            this.filteredNodes = filteredData.nodes
            this.filteredProperties = filteredData.properties
        } else {
            this.filteredNodes = nodes;
            this.filteredProperties = properties;
        }
    }

    /**
     * @param {any} node
     */
    #isNoDatatypeOrLiteral(node) {
        return !ElementTools.isDatatype(node);
    }
}