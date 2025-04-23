import Graph from "../../graph"
import AbsoluteTextElement from "../../util/AbsoluteTextElement"
import DrawTools from "../drawTools"
import BoxArrowLink from "../links/BoxArrowLink"
import RoundNode from "./RoundNode"

export default class SetOperatorNode extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)
    }

    /**
     * @param {boolean} enable
     */
    setHoverHighlighting(enable) {
        super.setHoverHighlighting(enable)

        // Highlight links pointing to included nodes when hovering the set operator
        for (const link of this.links) {
            if (link instanceof BoxArrowLink && link.domain.equals(this)) {
                link.property.setHighlighting(enable)
            }
        }
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        this.nodeElement = element
        DrawTools.appendCircularClass(
            element,
            this.actualRadius(),
            this.collectCssClasses().join(" "),
            this.labelForCurrentLanguage(),
            this.backgroundColor,
        )
    }

    postDrawActions() {
        super.postDrawActions()
        this.textBlock.remove()

        const textElement = new AbsoluteTextElement(
            this.nodeElement,
            this.backgroundColor,
        )
        const equivalentsString = this.equivalentsString()
        const offsetForFollowingEquivalents = equivalentsString ? -30 : -17
        const suffixForFollowingEquivalents = equivalentsString ? "," : ""
        textElement.addText(
            this.labelForCurrentLanguage(),
            offsetForFollowingEquivalents,
            "",
            suffixForFollowingEquivalents,
        )

        textElement.addEquivalents(equivalentsString, -17)
        const individualsCount = this.individuals ? this.individuals.length : 0
        if (!this.graph.options.compactNotation) {
            if (this.indicationString().length > 0) {
                textElement.addSubText(this.indicationString(), 17)
                textElement.addInstanceCount(individualsCount, 30)
            } else {
                textElement.addInstanceCount(individualsCount, 17)
            }
        } else {
            textElement.addInstanceCount(individualsCount, 17)
        }
        this.textBlock = textElement
    }
}
