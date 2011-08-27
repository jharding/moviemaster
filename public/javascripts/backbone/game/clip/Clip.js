var Clip = Backbone.Model.extend({

  initialize: function() {
    _.bindAll(this, 'initializeQuestions');
    this.view = new ClipView({ model: this });
  },

  initializeQuestions: function() {
    this.questions = new Questions();
    this.questions.clipId = this.get('_id');
  }
});
