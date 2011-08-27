var Users = Backbone.Collection.extend({
  model: User,

  initialize: function() {
    this.view = new UsersView({ collection: this });
    
    var bootstrapObject = $('#bootstrap-users');
    var bootstrapData = JSON.parse(bootstrapObject.html());
    bootstrapObject.remove();

    this.reset(bootstrapData);
  }
});
