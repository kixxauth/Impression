/*jslint
  laxbreak: true
, onevar: true
, undef: true
, nomen: true
, eqeqeq: true
, plusplus: true
, bitwise: true
, regexp: true
, immed: true
, strict: true
*/
/*global window:false */
"use strict";
(function (window) {
  var jq = window.jQuery

    , setTimeout = window.setTimeout
    , clearTimeout = window.clearTimeout

    , presentations = {}

    , generate_id = (function () {
        var counter = 0;
        return function () {
          return 'impression-presentation-'+ (counter +=1);
        };
      }())
    ;

  function Presentation(spec) {
    if (!(this instanceof Presentation)) {
      return new Presentation(spec);
    }

    var self = this
      , collection = spec.collection
      , intervals = spec.intervals || {}
      , default_interval = spec.defaultInterval
      ;

    if (collection.length === 0) {
      throw 'A presentation needs at least 1 selected element.';
    }
    if (collection.length === 1) {
      this.root = collection;
      this.collection = collection.children(spec.selector).hide();
    }
    else {
      this.root = collection.parent();
      this.collection = collection.hide();
    }

    this.id = this.root.attr('id');
    if (!this.id) {
      this.root.attr('id', (this.id = generate_id()));
    }

    this.slides = [];
    this.collection.each(function () {
      var me = jq(this);
      self.slides.push({
          jq      : me
        , interval: intervals[me[0].id] || default_interval
        });
    });

    this.current_index = 0;
    this.timeout = null;
    this.stopped = true;
    this.elapsed = 0;
    this.start_time = 0;
    this.auto_loop = spec.autoLoop;
  }

  Presentation.prototype = {};

  Presentation.prototype.set_timer = function (duration) {
    if (this.timeout === null && !this.stopped) {
      var self = this, slide = this.slides[this.current_index];
      this.start_time = new Date().getTime();
      setTimeout(function () {
        self.advance();
      }, duration);
      slide.jq.trigger('impressPlaying', [duration, slide.interval]);
    }
  };

  Presentation.prototype.cancel_timer = function () {
    if (this.timeout !== null) {
      var slide = this.slides[this.current_index];
      clearTimeout(this.timeout);
      this.timeout = null;
      this.elapsed = (new Date().getTime()) - this.start_time;
      slide.jq.trigger('impressStopped', [this.elapsed, slide.interval]);
    }
  };

  Presentation.prototype.goto = function (index) {
    var slide = this.slides[index];
    if (!slide) {
      return;
    }
    this.cancel_timer();
    this.slides[this.current_index].jq.hide();
    slide.jq.show();
    this.current_index = index;
    this.elapsed = 0;
    this.set_timer(slide.interval);
  };

  Presentation.prototype.advance = function () {
    var index = this.current_index +1;
    index = index === this.slides.length ? 0 : index;
    if (index === 0 && !this.auto_loop) {
      return;
    }
    this.goto(index);
  };

  Presentation.prototype.play = function () {
    if (!this.stopped) {
      return;
    }
    var slide = this.slides[this.current_index];
    if (!slide) {
      return;
    }
    this.stopped = false;
    this.set_timer(slide.interval - this.elapsed);
  };

  Presentation.prototype.stop = function () {
    if (this.stopped) {
      return;
    }
    this.cancel_timer();
    this.stopped = true;
  };

  function exec_method(id, method) {
  }

  // `spec.defaultInterval`
  // `spec.intervals`
  // `spec.autoLoop`
  jq.fn.impression = function (spec) {
    if (typeof spec === 'string') {
      exec_method(this[0].id, spec);
      return this;
    }

    spec.collection = this;
    var presentation = Presentation(spec);
    presentations[presentation.id] = presentation;
    return this;
  };
}(window));
