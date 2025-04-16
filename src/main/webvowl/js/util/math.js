
/**
 * Contains a collection of mathematical functions with some additional data
 * used for WebVOWL.
 */
export default class MathUtils {
    // @ts-ignore
    static loopFunction = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate("cardinal")
        .tension(-1);

    /**
     * Get the radian of `angle`
     * @param {number} angle
     */
    static #calculateRadian(angle) {
        angle = angle % 360;
        if (angle < 0) {
            angle = angle + 360;
        }
        return (Math.PI * angle) / 180;
    }

    /**
     * Get the angle of `radian`
     * @param {number} radian
     */
    static #calculateAngle(radian) {
        return radian * (180 / Math.PI);
    }

    /**
     * Calculates the normal vector of the path between the two nodes.
     * @param {{ x: number; y: number; }} source the first node
     * @param {{ x: number; y: number; }} target the second node
     * @param {number} length the length of the calculated normal vector
     * @returns {{ x: number; y: number; }}
     */
    static calculateNormalVector(source, target, length) {
        const dx = target.x - source.x,
            dy = target.y - source.y;

        const nx = -dy,
            ny = dx;

        const vlength = Math.sqrt(nx * nx + ny * ny);

        const ratio = vlength !== 0 ? length / vlength : 0;

        return { "x": nx * ratio, "y": ny * ratio };
    }

    /**
     * Calculates the path for a link, if it is a loop. Currently only working for circular nodes.
     * @param {any} link the link
     */
    static getLoopPoints(link) {
        const node = link.domain;
        const label = link.label;

        const fairShareLoopAngle = 360 / link.loops.length;
        const fairShareLoopAngleWithMargin = fairShareLoopAngle * 0.8;
        let loopAngle = Math.min(60, fairShareLoopAngleWithMargin);

        if (label.increasedLoopAngle === true) {
            loopAngle = 120;
        }

        const dx = label.x - node.x;
        const dy = label.y - node.y;
        const labelRadian = Math.atan2(dy, dx);
        const labelAngle = this.#calculateAngle(labelRadian);

        const startAngle = labelAngle - loopAngle / 2;
        const endAngle = labelAngle + loopAngle / 2;

        const arcFrom = this.#calculateRadian(startAngle);
        const arcTo = this.#calculateRadian(endAngle);

        const x1 = Math.cos(arcFrom) * node.actualRadius();
        const y1 = Math.sin(arcFrom) * node.actualRadius();

        const x2 = Math.cos(arcTo) * node.actualRadius();
        const y2 = Math.sin(arcTo) * node.actualRadius();

        const fixPoint1 = { "x": node.x + x1, "y": node.y + y1 };
        const fixPoint2 = { "x": node.x + x2, "y": node.y + y2 };
        return [fixPoint1, fixPoint2];
    }

    /**
     * Calculates the path for a link, if it is a loop. Currently only working for circlular nodes.
     * @param {any} link the link
     * @returns {*} loop function
     */
    static calculateLoopPath(link) {
        return MathUtils.loopFunction(MathUtils.calculateLoopPoints(link));
    }

    /**
     * Calculates the path for a link, if it is a loop. Currently only working for circlular nodes.
     * @param {any} link the link
     */
    static calculateLoopPoints(link) {
        const points = MathUtils.getLoopPoints(link);
        return [points[0], link.label, points[1]];
    }

    /**
     * Calculates the point where the link between the source and target node
     * intersects the border of the target node.
     * @param {any} source the source node
     * @param {any} target the target node
     * @param {number} additionalDistance additional distance the
     * @returns {{ x: number; y: number; }}
     */
    static calculateIntersection(source, target, additionalDistance) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return { x: source.x, y: source.y };
        }

        const innerDistance = target.distanceToBorder(dx, dy);
        const ratio = (length - (innerDistance + additionalDistance)) / length;
        const x = dx * ratio + source.x;
        const y = dy * ratio + source.y;
        return { x: x, y: y };
    }

    /**
     * Calculates the position between the two points.
     * @param {{ x: number; y: number; }} firstPoint
     * @param {{ x: number; y: number; }} secondPoint
     * @returns {{ x: number; y: number; }}
     */
    static calculateCenter(firstPoint, secondPoint) {
        return {
            x: (firstPoint.x + secondPoint.x) / 2,
            y: (firstPoint.y + secondPoint.y) / 2
        };
    }
}