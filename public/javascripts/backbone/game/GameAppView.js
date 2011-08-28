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

    this.clips.users = this.users;

    channel.bind('startGame', this.startGame, this);
    channel.bind('answerEvent', this.updateGame, this);
  },

  render: function() {

    return this;
  },

  submitAnswer: function(event) {
    event.preventDefault();
  
    if ($('#question-answer').val() === '') {
      $('#question-prompt form label').text('Incorrect. Try again.');
    }

    if ($('#question-type').val() === '') {
      $('#question-prompt form label').text('Oops, you haven\'t selected a question.');
      return;
    }

    var url = 'answer';
    var data = $('#question-prompt form').serialize();
    $('#question-prompt form input').attr('disabled', '');
    $('#question-prompt form button').attr('disabled', '');
    $.post(url, data, function(data) {
      if (data.match) {
        $('#question-prompt form label').text('Correct! Select a new question.');
        $('#question-prompt form input').val('');
        $('#question-list .question').removeClass('selected');
      }

      else {
        $('#question-prompt form label').text('Incorrect. Try again.');
      }

      $('#question-prompt form input').removeAttr('disabled');
      $('#question-prompt form button').removeAttr('disabled');
    }).error(function() {
      $('#question-prompt form label').text('Oops an error occured. Try again.');
      $('#question-prompt form input').removeAttr('disabled');
      $('#question-prompt form button').removeAttr('disabled');
     });   
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
    var answer = data.answer;

    var user = this.users.find(function(user) {
      return user.get('_id') === this.userToUpdate;
    }, this);

    if (result === 'right') {
      if ($('#question-prompt form input#question-type').val() === questionType) {
        if (questionType === 'actor' && $('.question.actor').length === 1) {
          $('#question-list .' + questionType).remove();
          $('#question-prompt form label').text('Somebody answered this question. Select a new one.');
          $('#question-prompt form input').val('');
        }

        else if (questionType === 'actor') {
          $($('#question-list .' + questionType + ':not(.selected)')[0]).remove();
        }

        else {
          $('#question-list .' + questionType).remove();
          $('#question-prompt form label').text('Somebody answered this question. Select a new one.');
          $('#question-prompt form input').val('');
        }
      }

      else {
        if (questionType === 'actor') {
          $($('#question-list .' + questionType)[0]).remove();
        }

        else {
          $('#question-list .' + questionType).remove();
        }
      }

      user.set({ points: user.get('points') + 1 });

      fb = user.get('fb');

      news = ich.news({ answer: answer, facebookId: fb.id, questionType: questionType });
      $(news).addClass('user' + user.get('userPosition'));

      $('#news-feed').prepend(news);
    }
  }
});
