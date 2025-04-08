/**
 * A label represents the element(s) which further describe a link.
 * It encapsulates the property and its inverse property.
 * @param property the property; the inverse is inferred
 * @param link the link this label belongs to
 */
export class Label {
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

    actualRadius() {
        return this.property.smallestRadius;
    }

    draw(container) {
        return this.property.draw(container);
    }

    equals(other) {
        if (!other) {
            return false;
        }
        const isInstance = other instanceof Label;
        const equalProperty = this.property.equals(other.property);
        var equalInverse = false;
        if (this.property.inverse) {
            equalInverse = this.property.inverse.equals(other.inverse);
        } else if (!other.inverse) {
            equalInverse = true;
        }
        return isInstance && equalProperty && equalInverse;
    }
}