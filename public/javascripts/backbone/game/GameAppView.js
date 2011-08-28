var GameAppView = Backbone.View.extend({
  
  events: {
    'submit #question-prompt form': 'submitAnswer'
  },

  initialize: function() {
    this.el = $('body')[0];

    this.gameStarted = false;

    this.delegateEvents(this.events);

    _.bindAll(this, 'render', 'submitAnswer', 'startGame', 'updateGame');

    this.users = new Users();
    this.clips = new Clips();

    channel.bind('startGame', this.startGame, this);
    channel.bind('answerEvent', this.updateGame, this);
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
    if (this.gameStarted) {
      return;
    }

    $('#question-prompt').show();
    $('#section-titles').show();

    this.gameStarted = true;
    this.clips.view.nextClip();
    videoLoop = setInterval('App.clips.view.nextClip()', 60000); 
  },

  updateGame: function(data) {
    var questionType = data.question;
    var result = data.result;
    this.userToUpdate = data.userId;

    var user = this.users.find(function(user) {
      return user.get('_id') === this.userToUpdate;
    }, this);

    if (result === 'right') {
      $('#question-prompt form input').val('');
      $('#question-prompt form label').text('Select a new question to answer!');
      $('#question-list ' + questionType).remove();

      if (questionType === 'actor') {
        $($('#question-list .' + questionType)[0]).remove();
      }

      else {
        $('#question-list .' + questionType).remove();
      }

      user.set({ points: user.get('points') + 1 });
      fb = user.get('fb');
      var position = 1;

      news = ich.news({ answer: 'temp', facebookId: fb.id, questionType: questionType });
      $(news).addClass('user' + position);

      $('#news-feed').prepend(news);
    }
  }
});
