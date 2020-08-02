(function() {

  var gameStack = [];
  var currentGame = null;
  var gameOffset = 5;
  var gameHeight = 600;
  var totalGames = 0;

  function stopGame(game) {
    var iframe = game.querySelector('iframe');
    const w = iframe.contentWindow;
    if (w.gameStarted) {
      console.log('stopping', w.gameName);
      w.reload();
    }
  }

  function stopAllOtherGames() {
    stopGame(currentGame);
    gameStack.forEach(stopGame);
  }

  function addStartListener(game) {
    game.addEventListener('click', () => {
      stopAllOtherGames();
      var iframe = game.querySelector('iframe');
      console.log('starting', iframe.contentWindow.gameName);
      iframe.contentWindow.gameStart();
      iframe.focus();
    })
  }

  function orderGame(game, i) {
    game.style.top = -(totalGames - i) * gameOffset + 'px';
    game.style.left = -(totalGames - i) * gameOffset + 'px';
    game.style.zIndex = i;
  }

  function wheelhandler(e) {
    e.preventDefault();
    currentGame.style.top = (parseInt(currentGame.style.top) + e.deltaY) + 'px';
    var currentY = parseInt(currentGame.style.top);
    if (
      (currentY < -gameHeight + totalGames * gameOffset - 20) ||
      (currentY > gameHeight + 20)
    ) {
      var thisGame = currentGame;
      thisGame.className += ' vanish';
      gameStack.unshift(thisGame);
      gameStack.forEach(orderGame);
      currentGame = gameStack.pop();
      currentGame.style.zIndex = 1000;
      setTimeout(function() {
        // resetClasName;
        thisGame.className = 'game';
      });
    }
  }

  function init() {
    var gallery = document.querySelector('#gallery');

    var games = gallery.querySelectorAll('.game');
    totalGames = games.length;
    for (var i = 0; i < totalGames; i++) {
      var game = games[i];
      gameStack.push(game);
      addStartListener(game)
      orderGame(game, i);
    }
    gallery.addEventListener('wheel', wheelhandler);
    currentGame = gameStack.pop();
    currentGame.style.zIndex = 1000;
  }

  window.initScroll = init;
})()
