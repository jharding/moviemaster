var UsersView = Backbone.View.extend({
	
  initialize: function(){
    this.el = $('#user-panel')[0];
    
    _.bindAll(this, 'render', 'unrender', 'appendUser');

    this.collection.bind('add', this.appendUser, this);
    this.collection.bind('reset', this.render, this);
	}, 
	
	render: function () {
	  _(this.collection.models).each(function(user) {
      this.appendUser(user);  
    }, this);
  }, 
	
  unrender: function() {
    $(this.el).remove();
  },

  appendUser: function(user) {
    $(this.el).append(user.view.render().el);
  }
	
});
