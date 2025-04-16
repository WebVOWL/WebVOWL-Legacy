import d3 from "d3";

/** The zoom Slider **/
export default class ZoomSlider {
  /**
   * @param {any} graph
   */
  constructor(graph) {
    this.graph = graph;

    this.minMag = graph.options.minMagnification();
    this.maxMag = graph.options.maxMagnification();
    this.t_zoomOut = undefined;
    this.t_zoomIn = undefined;
    this.zoomValue = undefined;
    // @ts-ignore
    this.showSlider = true;
    this.w = graph.options.width();
    this.h = graph.options.height();
    this.slider = undefined;
    this.defZoom = Math.min(this.w, this.h) / 1000;
  }

  clearAllTimers() {
    cancelAnimationFrame(this.t_zoomOut);
    cancelAnimationFrame(this.t_zoomIn);
  }

  timed_zoomOut() {
    this.zoomValue = 0.98 * this.zoomValue;
    // fail saves
    if (this.zoomValue < this.minMag) {
      this.zoomValue = this.minMag;
    }
    this.graph.setSliderZoom(this.zoomValue);
    this.t_zoomOut = requestAnimationFrame(this.timed_zoomOut);
  }

  timed_zoomIn() {
    this.zoomValue = 1.02 * this.zoomValue;
    // fail saves
    if (this.zoomValue > this.maxMag) {
      this.zoomValue = this.maxMag;
    }
    this.graph.setSliderZoom(this.zoomValue);
    this.t_zoomIn = requestAnimationFrame(this.timed_zoomIn);
  }

  setup() {
    const _this = this;
    this.slider = d3.select("#zoomSliderParagraph").append("input")
      .datum({})
      .attr("id", "zoomSliderElement")
      .attr("type", "range")
      .attr("value", this.defZoom)
      .attr("min", this.minMag)
      .attr("max", this.maxMag)
      .attr("step", (this.maxMag - this.minMag) / 40)
      .attr("title", "zoom factor")
      .on("input", function () {
        _this.zooming();
      });

    d3.select("#zoomOutButton").on("mousedown", function () {
      _this.graph.options.navigationMenu().hideAllMenus();
      _this.zoomValue = _this.graph.scaleFactor();
      _this.t_zoomOut = requestAnimationFrame(_this.timed_zoomOut);
    })
      .on("touchstart", function () {
        _this.graph.options.navigationMenu().hideAllMenus();
        _this.zoomValue = _this.graph.scaleFactor();
        _this.t_zoomOut = requestAnimationFrame(_this.timed_zoomOut);
      })
      .on("mouseup", this.clearAllTimers)
      .on("touchend", this.clearAllTimers)
      .on("touchcancel", this.clearAllTimers)
      .attr("title", "zoom out");

    d3.select("#zoomInButton").on("mousedown", function () {
      _this.graph.options.navigationMenu().hideAllMenus();
      _this.zoomValue = _this.graph.scaleFactor();
      _this.t_zoomIn = requestAnimationFrame(_this.timed_zoomIn);
    })
      .on("touchstart", function () {
        _this.graph.options.navigationMenu().hideAllMenus();
        _this.zoomValue = _this.graph.scaleFactor();
        _this.t_zoomIn = requestAnimationFrame(_this.timed_zoomIn);
      })
      .on("mouseup", this.clearAllTimers)
      .on("touchend", this.clearAllTimers)
      .on("touchcancel", this.clearAllTimers)
      .attr("title", "zoom in");

    d3.select("#centerGraphButton").on("click", function () {
      _this.graph.options.navigationMenu().hideAllMenus();
      _this.graph.forceRelocationEvent();
    }).attr("title", "center graph");

  };

  /**
   * @param {any} val
   */
  // @ts-ignore
  showSlider(val) {
    if (!arguments.length) return this.showSlider;
    d3.select("#zoomSlider").classed("hidden", !val);
    this.showSlider = val;
  };

  zooming() {
    this.graph.options.navigationMenu().hideAllMenus();
    var zoomValue = this.slider.property("value");
    this.slider.attr("value", zoomValue);
    this.graph.setSliderZoom(zoomValue);
  };

  /**
   * @param {any} val
   */
  updateZoomSliderValue(val) {
    if (this.slider) {
      this.slider.attr("value", val);
      this.slider.property("value", val);
    }
  };
};
