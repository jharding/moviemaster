var ClipsView = Backbone.View.extend({
  
  initialize: function() {
    this.el = $('#video-player')[0];

    _.bindAll(this, 'render', 'unrender', 'appendClip');

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
    $(clipObject).attr('id', 'clip-wrapper' + index);

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
    swfobject.embedSWF(uri, 'clip-wrapper' + index, "425", "356", "8", null, null, params, atts);
  }
});
