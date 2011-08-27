var UserView = Backbone.View.extend({
	tagName: 'div', 
	className: 'span4 user-meta', 
	
	initialize: function(){
		_.bindAll(this, 'render');
    
    this.model.bind('change', this.render, this);
	}, 
	
	render: function () {
    var facebookData = this.model.get('fb');
    var facebookId = facebookData['id'];
    var displayName = facebookData['name']['full'];
    var points = this.model.get('points');
    $(this.el).html(ich.user({
      displayName: displayName,
      facebookId: facebookId,
      points: points
    }));	

    return this;
	} 
});
