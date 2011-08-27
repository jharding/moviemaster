var QuestionsView = Backbone.View.extend({

  initialize: function() {
    this.el = $('#question-list');

    _.bindAll(this, 'render', 'unrender');

    this.collection.bind('reset', this.render, this);
  },

  render: function() {
    $(this.el).empty();
    _(this.collection.models).each(function(question) {
      this.appendQuestion(question);
    }, this);
  },

  unrender: function() {
    $(this.el).remove();
  },

  appendQuestion: function(question) {
    $(this.el).append(question.view.render().el);
  }
});
