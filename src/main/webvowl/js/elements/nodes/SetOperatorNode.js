import AbsoluteTextElement from '../../util/AbsoluteTextElement';
import { DrawTools } from '../drawTools';
import BoxArrowLink from '../links/BoxArrowLink';
import { RoundNode } from './RoundNode';

export class SetOperatorNode extends RoundNode {
    constructor(graph) {
        super(graph)
    }
    setHoverHighlighting(enable) {
        super.setHoverHighlighting(enable);

        // Highlight links pointing to included nodes when hovering the set operator
        this.links
            .filter(function (link) {
                return link instanceof BoxArrowLink;
            })
            .filter(function (link) {
                return link.domain.equals(this);
            })
            .forEach(function (link) {
                link.property.setHighlighting(enable);
            });
    }

    draw(element) {
        this.nodeElement = element;
        DrawTools.appendCircularClass(element, this.smallestRadius,
            this.collectCssClasses().join(" "),
            this.labelForCurrentLanguage(), this.backgroundColor);
    }

    postDrawActions() {
        super.postDrawActions();
        this.textBlock.remove();

        var textElement = new AbsoluteTextElement(this.nodeElement, this.backgroundColor);
        const equivalentsString = this.equivalentsString();
        const offsetForFollowingEquivalents = equivalentsString ? -30 : -17;
        const suffixForFollowingEquivalents = equivalentsString ? "," : "";
        textElement.addText(
            this.labelForCurrentLanguage(),
            offsetForFollowingEquivalents,
            "",
            suffixForFollowingEquivalents
        );

        textElement.addEquivalents(equivalentsString, -17);
        if (!graph.options().compactNotation()) {
            if (this.indicationString().length > 0) {
                textElement.addSubText(this.indicationString(), 17);
                textElement.addInstanceCount(this.individuals.length, 30);
            } else {
                textElement.addInstanceCount(this.individuals.length, 17);
            }
        } else {
            textElement.addInstanceCount(this.individuals.length, 17);
        }
        this.textBlock = textElement;
    }
}