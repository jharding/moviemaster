var LobbyView = Backbone.View.extend({
  initialize: function() {
      _.bindAll(this, 'render');
      this.games = new Games();
      this.gamesView = new GamesView({collection: this.games});
  },

  render: function() {

    return this;
  }
                                          
});