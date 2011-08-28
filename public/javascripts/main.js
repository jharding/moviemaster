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

  $('#leaderboards #tabs .tab').click(function() {
    $('#leaderboards #tabs .tab').removeClass('selected');
    $(this).addClass('selected');
    if ($(this).attr('id') === 'wins-tab') {
      $('#leaderboards #wins-list').show();
      $('#leaderboards #points-list').hide();
    }

    else {
      $('#leaderboards #wins-list').hide();
      $('#leaderboards #points-list').show();
    }
  });
});
