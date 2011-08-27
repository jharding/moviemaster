var Clips = Backbone.Collection.extend({
  model: Clip,

  initialize: function() {
    this.view = new ClipsView({ collection: this });

    var bootstrapObject = $('#bootstrap-clips');
    var bootstrapData = JSON.parse(bootstrapObject.html());
    bootstrapObject.remove();

    this.reset(bootstrapData);
  }
});
