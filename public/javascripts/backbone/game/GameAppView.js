var GameAppView = Backbone.View.extend({
  
  events: {
    'submit #question-prompt form': 'submitAnswer'
  },

  initialize: function() {
    this.el = $('body')[0];

    this.delegateEvents(this.events);

    _.bindAll(this, 'render', 'submitAnswer');

    this.users = new Users();
    this.clips = new Clips();

  },

  render: function() {

    return this;
  },

  submitAnswer: function(event) {
    event.preventDefault();
    
    var url = 'answer';
    $.post(url, $('#question-prompt form').serialize());
  }
});
