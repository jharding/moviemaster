var GamesView = Backbone.View.extend({
    el: 'div#gamesView',

    events: {
        "keypress #new-game" :  "createOnEnter"
    },

    initialize: function() {
      this.input    = this.$("#new-game");
    },
    
    addOne: function(game) {
        var gameView = new GameView({model: game});
        this.$("#gamesList").append(gameView.render().el);
    },
    addAll: function(gamesJSONArr) {
        var collection = this.collection;
        $.each(gamesJSONArr, function(index, value) { 
            var gameModel = new Game(value);
            collection.add(gameModel);
        });
        collection.each(this.addOne);
    },
    createOnEnter : function(e) {
        var text = this.input.val();
        if (!text || e.keyCode != 13) return;
        $.post('/game', {gameName: text});
    }
});

