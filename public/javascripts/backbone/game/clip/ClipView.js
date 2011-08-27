var ClipView = Backbone.View.extend({
  tagName: 'div',

  initialize: function() {
    _.bindAll(this, 'render', 'unrender');
  },

  render: function() {
    return this;
  },
  
  unrender: function() {
    $(this.el).remove();
  }
});
