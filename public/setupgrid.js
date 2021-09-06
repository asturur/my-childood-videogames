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
    ['gapper', 'gapper.exe'],
    ['gato', 'gato.exe'],
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
    let rgba = new Uint8ClampedArray(0);
    const ciPromise = emulators.dosboxWorker(bundle);
    return ciPromise.then((ci) => {
      var fullscreen = document.getElementById('fullscreen');
      if (fullscreen && fullscreen.checked) {
        gameData.canvas.requestFullscreen();
      }
      currentCi = ci;
      const onResizeFrame = (w, h) => {
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        rgba = new Uint8ClampedArray(w * h * 4);
        for (let alpha = 3; alpha < rgba.length; alpha += 4) {
            rgba[alpha] = 255; // opaque
        }
      };
      onResizeFrame(ci.width(), ci.height());
      emulatorsUi.sound.audioNode(ci);
      ci.events().onFrameSize(onResizeFrame);
      ci.events().onFrame((rgb) => {
        let index32 = 0;
        rgbaBuff8 = new Uint8ClampedArray(rgb.buffer);
        for (let i = 0; i < rgbaBuff8.length; i += 3) {
            index32 = i / 3 * 4;
            rgba[index32] = rgbaBuff8[i]; // 255 << 24
            rgba[index32 + 1] = rgbaBuff8[i + 1]; // 255 << 24
            rgba[index32 + 2] = rgbaBuff8[i + 2]; // 255 << 24
        }
        ctx.putImageData(new ImageData(rgba, ci.frameWidth, ci.frameHeight), 0, 0);
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
