var QuestionView = Backbone.View.extend({
  tagName: 'div',
  className: 'question',
  
  events: {
    'click': 'giveQuestionFocus'
  },

  initialize: function() {
    this.questionPrompt = $('#question-prompt');

    _.bindAll(this, 'render', 'unrender', 'giveQuestionFocus');
  },

  render: function() {
    $(this.el).html(ich.question(this.model.toJSON())); 
    return this;
  },

  unrender: function() {
    $(this.el).remove();
  },

  giveQuestionFocus: function() {
    $('form label', this.questionPrompt).text(this.model.get('longText'));
    $('#question-clip-id', this.questionPrompt).attr('value', this.model.collection.clipId);
    $('#question-type', this.questionPrompt).attr('value', this.model.get('questionType'));
  }
});
