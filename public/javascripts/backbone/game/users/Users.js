var Users = Backbone.Collection.extend({
  model: User,
  url: '/users',

  initalize: function() {
    this.view = new UsersView({ collection: this });
  }
});
