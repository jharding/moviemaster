var ClipView = Backbone.View.extend({
  tagName: 'div',

  initialize: function() {
    _.bindAll(this, 'render', 'unrender');

    this.model.bind('destroy', this.unrender, this);
  },

  render: function() {
    return this;
  },
  
  unrender: function() {
    $('#video-player object:nth-child(1)').remove();
  }
});
