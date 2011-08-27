var GameView = Backbone.View.extend({
    tagName: "li",
    
    events:{
        "dblclick div.gameRow" : "joinGame"
    },

    className: "gameLi",

    initialize: function() {
        var that = this;
        this.model.bind('change:numPlayers', function(model, numPlayers) {
            that.render();
        });

        this.model.bind('remove', function() {
            that.unrender();
        });

    },

    render: function() {
        $(this.el).html(ich.game(this.model.toJSON()));
        return this;
    },

    unrender: function() { 
        $(this.el).remove();  
    },

    joinGame: function() {
        window.location.href=this.model.url();
    }
});