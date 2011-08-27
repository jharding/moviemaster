var User = Backbone.Model.extend({
  idAttribute: '_id',

  initialize: function() {
    this.view = new UserView({ model: this });
  }
});
