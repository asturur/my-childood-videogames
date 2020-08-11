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
    ['jbird', 'jbird.exe'],
    ['styx', 'styx.exe'],
    ['soccer', 'soccer.com'], // nag screen but working
    // ['tapper', 'tapper.com'], does not start
    // ['buckroger', 'zoom.com'], does not start
    // ['contra', 'bsp __contr.com'], // cannot go past crack screen
    // ['burger__alt.zip', 'burger.exe'], // alternate version.
    ['frogerjr', 'frogerjr.exe'], // reduce speed
    ['gp', 'gpcga.exe'],
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
      currentCi = ci;
      emulatorsUi.sound.audioNode(ci);
      ci.events().onFrame((rgba) => {
        if (ci.frameWidth !== lastWidth || ci.frameHeight !== lastHeight) {
          ctx.canvas.width = lastWidth = ci.frameWidth;
          ctx.canvas.height = lastHeight = ci.frameHeight;
        }
        rgbaBuff = new Uint8ClampedArray(rgba.buffer);
        for (let next = 3; next < rgbaBuff.byteLength; next = next + 4) {
            rgbaBuff[next] = 255;
        }
        ctx.putImageData(new ImageData(rgbaBuff, ci.frameWidth, ci.frameHeight), 0, 0);
      });
      currentKeydownListener = (e) => {
        const keyCode = emulatorsUi.controls.domToKeyCode(e.keyCode);
        ci.sendKeyEvent(keyCode, true);
      }
      currentKeyupListener = (e) => {
        const keyCode = emulatorsUi.controls.domToKeyCode(e.keyCode);
        ci.sendKeyEvent(keyCode, false);
      }
      window.addEventListener("keydown", currentKeydownListener);
      window.addEventListener("keyup", currentKeyupListener);
    });
  }

  function startPreloading(gameName) {
    const data = gamesData[gameName];
    loadGame(`games/${gameName}.zip`).then(bundle => {
      return data.startRequest.then(() => {
        emulators.pathPrefix = "/js/";
        data.gameStarted = true;
        data.preview.className = 'disappear';
        runBundle(bundle, gameName);
      });
    });
  }

  function setupgrid(parent) {
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
      div.className = 'game';
      div.id = gameName;
      div.appendChild(canvas);
      div.appendChild(preview);
      parent.appendChild(div);
      data = {
        canvas: canvas,
        preview: preview,
        gameStarted: false
      };
      data.startRequest = new Promise((resolve) => {
        data.gameStart = resolve;
      });
      gamesData[gameName] = data;
      startPreloading(gameName);
      addStartListener(div);
    });
  }

  function stopGame(gameName) {
    const gameData = gamesData[gameName];
     if (gameData.gameStarted) {
       console.log('stopping', gameName);
       gameData.gameStarted = false;
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

  function addStartListener(gameDiv) {
     const gameName = gameDiv.id;
     const gameData = gamesData[gameName];
     const gameCanvas = gameData.canvas;
     gameDiv.addEventListener('click', () => {
       if (gameData.gameStarted) {
         // do nothing, ideally pause/resume
         gameCanvas.focus();
       } else {
         stopAllOtherGames();
         console.log('starting', gameName);
         gameData.gameStart(gameName);
         gameCanvas.focus();
       }
     })
   }
  window.gamesData = gamesData;
  window.setupgrid = setupgrid;
})();
