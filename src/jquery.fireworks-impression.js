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

  function Presentation(child_nodes, spec) {
    if (!(this instanceof Presentation)) {
      return new Presentation(child_nodes, spec);
    }

    var self = this
      , intervals = spec.intervals || {}
      , intervals_array = jq.isArray(intervals)
      , default_interval = spec.defaultInterval || 1000
      ;

    this.slides = [];
    child_nodes.each(function (i) {
      var me = jq(this);
      self.slides.push({
          jq      : me
        , interval: (intervals_array ?
                     intervals[i] : intervals[this.id]) ||
                     default_interval
        });
    });

    this.current_index = 0;
    this.timeout = null;
    this.stopped = true;
    this.elapsed = 0;
    this.start_time = 0;
    this.auto_loop = !!spec.autoLoop;
  }

  Presentation.prototype = {};

  Presentation.prototype.set_timer = function (duration) {
    if (this.timeout === null && !this.stopped) {
      var self = this, slide = this.slides[this.current_index];
      this.start_time = new Date().getTime();
      this.timeout = setTimeout(function () {
        self.advance();
      }, duration);
      slide.jq.trigger('impressPlaying',
          [this.current_index, duration, slide.interval]);
    }
  };

  Presentation.prototype.cancel_timer = function () {
    if (this.timeout !== null) {
      var slide = this.slides[this.current_index];
      clearTimeout(this.timeout);
      this.timeout = null;
      this.elapsed = (new Date().getTime()) - this.start_time;
      slide.jq.trigger('impressStopped',
          [this.current_index, this.elapsed, slide.interval]);
    }
  };

  Presentation.prototype.goto = function (index) {
    var slide = this.slides[index];
    if (!slide) {
      return;
    }
    this.cancel_timer();
    this.slides[this.current_index].jq.hide();
    this.current_index = index;
    slide.jq
      .show()
      .trigger('impressShowing', [this.current_index])
      ;
    this.elapsed = 0;
    if (index === (this.slides.length -1) && !this.auto_loop) {
      this.stop();
      return;
    }
    this.set_timer(slide.interval);
  };

  Presentation.prototype.advance = function () {
    var index = this.current_index +1;
    index = index === this.slides.length ? 0 : index;
    this.goto(index);
  };

  Presentation.prototype.back = function () {
    var index = this.current_index -1;
    if (index < 0) {
      return;
    }
    this.goto(index);
  };

  Presentation.prototype.play = function () {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    this.goto(this.current_index);
  };

  Presentation.prototype.stop = function () {
    if (this.stopped) {
      return;
    }
    this.cancel_timer();
    this.stopped = true;
  };

  function exec_method(collection, method) {
    if (collection.length === 0) {
      throw 'A presentation needs at least 1 selected element.';
    }
    var id = (collection.length === 1 ?
              collection[0].id : collection.parent()[0].id);
    switch (method) {
    case 'play':
      presentations[id].play();
      break;
    case 'stop':
      presentations[id].stop();
      break;
    case 'next':
      presentations[id].advance();
      break;
    case 'back':
      presentations[id].back();
      break;
    }
  }

  // `spec.defaultInterval`
  // `spec.intervals`
  // `spec.autoLoop`
  // `spec.selector`
  jq.fn.impression = function (spec) {
    if (typeof spec === 'string') {
      exec_method(this, spec);
      return this;
    }

    if (this.length === 0) {
      throw 'A jQuery.Impression presentation needs 1 selected element.';
    }

    spec = spec || {};
    var parent_node = jq(this[0])
      , children = parent_node.children(spec.selector).hide()
      , id = parent_node.attr('id')
      ;

    if (!id) {
      parent_node.attr('id', (id = generate_id()));
    }

    presentations[id] = Presentation(children, spec);
    return this;
  };
}(window));

