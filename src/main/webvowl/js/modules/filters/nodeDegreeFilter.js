import { PlainLink } from '../../elements/links/PlainLink';
import { BaseNode } from '../../elements/nodes/BaseNode';
import { BaseProperty } from '../../elements/properties/BaseProperty';
import { ElementTools } from '../../util/elementTools';
import { FilterTools } from '../../util/filterTools';
import { AbstractFilter } from './abstractFilter';


export class NodeDegreeFilter extends AbstractFilter {
    NODE_COUNT_LIMIT_FOR_AUTO_ENABLING = 50;

    constructor(menu) {
        super(true)
        this.menu = menu
        this.maxDegree = undefined
        this.lastFiltedDegree = -1
        /**
         * @type {Function | undefined}
         */
        this.maxDegreeSetter = undefined
        /**
         * @type {Function | undefined}
         */
        this.degreeGetter = undefined
        /**
         * @type {Function | undefined}
         */
        this.degreeSetter = undefined
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    initialize(nodes, properties) {
        this.lastFiltedDegree = -1;
        const linkCounts = this.#findLinkCounts(nodes);
        const maxLinkCount = linkCounts[0];
        if (this.maxDegreeSetter instanceof Function) {
            this.maxDegreeSetter(maxLinkCount);
        }

        this.menu.setDefaultDegreeValue(this.#findAutoDefaultDegree(nodes, properties, maxLinkCount, linkCounts));
        if (this.degreeSetter instanceof Function) {
            const defaultDegree = this.#findDefaultDegree(maxLinkCount);
            this.degreeSetter(defaultDegree);
            if (defaultDegree > 0) {
                this.menu.highlightForDegreeSlider(true);
                this.menu.getGraphObject().setFilterWarning(true);
            }
        } else {
            console.error("No degree setter function set.");
        }
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     * @param {number} maxDegree
     * @param {any[]} linkCounts
     */
    #findAutoDefaultDegree(nodes, properties, maxDegree, linkCounts) {
        //checks if an array of integers in descending order representing how many nodes a node has is less than count limit. If not it takes
        try {
            if (linkCounts.length < this.NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
                const filteredData = this.#filterByNodeDegree(nodes, properties, 0);
                if (filteredData.nodes.length <= this.NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
                    return 0;
                }
            } else {
                const degree = linkCounts[this.NODE_COUNT_LIMIT_FOR_AUTO_ENABLING - 1];
                const filteredData = this.#filterByNodeDegree(nodes, properties, degree);
                if (filteredData.nodes.length <= this.NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
                    return degree;
                } else {
                    return degree + 1;
                }
            }
        } catch (error) {
            console.error(error);
        }
        console.log("Cannot determine degree of collapse. Value is set to max to avoid a crash.")
        return maxDegree;
    }

    /**
     * @param {number} maxDegree
     */
    #findDefaultDegree(maxDegree) {
        const globalDegOfFilter = this.menu.getGraphObject().getGlobalDOF();
        if (globalDegOfFilter >= 0) {
            if (globalDegOfFilter <= maxDegree) {
                return globalDegOfFilter;
            } else {
                this.menu.getGraphObject().setGlobalDOF(maxDegree);
                return maxDegree;
            }
        }
        return this.menu.getDefaultDegreeValue();
    }

    /**
     * If enabled, all nodes are filter by their node degree.
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (this.enabled) {
            if (this.degreeGetter instanceof Function) {
                const filteredData = this.#filterByNodeDegree(nodes, properties, this.degreeGetter());
                this.filteredNodes = filteredData.nodes;
                this.filteredProperties = filteredData.properties;
                if (this.filteredNodes.length === 0) {
                    this.degreeSetter(0);
                    this.filteredNodes = nodes;
                    this.filteredProperties = properties;
                }
                this.lastFiltedDegree = this.degreeGetter();
            } else {
                console.error("No degree query function set.");
            }
        }
    }

    /**
     * @param {BaseNode[]} nodes
     */
    #findLinkCounts(nodes) {
        let nodeLinkCounts = [];
        for (const node of nodes) {
            const linksWithoutDatatypes = this.#filterOutDatatypes(node.links);
            nodeLinkCounts.push(linksWithoutDatatypes.length);
        }
        nodeLinkCounts.sort((a, b) => a - b);
        nodeLinkCounts.reverse();
        return nodeLinkCounts;
    }

    /**
     * @param {PlainLink[]} links
     */
    #filterOutDatatypes(links) {
        let filteredLinks = []
        for (const link of links) {
            if (!ElementTools.isDatatypeProperty(link.property)) {
                filteredLinks.push(link)
            }
        }
        return filteredLinks
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     * @param {number} minDegree
     */
    #filterByNodeDegree(nodes, properties, minDegree) {
        return FilterTools.filterNodesAndTidy(nodes, properties, this.#hasRequiredDegree(minDegree));
    }

    /**
     * @param {number} minDegree
     */
    #hasRequiredDegree(minDegree) {
        const _this = this
        return function (/** @type {BaseNode} */ node) {
            return _this.#filterOutDatatypes(node.links).length >= minDegree;
        };
    }
}