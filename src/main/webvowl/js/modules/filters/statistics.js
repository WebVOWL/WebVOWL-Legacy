import { BaseElement } from '../../elements/BaseElement';
import { BaseNode } from '../../elements/nodes/BaseNode';
import { OwlNothing } from '../../elements/nodes/implementations/OwlNothing';
import { SetOperatorNode } from '../../elements/nodes/SetOperatorNode';
import { BaseProperty } from '../../elements/properties/BaseProperty';
import { ElementTools } from '../../util/elementTools';
import { AbstractFilter } from './abstractFilter';


export class Statistics extends AbstractFilter {
    constructor() {
        super(true)

        // this.occurencesOfClassAndDatatypeTypes = {} // REVIEW: This is not used
        // this.occurencesOfPropertyTypes = {} // REVIEW: This is not used
        this.nodeCount = 0
        this.edgeCount = 0
        this.classCount = 0
        this.datatypeCount = 0 // REVIEW: This wants to be used but is not
        this.datatypePropertyCount = 0
        this.objectPropertyCount = 0
        this.propertyCount = 0 // REVIEW: This wants to be used but is not
        this.totalIndividualCount = 0
    }

    // REVIEW: This does not filter anything. Check if this method can be combined in a class elsewhere
    /**
     * @param {BaseNode[]} classesAndDatatypes
     * @param {BaseProperty[]} properties
     */
    filter(classesAndDatatypes, properties) {
        this.#resetStoredData();

        this.#storeTotalCounts(classesAndDatatypes, properties);
        this.#storeClassAndDatatypeCount(classesAndDatatypes);
        this.#storePropertyCount(properties);

        // this.#storeOccurencesOfTypes(classesAndDatatypes, this.occurencesOfClassAndDatatypeTypes);
        // // @ts-ignore
        // this.#storeOccurencesOfTypes(properties, this.occurencesOfPropertyTypes);

        this.#storeTotalIndividualCount(classesAndDatatypes);

        this.filteredNodes = classesAndDatatypes;
        this.filteredProperties = properties;
    }

    #resetStoredData() {
        this.nodeCount = 0;
        this.edgeCount = 0;
        this.classCount = 0;
        this.datatypeCount = 0;
        this.datatypePropertyCount = 0;
        this.objectPropertyCount = 0;
        this.propertyCount = 0;
        this.totalIndividualCount = 0;
    }

    /**
     * @param {any[]} classesAndDatatypes
     * @param {BaseProperty[]} properties
     */
    #storeTotalCounts(classesAndDatatypes, properties) {
        this.nodeCount = classesAndDatatypes.length;
        let seenProperties = new Set()

        for (const property of properties) {
            if (!seenProperties.has(property.id)) {
                this.edgeCount += 1;
            }
            seenProperties.add(property.id);
            if (property.inverse) {
                seenProperties.add(property.inverse.id);
            }
        }
    }

    /**
     * @param {BaseElement[]} classesAndDatatypes
     */
    #storeClassAndDatatypeCount(classesAndDatatypes) {
        // Each datatype should be counted just a single time
        let datatypeSet = new Set();
        let hasThing = false;
        let hasNothing = false;

        for (const node of classesAndDatatypes) {
            if (ElementTools.isDatatype(node)) {
                datatypeSet.add(node.defaultLabel());
            } else if (node instanceof SetOperatorNode) {
                this.classCount += 1;
            } else if (ElementTools.isThing(node)) {
                hasThing = true;
            } else if (node instanceof OwlNothing) {
                hasNothing = true;
            } else {
                // @ts-ignore
                this.classCount += 1 + this.#countElementArray(node.equivalents);
            }

            // REVIEW: Check whether Things should only be counted once
            // count things and nothings just a single time
            this.classCount += hasThing ? 1 : 0;
            this.classCount += hasNothing ? 1 : 0;
            this.datatypeCount = datatypeSet.size;
        }
    }

    /**
     * @param {BaseProperty[]} properties
     */
    #storePropertyCount(properties) {
        for (const property of properties) {
            let result = false;
            if (property.attributes) {
                const attr = property.attributes;
                if (attr && attr.indexOf("datatype") !== -1) {
                    result = true;
                }
            }
            if (result === true) {
                this.datatypePropertyCount += this.#getExtendedPropertyCount(property);
            } else if (ElementTools.isObjectProperty(property)) {
                this.objectPropertyCount += this.#getExtendedPropertyCount(property);
            }
        }
        this.propertyCount = this.objectPropertyCount + this.datatypePropertyCount;
    }

    /**
     * @param {BaseProperty} property
     */
    #getExtendedPropertyCount(property) {
        // count the property itself
        let count = 1;

        // and count properties this property represents
        count += this.#countElementArray(property.equivalents);
        count += this.#countElementArray(property.redundantProperties);
        return count;
    }

    /**
     * @param {BaseProperty[]} properties
     */
    #countElementArray(properties) {
        if (properties) {
            return properties.length;
        }
        return 0;
    }

    // NOTE: Disabled to save memory while this method is not used
    // /**
    //  * @param {BaseElement[]} elements
    //  * @param {{ [x: string]: any; }} storage
    //  */
    // #storeOccurencesOfTypes(elements, storage) {
    //     for (const element of elements) {
    //         const type = element.type
    //         let typeCount = storage[type]
    //         if (typeCount === undefined) {
    //             typeCount = 0;
    //         } else {
    //             typeCount += 1;
    //         }
    //         storage[type] = typeCount;
    //     }
    // }

    /**
     * @param {BaseNode[]} nodes
     */
    #storeTotalIndividualCount(nodes) {
        let sawIndividuals = new Set();
        for (const node of nodes) {
            for (const individual of node.individuals) {
                if (!sawIndividuals.has(individual.iri)) {
                    sawIndividuals.add(individual.iri)
                }
            }
        }
        this.totalIndividualCount = sawIndividuals.size;
    }
}