var Clip = Backbone.Model.extend({
  idAttribute: '_id',

  initialize: function() {
    this.view = new ClipView({ model: this });
  }
});
