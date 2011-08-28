$(document).ready(function() {
  if ($('section#game').length) {
    App = new GameAppView();
  } else {
    App = new LobbyView();
  }

  if ($('#share-link').length) {
    var url = 'http://' + location.host + location.pathname;
    $('#share-link').val(url);
  }

  $('#share-form').submit(function(event) {
    event.preventDefault();
  });
});
