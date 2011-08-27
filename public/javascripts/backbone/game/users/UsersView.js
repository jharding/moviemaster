var UsersView = Backbone.View.extend({
	
  initialize: function(){
    this.el = $('#user-panel')[0];
    
    _.bindAll(this, 'render', 'unrender', 'appendUser', 'checkGameStatus', 'refreshUsers');

    this.collection.bind('add', this.appendUser, this);
    this.collection.bind('reset', this.render, this);
    this.collection.bind('reset', this.checkGameStatus, this);

    channel.bind('newUsers', this.refreshUsers, this);
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
  },
  
  checkGameStatus: function() {
    if (this.collection.models.length === 4) {
      setTimeout("$.post('start')", 5000);
    }
  },

  refreshUsers: function(users) {
    $(this.el).empty();
    this.collection.reset(users);
  }
});
