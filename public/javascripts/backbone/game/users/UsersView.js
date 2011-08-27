var UsersView = Backbone.View.extend({
	el: $('#user-panel'), 
	events: {
		'click #add': 'refresh'
	}, 
	initialize: function(){
		_.bindAll(this, 'render', 'unrender', 'swap', 'remove');
		this.collection = new Users();
		this.collection.bind('change', this.refresh);
		this.counter = 0;
		this.render();
	}, 
	
	render: function () {
		
		$(this.el).append("<button id='add'>Add list item</button>");
		
		
	}, 
	
	refresh: function () {
		this.counter++;
		
		
		var user = new User();
		user.set({firstname: 'a', lastname: 'b', score: 1});
		
		this.collection.add(user);
	}
	
	
});
var usersView = new UsersView();
});
