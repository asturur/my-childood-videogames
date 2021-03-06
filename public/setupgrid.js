(function(){
  var games = [
    ['digger', 'DIGGER.COM'],
    ['alley_cat', 'CAT.EXE'],
    ['av', 'AV.EXE'],
    ['centipede', 'Ctp.EXE'],
    ['arkanoid', 'Arkanoid.com'], // not the exact version, need zx spectrum port // with v7 does not work the keyboard
    ['aaow-cga', 'WAR.EXE'],
    ['missile', 'ABM.EXE'],
    ['artillery', 'ARTILL.BAT'], // not exactly the one i remember, my dad probably modified it
    ['asteroids', 'Dodge.COM'], // correct. with current key combo unplayable
    ['big_top', 'BIGTOP.EXE'],
    ['burgertime', 'burger.exe'],
    ['barbarian', 'barb.exe'],
    ['decathlon', 'decathln.exe'],
    ['rogue', 'rogue.exe'],
    ['congo', 'boot congo.img'],
    ['blockout', 'bl.exe'],
    ['bowling', 'bowling.exe'],
    ['paratrooper', 'ptrooper.com'],
    ['jbird', 'jbird.exe'], // richiede sistemare i tasti
    ['styx', 'styx.exe'],
    ['soccer', 'soccer.com'], // nag screen but working
    ['tapper', 'tapper.com'],
    ['buckroger', 'boot buckzoom.img'],
    ['contra', 'contrafx.com'],
    ['frogerjr', 'frogerjr.exe'], // reduce speed, keys lag
    ['gp', 'gpcga.exe'],
    ['zaxxon', 'zaxxon.com'],
    ['winter', 'winter.com'],
    ['tetris', 'ctetris.com'],
    ['lander', 'lander.exe'], // too fast try to slow down
    ['moonpatrol', 'patrol.com'],
    ['karateka', 'karateka.exe'],
    ['tennis', 'tennis.exe'],
    ['prince', 'prince.exe'], // does not start
    ['boxing', 'boxing.com'],
    ['pitstop2', 'pitstop2.exe'],
    ['macadam', 'macadam.exe'],
    ['pango', 'pango.exe'],
    ['pool', 'pool.exe'],
    ['sokoban', 'sokoban.exe'],
    // ['msfs', 'boot ms100.ima'], hangs after mode selection
    ['novatron', 'novatron.exe'],
  ];

  gamesData = {

  };

  let currentKeydownListener;
  let currentKeyupListener;
  let currentCi;

  function loadGame(bundlePath) {
    return emulatorsUi.network.resolveBundle(bundlePath);
  }

  function runBundle(bundle, gameName) {
    const gameData = gamesData[gameName];
    const ctx = gameData.canvas.getContext('2d');
    let lastWidth = ctx.canvas.width;
    let lastHeight = ctx.canvas.height;
    const ciPromise = emulators.dosWorker(bundle);
    return ciPromise.then((ci) => {
      var fullscreen = document.getElementById('fullscreen');
      if (fullscreen && fullscreen.checked) {
        gameData.canvas.requestFullscreen();
      }
      currentCi = ci;
      emulatorsUi.sound.audioNode(ci);
      ci.events().onFrame((rgba) => {
        if (ci.frameWidth !== lastWidth || ci.frameHeight !== lastHeight) {
          ctx.canvas.width = lastWidth = ci.frameWidth;
          ctx.canvas.height = lastHeight = ci.frameHeight;
        }
        rgbaBuff = new Uint32Array(rgba.buffer);
        rgbaBuff8 = new Uint8ClampedArray(rgba.buffer);
        // for (let next = 0; next < rgbaBuff.length; next++) {
        //     rgbaBuff[next] |= 4278190080; // 255 << 24
        // }
        for (let next = 3; next < rgbaBuff8.length; next += 4) {
            rgbaBuff8[next] = 255; // 255 << 24
        }
        ctx.putImageData(new ImageData(rgbaBuff8, ci.frameWidth, ci.frameHeight), 0, 0);
      });
      currentKeydownListener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const keyCode = emulatorsUi.controls.domToKeyCode(e.keyCode);
        ci.sendKeyEvent(keyCode, true);
      }
      currentKeyupListener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const keyCode = emulatorsUi.controls.domToKeyCode(e.keyCode);
        ci.sendKeyEvent(keyCode, false);
      }
      window.addEventListener("keydown", currentKeydownListener, { capture: false });
      window.addEventListener("keyup", currentKeyupListener,  { capture: false });
    });
  }

  function startOnClick(gameName) {
    const data = gamesData[gameName];
    data.startRequest = new Promise((resolve) => {
      data.gameStart = resolve;
    });
    return function(bundle) {
      return data.startRequest.then(() => {
        emulators.pathPrefix = "/js/";
        data.gameStarted = true;
        data.preview.className = 'disappear';
        runBundle(bundle, gameName);
      });
    }
  }

  function startPreloading(gameName) {
    const data = gamesData[gameName];
    data.loadPromise = loadGame(`games/${gameName}.zip`);
    return data.loadPromise.then(startOnClick(gameName));
  }

  function buildgames(parent) {
    games.forEach(function(game, index) {
      var div = document.createElement('div');
      var preview = document.createElement('img');
      var canvas = document.createElement('canvas');
      var gameName = game[0];
      preview.className = 'disappear';
      preview.onload = () => {
        preview.className = 'appear';
      };
      preview.src = `previews/${game[0]}.png`;
      canvas.width = 320;
      canvas.height = 200;
      canvas.tabIndex = index;
      div.setAttribute('query', 'gameContainer');
      div.id = gameName;
      div.appendChild(canvas);
      div.appendChild(preview);
      parent.appendChild(div);
      data = {
        canvas: canvas,
        preview: preview,
        gameStarted: false
      };
      gamesData[gameName] = data;
      startPreloading(gameName);
      addListeners(div);
    });
  }

  function stopGame(gameName) {
    const gameData = gamesData[gameName];
     if (gameData.gameStarted) {
       console.log('stopping', gameName);
       gameData.gameStarted = false;
       gameData.loadPromise.then(startOnClick(gameName));
     }
  }

  function stopAllOtherGames() {
    window.removeEventListener("keydown", currentKeydownListener);
    window.removeEventListener("keyup", currentKeyupListener);
    if (currentCi) {
      currentCi.exit();
      currentCi = null;
    }
    games.forEach(function(game) {
      stopGame(game[0]);
    });
  }

  function startListener(evt) {
    const gameDiv = evt.target.parentNode;
    const gameName = gameDiv.id;
    const gameData = gamesData[gameName];
    const gameCanvas = gameData.canvas;
    if (gameData.gameStarted) {
      // do nothing, ideally pause/resume
      gameCanvas.focus();
    } else {
      stopAllOtherGames();
      console.log('starting', gameName);
      gameData.gameStart(gameName);
    }
  }

  function fullscreenListener(evt) {
    const gameDiv = evt.target.parentNode;
    const gameName = gameDiv.id;
    const gameData = gamesData[gameName];
    const gameCanvas = gameData.canvas;
    if (gameData.gameStarted) {
      gameCanvas.requestFullscreen();
    }
  }

  function addListeners(gameDiv) {
     gameDiv.addEventListener('click', startListener)
     gameDiv.addEventListener('dblclick', fullscreenListener)
   }
  window.gamesData = gamesData;
  window.buildgames = buildgames;
})();
