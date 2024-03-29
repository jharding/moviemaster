var GamesView = Backbone.View.extend({
    el: 'section#lobby',

    events: {
        "keypress #new-game" :  "createOnEnter"
    },

    initialize: function() {
      //  var that = this;
      this.input    = this.$("#new-game");
      // this.collection.bind('remove', function(model) {
      //     that.remove(model);  
      // });
                          
    },
    
    addOne: function(game) {
        var gameView = new GameView({model: game});
        this.$("#games-available").append(gameView.render().el);
    },
    
    addAll: function(gamesJSONArr) {
        var collection = this.collection;
        $.each(gamesJSONArr, function(index, value) { 
            var gameModel = new Game(value);
            collection.add(gameModel);
        });
        collection.each(this.addOne);
    },
    
    remove: function(gameModel) { 
        this.collection.remove(gameModel);
        gameModel.remove();
    },
    
    createOnEnter : function(e) {
        var text = this.input.val();
        if (!text || e.keyCode != 13) return;
        $('#newGameForm').submit();
    }
});

