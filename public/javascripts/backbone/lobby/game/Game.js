var Game = Backbone.Model.extend({
    defaults: function() {
      return {
          numPlayers:1
      };
    },
    url: function() {
        return "/game/" + this.id + "/";
    }
});
