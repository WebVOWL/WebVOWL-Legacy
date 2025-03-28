let AbsoluteTextElement = require("../../util/AbsoluteTextElement");
let BoxArrowLink = require("../links/BoxArrowLink");
let RoundNode = require("./RoundNode");
let drawTools = require("../drawTools")();

module.exports = (function () {

  let o = function (graph) {
    RoundNode.apply(this, arguments);

    let that = this,
      superHoverHighlightingFunction = that.setHoverHighlighting,
      superPostDrawActions = that.postDrawActions;

    this.setHoverHighlighting = function (enable) {
      superHoverHighlightingFunction(enable);

      // Highlight links pointing to included nodes when hovering the set operator
      that.links()
        .filter(function (link) {
          return link instanceof BoxArrowLink;
        })
        .filter(function (link) {
          return link.domain().equals(that);
        })
        .forEach(function (link) {
          link.property().setHighlighting(enable);
        });
    };

    this.draw = function (element) {
      that.nodeElement(element);

      drawTools.appendCircularClass(element, that.actualRadius(),
        that.collectCssClasses().join(" "),
        that.labelForCurrentLanguage(), that.backgroundColor());
    };

    this.postDrawActions = function () {
      superPostDrawActions();
      that.textBlock().remove();

      let textElement = new AbsoluteTextElement(that.nodeElement(), that.backgroundColor());

      let equivalentsString = that.equivalentsString();
      let offsetForFollowingEquivalents = equivalentsString ? -30 : -17;
      let suffixForFollowingEquivalents = equivalentsString ? "," : "";
      textElement.addText(that.labelForCurrentLanguage(), offsetForFollowingEquivalents, "",
        suffixForFollowingEquivalents);

      textElement.addEquivalents(equivalentsString, -17);


      if (!graph.options().compactNotation()) {

        if (that.indicationString().length > 0) {
          textElement.addSubText(that.indicationString(), 17);
          textElement.addInstanceCount(that.individuals().length, 30);
        } else {
          textElement.addInstanceCount(that.individuals().length, 17);
        }
      } else {
        textElement.addInstanceCount(that.individuals().length, 17);
      }

      that.textBlock(textElement);
    };
  };
  o.prototype = Object.create(RoundNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
