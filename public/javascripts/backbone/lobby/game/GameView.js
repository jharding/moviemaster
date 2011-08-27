var GameView = Backbone.View.extend({
    tagName: "li",
    
    events:{
        "dblclick div.gameRow" : "joinGame"
    },

    render: function() {
        $(this.el).html(ich.game(this.model.toJSON()));
        return this;
    },

    joinGame: function() {
        window.location.href=this.model.url();
    }
});