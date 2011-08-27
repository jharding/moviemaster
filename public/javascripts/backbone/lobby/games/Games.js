var Games = Backbone.Collection.extend({
    model: Game,
    
    comparator: function(game) {
        return -game.get('numPlayers');
    }
});