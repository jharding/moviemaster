var UserView = Backbone.View.extend({
	tagName: 'div', 
	className: 'span4 user-meta', 
	count: 0, 
	
	initialize: function(){
		_.bindAll(this, 'render', 'refresh');
		
	}, 
	
	render: function () {
		
		$(this.el).append("<div>no one</div>");
		
		
	}, 
	
	refresh: function () {
		
		$(this.el).append("<div>no one</div>");
	}
});
