var Questions = Backbone.Collection.extend({
  model: Question,

  initialize: function() {
    this.view = new QuestionsView({ collection: this });
    clipId = this.clipId;

    var titleQuestion = {
      clipId: clipId,
      shortText: 'Title',
      longText: 'What is the name of this movie?',
      questionType: 'title',
      answered: false
    };

    var yearQuestion = {
      clipId: clipId,
      shortText: 'Year Released',
      longText: 'What year was this movie released?',
      questionType: 'year',
      answered: false
    };

    var directorQuestion = {
      clipId: clipId,
      shortText: 'Director',
      longText: 'Who directed this movie?',
      questionType: 'director',
      answered: false
    };

    var actorQuestion = {
      clipId: clipId,
      shortText: 'Actors',
      longText: 'Who is an actor in this movie?',
      questionType: 'actor',
      answered: false
    };

    this.reset([ titleQuestion, yearQuestion, directorQuestion, actorQuestion ]);    
  }
});
