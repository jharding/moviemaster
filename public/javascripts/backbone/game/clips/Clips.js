var Clips = Backbone.Collection.extend({
  model: Clip,
  url: '/clips',

  initialize: function() {
    this.view = new ClipsView({ collection: this });
  }
});
