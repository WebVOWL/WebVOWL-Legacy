import d3 from "d3";

/**
 * Contains the logic for setting up the gravity sliders.
 *
 * @param graph the associated webvowl graph
 * @returns {{}}
 */
export default class GravityMenu {

  /**
   * @param {any} graph
   */
  constructor(graph){
    this.graph = graph;
    /**
     * @type {d3.Selection<HTMLInputElement, { distanceFunction: (arg0?: number) => any; }, null, undefined>[]}
     */
    this.sliders = [];
    this.options = graph.graphOptions();
    this.defaultCharge = this.options.charge();
  }
  
  /**
   * Adds the gravity sliders to the website.
   */
  setup(){
    const _this = this;
    var menuEntry = d3.select("#m_gravity");
    menuEntry.on("mouseover", function (){
      var searchMenu = _this.graph.options().searchMenu();
      searchMenu.hideSearchEntries();
    });
    this.addDistanceSlider("#classSliderOption", "class", "Class distance", this.options.classDistance);
    this.addDistanceSlider("#datatypeSliderOption", "datatype", "Datatype distance", this.options.datatypeDistance);
  };
  
  /**
   * @param {any} selector
   * @param {string} identifier
   * @param {string | number | boolean | d3.ValueFn<HTMLLabelElement, { distanceFunction: any; }, string | number | boolean>} label
   * @param {(arg0?: number) => any} distanceFunction
   */
  addDistanceSlider( selector, identifier, label, distanceFunction ){
    const _this = this;
    var defaultLinkDistance = distanceFunction();
    
    var sliderContainer;
    /**
     * @type {d3.Selection<HTMLLabelElement, { distanceFunction: (arg0?: number) => any; }, null, undefined>}
     */
    var sliderValueLabel;
    
    sliderContainer = d3.select(selector)
      .append("div")
      .datum({ distanceFunction: distanceFunction }) // connect the options-function with the slider
      .classed("distanceSliderContainer", true);
    
    var slider = sliderContainer.append("input")
      .attr("id", identifier + "DistanceSlider")
      .attr("type", "range")
      .attr("min", 10)
      .attr("max", 600)
      .attr("value", distanceFunction())
      .attr("step", 10);
    
    sliderContainer.append("label")
      .classed("description", true)
      .attr("for", identifier + "DistanceSlider")
      .text(label);
    
    sliderValueLabel = sliderContainer.append("label")
      .classed("value", true)
      .attr("for", identifier + "DistanceSlider")
      .text(distanceFunction());
    
    // Store slider for easier resetting
    this.sliders.push(slider);
    
    slider.on("focusout", function (){
      _this.graph.updateStyle();
    });
    
    slider.on("input", function (){
      var distance = slider.property("value");
      distanceFunction(distance);
      _this.adjustCharge(defaultLinkDistance);
      sliderValueLabel.text(distance);
      _this.graph.updateStyle();
    });
    
    // add wheel event to the slider
    slider.on("wheel", function (){
      // @ts-ignore
      var wheelEvent = d3.event;
      var offset;
      if ( wheelEvent.deltaY < 0 ) offset = 10;
      if ( wheelEvent.deltaY > 0 ) offset = -10;
      var oldVal = parseInt(slider.property("value"));
      var newSliderValue = oldVal + offset;
      if ( newSliderValue !== oldVal ) {
        slider.property("value", newSliderValue);
        distanceFunction(newSliderValue);
        // @ts-ignore
        slider.on("input").call(slider.node(), d3.event); // << set text and update the graphStyles
      }
      // @ts-ignore
      d3.event.preventDefault();
    });
  }
  
  /**
   * @param {number} defaultLinkDistance
   */
  adjustCharge( defaultLinkDistance ){
    var greaterDistance = Math.max(this.options.classDistance(), this.options.datatypeDistance()),
      ratio = greaterDistance / defaultLinkDistance,
      newCharge = this.defaultCharge * ratio;
    
    this.options.charge(newCharge);
  }
  
  /**
   * Resets the gravity sliders to their default.
   */
  reset(){
    this.sliders.forEach(function ( slider ){
      slider.property("value", function ( /** @type {{ distanceFunction: () => any; }} */ d ){
        // Simply reload the distance from the options
        return d.distanceFunction();
      });
      // @ts-ignore
      slider.on("input")();
    });
  };
};
