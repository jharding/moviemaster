var Clip = Backbone.Model.extend({
  idAttribute: '_id',

  initialize: function() {
    _.bindAll(this, 'initializeQuestions');
    this.view = new ClipView({ model: this });
  },

  initializeQuestions: function() {
    this.questions = new Questions();
    this.questions.clipId = this.id;
  }
});
