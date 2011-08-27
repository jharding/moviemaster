var GameView = Backbone.View.extend({
  
  initialize: function() {
    _.bindAll(this, 'render');

    this.users = new Users();
    this.clips = new Clips();

  },

  render: function() {

    return this;
  }
});
