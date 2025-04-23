import _ from "lodash"
import BaseElement from "../../elements/BaseElement"
import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import AbstractFilter from "./abstractFilter"

export default class ColorExternalsSwitch extends AbstractFilter {
    COLOR_MODES = [
        { type: "same", range: [d3.rgb("#36C"), d3.rgb("#36C")] },
        { type: "gradient", range: [d3.rgb("#36C"), d3.rgb("#EE2867")] }, // taken from LD-VOWL
    ]

    constructor() {
        super(true)
        this.colorModeType = "same"
    }

    // REVIEW: This does not filter anything. Check if this method can be combined in a class elsewhere
    /**
     * Applies color to "external" nodes or properties.
     * @note This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        let externalElementMap = new Map() // Maps baseIri to BaseElement[]

        for (const node of nodes) {
            if (this.#isExternalElement(node)) {
                this.#mapExternalsToBaseUri(node, externalElementMap)
            }
        }
        for (const property of properties) {
            // @ts-ignore
            if (this.#isExternalElement(property)) {
                // @ts-ignore
                this.#mapExternalsToBaseUri(property, externalElementMap)
            }
        }

        if (this.enabled) {
            this.#setColorsForExternals(externalElementMap)
        } else {
            this.#resetBackgroundColors(externalElementMap)
        }
        this.filteredNodes = nodes
        this.filteredProperties = properties
    }

    /**
     * @param {BaseElement} element
     */
    #isExternalElement(element) {
        // deprecated is the only attribute which has preference over external
        if (
            element.visualAttributes &&
            element.visualAttributes.indexOf("deprecated") >= 0
        ) {
            return false
        }
        if (element.attributes && element.attributes.indexOf("external") >= 0) {
            return true
        }
        return false
    }

    /**
     * @param {Map<string, BaseElement[]>} externalElementMap
     */
    #setColorsForExternals(externalElementMap) {
        const mapSize = externalElementMap.size
        const colorScale = d3.scale
            .linear()
            .domain([0, mapSize - 1])
            .range(_.find(this.COLOR_MODES, { type: this.colorModeType }).range)
            .interpolate(d3.interpolateHsl)

        let i = 0
        for (const groupedElements of externalElementMap.values()) {
            for (const element of groupedElements) {
                element.backgroundColor = colorScale(i)
            }
            i++
        }
    }

    /**
     * @param {BaseElement} element
     * @param {Map<string, BaseElement[]>} map
     */
    #mapExternalsToBaseUri(element, map) {
        const baseIri = element.baseIri
        if (!map.has(baseIri)) {
            map.set(baseIri, [])
        }
        map.get(baseIri).push(element)
        // return map; // REVIEW: Check if needed to return this
    }

    /**
     * @param {Map<string, BaseElement[]>} map
     */
    #resetBackgroundColors(map) {
        for (const groupedElements of map.values()) {
            for (const element of groupedElements) {
                element.backgroundColor = undefined
            }
        }
    }
}
