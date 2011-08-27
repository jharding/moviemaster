var Question = Backbone.Model.extend({
  initialize: function() {
    this.view = new QuestionView({ model: this });
  }
});
