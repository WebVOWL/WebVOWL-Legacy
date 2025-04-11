import { BaseProperty } from "../properties/BaseProperty";
import { PlainLink } from "./PlainLink";

/**
 * A label represents the element(s) which further describe a link.
 * It encapsulates the property and its inverse property.
 */
export class Label {
    /**
     *
     * @param {BaseProperty} property the property; the inverse is inferred
     * @param {PlainLink} link the link this label belongs to
     */
    constructor(property, link) {
        this.frozen = property.frozen;
        this.locked = property.locked;
        this.pinned = property.pinned;
        this.link = link
        this.property = property
    }

    get fixed() {
        const inverseFixed = this.property.inverse ? this.property.inverse.fixed : false;
        return this.property.fixed || inverseFixed;
    }

    set fixed(v) {
        this.property.fixed = v;
        if (this.property.inverse) {
            this.property.inverse.fixed = v;
        }
    }

    get inverse() {
        return this.property.inverse;
    }

    actualRadius() {
        return this.property.smallestRadius;
    }

    /**
     * @param {any} container
     */
    draw(container) {
        return this.property.draw(container);
    }

    /**
     * @param {Label} other
     */
    equals(other) {
        if (!other) {
            return false;
        }
        const isInstance = other instanceof Label;
        const equalProperty = this.property.equals(other.property);
        var equalInverse = false;
        if (this.property.inverse) {
            equalInverse = this.property.inverse.equals(other.property.inverse);
        } else if (!other.property.inverse) {
            equalInverse = true;
        }
        return isInstance && equalProperty && equalInverse;
    }
}