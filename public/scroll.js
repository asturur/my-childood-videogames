(function() {

  var gameStack = [];
  var currentGame = null;
  var gameOffset = 5;
  var gameHeight = 600;
  var totalGames = 0;
  var gamesSelector = '[query="gameContainer"]';

  function orderGame(game, i) {
    game.style.top = -(totalGames - 1 - i) * gameOffset + 'px';
    game.style.left = -(totalGames - 1 - i) * gameOffset + 'px';
    game.style.zIndex = i;
  }

  function wheelhandler(e) {
    e.preventDefault();
    var delta = e.deltaY;
    var nextTop = parseInt(currentGame.style.top) + delta;
    if (nextTop > gameHeight + 20) {
      // cycle down
      var thisGame = currentGame;
      thisGame.className += ' vanish';
      gameStack.unshift(thisGame);
      gameStack.forEach(orderGame);
      currentGame = gameStack.pop();
      currentGame.style.zIndex = 1000;
      setTimeout(function() {
        // resetClassName;
        thisGame.className = 'gameStack';
      }, 300);
    } else if (nextTop >= 0) {
      currentGame.style.top = (nextTop) + 'px';
    } else if (nextTop < 0) {
      currentGame.style.top = '0px';
      gameStack.push(currentGame);
      currentGame = gameStack.shift();
      gameStack.forEach(orderGame);
      currentGame.style.top = (gameHeight + 20) + 'px';
      currentGame.style.left = '0px';
      currentGame.style.zIndex = 1000;
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

  function removeAllHandlers() {
    gallery.removeEventListener('wheel', wheelhandler);
    window.removeEventListener('wheel', scrollGames);
  }

  function initGrid() {
    removeAllHandlers();
    var gallery = document.querySelector('#gallery');
    gallery.className = 'grid';
    var games = gallery.querySelectorAll(gamesSelector);
    for (var i = 0; i < totalGames; i++) {
      var game = games[i];
      game.className = 'gameGrid';
    }
  }

  function initStack() {
    removeAllHandlers();
    document.body.className = 'noScroll';
    var gallery = document.querySelector('#gallery');
    gallery.className = 'stack';
    var games = gallery.querySelectorAll(gamesSelector);
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
