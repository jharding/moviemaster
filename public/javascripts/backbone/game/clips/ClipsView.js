var ClipsView = Backbone.View.extend({

  initialize: function() {
    this.el = $('#video-player')[0];

    _.bindAll(this, 'render', 'unrender', 'appendClip', 'nextClip');

    this.collection.bind('reset', this.render, this);
  },

  render: function() {
    _(this.collection.models).each(function(clip, index) {
      this.appendClip(clip, index);
    }, this);
  },

  unrender: function() {
    $(this.el).remove();
  },

  appendClip: function(clip, index) {
    var clipObject = clip.view.render().el;
    $(this.el).append(clipObject);
    $(clipObject).attr('id', 'clip' + index);

    var uri = 'http://www.youtube.com/v/' + clip.get('url') + '?' +
              'version=3&' +
              'controls=0&' +
              'enablejsapi=1&' +
              'playerapiid=clip' + index + '&' + 
              'rel=0&' +
              'showinfo=0&' + 
              'feature=player_embedded';

    var atts = { id: "clip" + index };
    var params = { allowScriptAccess: "always" };
    swfobject.embedSWF(uri, 'clip' + index, "460", "356", "8", null, { allownetworking: 'internal' }, params, atts);

  },

  nextClip: function() {
    if (videoIndex === 3) {
      this.collection.at(0).destroy();
      clearInterval(videoLoop);

      this.collection.users.view.sendGameSummary();

      $('#news-feed').prepend(ich.alert({ text: 'Game over' }));
      $('#question-prompt').remove();
    }

    else if (videoIndex === 0) {
      $('.waiting').remove();
      this.collection.at(0).initializeQuestions();
      $('#clip' + videoIndex)[0].playVideo();
      videoIndex += 1;
      $('#news-feed').prepend(ich.alert({ text: 'Starting round ' + videoIndex }));
    }

    else {
      this.collection.at(0).destroy();
      this.collection.at(0).initializeQuestions();
      $('#clip' + videoIndex)[0].playVideo();
      videoIndex += 1;

      $('#round').text('Round ' + videoIndex + ' of 3');
      $('#news-feed').prepend(ich.alert({ text: 'Starting round ' + videoIndex }));
    }
  }
});
