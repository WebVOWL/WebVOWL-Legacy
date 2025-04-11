import { ArrowLink } from '../elements/links/ArrowLink';
import { BoxArrowLink } from '../elements/links/BoxArrowLink';
import { PlainLink } from '../elements/links/PlainLink';
import { BaseProperty } from '../elements/properties/BaseProperty';
import { OwlDisjointWith } from '../elements/properties/implementations/OwlDisjointWith';
import { SetOperatorProperty } from '../elements/properties/implementations/SetOperatorProperty';

/**
 * Stores the passed properties in links.
 * @returns {Function}
 */
export class LinkCreator {
    /**
     * Creates links from the passed properties.
     * @param {BaseProperty[]} properties
     */
    static createLinks(properties) {
        const links = this.#groupPropertiesToLinks(properties);
        let layerCounts = new Map();
        let loopMap = new Map();

        for (const link of links) {
            const sortedKey = [link.domain.id, link.range.id].sort().join('|');
            layerCounts.set(sortedKey, (layerCounts.get(sortedKey) || 0) + 1);

            if (link.domain === link.range) {
                const loopKey = link.domain;
                let loops = loopMap.get(loopKey);
                if (loops) {
                    loops.push(link);
                } else {
                    loopMap.set(loopKey, new Array(link));
                }
            }
        }

        for (const link of links) {
            const sortedKey = [link.domain.id, link.range.id].sort().join('|');
            const layerCount = layerCounts.get(sortedKey);
            link.layers = layerCount;

            if (link.domain === link.range) {
                const loops = loopMap.get(link.domain);
                link.loops = loops;
                link.loopIndex = loops.findIndex((/** @type {any} */ element) => element === link);
            }
        }
        return links;
    }

    /**
     * Creates links of properties and - if existing - their inverses.
     * @param {BaseProperty[]} properties the properties
     */
    static #groupPropertiesToLinks(properties) {
        let links = [];
        let addedProperties = new Set();

        for (const property of properties) {
            if (!addedProperties.has(property.id)) {
                const link = this.#createLink(property);
                property.link = link;
                if (property.inverse) {
                    property.inverse.link = link;
                }
                links.push(link);
                addedProperties.add(property.id);
                if (property.inverse) {
                    addedProperties.add(property.inverse.id);
                }
            }
        }
        return links;
    }

    /**
     * @param {BaseProperty} property
     */
    static #createLink(property) {
        const domain = property.domain;
        const range = property.range;

        if (property instanceof OwlDisjointWith) {
            return new PlainLink(domain, range, property);
        } else if (property instanceof SetOperatorProperty) {
            return new BoxArrowLink(domain, range, property);
        }
        return new ArrowLink(domain, range, property);
    }
}