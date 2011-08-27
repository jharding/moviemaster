var Question = Backbone.Model.extend({
  initialize: function() {
    this.view = new UserView({ model: this });
  }
});
