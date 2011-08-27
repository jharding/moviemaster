var Questions = Backbone.Collection.extend({
  model: Question,

  initialize: function() {
    this.view = new UsersView({ collection: this });
  }
});
