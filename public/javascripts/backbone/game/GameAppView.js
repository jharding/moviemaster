var GameAppView = Backbone.View.extend({
  
  events: {
    'submit #question-prompt form': 'submitAnswer'
  },

  initialize: function() {
    this.el = $('body')[0];

    this.delegateEvents(this.events);

    _.bindAll(this, 'render', 'submitAnswer', 'startGame');

    this.users = new Users();
    this.clips = new Clips();

    channel.bind('startGame', this.startGame, this);
  },

  render: function() {

    return this;
  },

  submitAnswer: function(event) {
    event.preventDefault();
    
    var url = 'answer';
    $.post(url, $('#question-prompt form').serialize());
  },

  startGame: function() {
    this.clips.view.nextClip();
    videoLoop = setInterval('App.clips.view.nextClip()', 60000); 
  }
});
