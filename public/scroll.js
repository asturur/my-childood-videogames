(function() {

  var gameStack = [];
  var currentGame = null;
  var gameOffset = 5;
  var gameHeight = 600;
  var totalGames = 0;

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
        // resetClassName;
        thisGame.className = 'gameStack';
      });
    }
  }

  function pageUp() {

  }

  function pageDown() {

  }

  function scrollGames(e) {
    const code = e.keycode;
    if (code !== 33 && code !== 34) {
      return;
    }
    if (keycode === 33) {
      pageUp();
    } else {
      pageDown();
    }
  }

  function initGrid() {
    var gallery = document.querySelector('#gallery');
    gallery.removeEventListener('wheel', wheelhandler);
    var games = gallery.querySelectorAll('.game');
    var games = gallery.querySelectorAll('.game');
    totalGames = games.length;
    for (var i = 0; i < totalGames; i++) {
      var game = games[i];
    }
  }

  function initStack() {
    var gallery = document.querySelector('#gallery');
    gallery.className = 'stack';
    var games = gallery.querySelectorAll('[query="gameContainer"]');
    totalGames = games.length;
    for (var i = 0; i < totalGames; i++) {
      var game = games[i];
      game.className = 'gameStack';
      gameStack.push(game);
      orderGame(game, i);
    }
    gallery.addEventListener('wheel', wheelhandler);
    window.addEventListener('keyup', scrollGames)
    currentGame = gameStack.pop();
    currentGame.style.zIndex = 1000;
  }

  window.initStack = initStack;
})()
