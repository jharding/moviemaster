$(document).ready(function() {
  if ($('section#game').length) {
    App = new GameAppView();
  } else {
    App = new LobbyView();
  }
});
