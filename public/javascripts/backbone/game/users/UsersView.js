var UsersView = Backbone.View.extend({
	
  initialize: function(){
    this.el = $('#user-panel')[0];

    this.gameStarted = false;
    
    _.bindAll(this, 'render', 'unrender', 'appendUser', 'checkGameStatus', 'refreshUsers', 'sendGameSummary');

    this.collection.bind('add', this.appendUser, this);
    this.collection.bind('reset', this.render, this);
    this.collection.bind('reset', this.checkGameStatus, this);

    channel.bind('newUsers', this.refreshUsers, this);
    channel.bind('startGame', this.refreshUsers, this);
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
    if (this.collection.models.length === 4 && !this.gameStarted) {
      this.gameStarted = true;
      setTimeout("$.post('start')", 5000);
    }
  },

  refreshUsers: function(users) {
    $(this.el).empty();
    this.collection.reset(users);
  },

  sendGameSummary: function() {
    var finishingOrder = this.collection.sortBy(function(user) {
      return -user.get('points');
    });

    var winner = finishingOrder[0];

    if (winner.get('_id') === $('#user-id').val()) {
      var url = 'end';
      $.post(url);

      $('#video-player').html(ich.winner({ displayName: winner.get('fb').name.full }));
    }

    else {
      $('#video-player').html(ich.loser());
    }
  }
});
