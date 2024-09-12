const { contextBridge, ipcRenderer } = require('electron');

const host = window.location.hostname;
let platformData = null;

ipcRenderer.on('data-from-main', async (event, pData,counterData) => {
  this.platformData = pData;
  if (host === 'elements.envato.com') {

    createOverlayLoading()
    let sesion = await verifySession(0,10);
    if(sesion){
      //js_s: 
      //".l0z8Gogx.T9RhOwAm.rGep5HSU.EiYfCSK8.otVd74uv > .NsWdXpRH.o8MJIZ9I.x0gFm914" : laboratorio de IA y Menu de usuario
      //".ES35fwD6.hpXGB4LP.Z8wCehge.J2kEjTSp.jH_a7fc4" : Menu aprender
      const hideUserResult = await hideUserActions(sesion,pData.js_s);
      hideOverlayLoding();
      if(!hideUserResult){
        ipcRenderer.send('redirect-out','?param=5');
      }
      ipcRenderer.send('set-loged-status', sesion);
    }else{
      if (window.location.href.includes("/sign-in")){
        initAutoL(pData);
      }else{
        window.location.href = "https://elements.envato.com/sign-in";
      }

    }
    createBtnMenu(pData);
    updateDownloadCounter(counterData);
  }
});

// Define tus funciones según el host
if (host === 'elements.envato.com') {
  
    // Exponer métodos seguros al contexto de renderizado
    contextBridge.exposeInMainWorld('electronAPI', {
      // Método para ocultar automáticamente el botón con data-testid="account-menu-button"
      sendResponseToNode: (response) => ipcRenderer.send('post-request-response', response)
      //onResponseReceived: (callback) => ipcRenderer.on('response-received', (event, response) => callback(response)),
      //sendUrl: (download) => ipcRenderer.send('url-clicked', download),
      //setLogedStatus: (status) => ipcRenderer.send('set-loged-status', status),
      //redirectOut: (param) => ipcRenderer.send('redirect-out', param),
      //cerrarSesion: (url) => ipcRenderer.send('cerrar-sesion', url),
    });

    ipcRenderer.on('updateDowloadCounter', (event, data) => {
      updateDownloadCounter(data);
    });
    
    ipcRenderer.on('showAlertConfirmDownloadLicense', (event, data) => {
      alert(`El archivo se guardó en: ${data.savePath}`);
    });
    
    // Ejecutar código cuando la página esté completamente cargada
    window.addEventListener('DOMContentLoaded', async () => {

      insertDowloadScript();
      
      /*document.addEventListener('click', (event) => {
          const target = event.target.closest('button[data-testid="download-without-license-button"],button[data-testid="add-download-button"]');
          console.log(target);
          if (target) {
              ipcRenderer.send('url-clicked', window.location.href);
          }else{
            //ipcRenderer.send('redirect-out','?param=3');
          }
      });*/

    });

}else if(host === 'giga-dev.test' || host === 'gigathemes.club'){
  
    contextBridge.exposeInMainWorld('electronAPI', {
      sendDiviWebCliConfig: (config) => ipcRenderer.send('set-diviWebCliConfig', config)
    });
    

    // Ejecutar código cuando la página esté completamente cargada
    window.addEventListener('DOMContentLoaded', () => {

      const script = document.createElement('script');
      script.textContent = `(function() {
          
          if (window.electronAPI) {
              if(typeof diviWebCliConfig !== "undefined"){
                if(diviWebCliConfig.status==1){
                  window.electronAPI.sendDiviWebCliConfig(diviWebCliConfig);
                }else{
                  alert(diviWebCliConfig.msj);
                }
              }
            } else {
              console.error('electronAPI no está disponible');
            }

      })();`;
      document.head.appendChild(script);

    });
}
/*
fetch('https://api.ipify.org?format=json')
.then(response => response.json())
.then(data => {
  console.log('Tu IP pública es:', data.ip);
})
.catch(error => {
  console.error('Error al obtener la IP:', error);
});*/

async function verifySession(exitCounter,exit){

  const totalIntents = (typeof exit!=="undefined")?exit:30;
  var signOutBtn = document.querySelector('a[data-testid="sign-out-link"]');
  if(exitCounter>5){
    mostrarOverlay();
  }
  if(!(signOutBtn) && exitCounter<totalIntents){
      await new Promise(resolve => setTimeout(resolve, 500));
    return verifySession(exitCounter+1,exit);
  }
  if(signOutBtn){
    ocultarOverlay();
  }
  return (signOutBtn)?true:false;
}


function mostrarOverlay(){

  const overlay = document.getElementById('gt-p-overlay');
  const captcha = document.getElementById('g-recaptcha'); 
  if (overlay&&captcha) {
      if(!overlay.classList.contains("no-show")){
        hideOverlayLoding();
        overlay.style.display = 'block';
        overlay.style.opacity = '1';
      }
  }

}

function ocultarOverlay(){

  const overlay = document.getElementById('gt-p-overlay');
  if (overlay) {
      overlay.style.opacity = '0';
      // Ocultar el overlay completamente después de la transición
      setTimeout(() => {
          overlay.style.display = 'none';
      }, 300); // Esperar a que termine la transición de opacidad
  }

}

function mostrarOverlayErrorLogin(){

  const overlay = document.getElementById('gt-p-overlay');
  if (overlay) {
    const div = overlay.querySelector('#gt-p-overlay-content');
    if (div) {
      hideOverlayLoding();
      div.classList.add('log-error');;
      div.innerHTML = `
         <p>No pudimos acceder a Envato Elements, puedes intentarlo nuevamente seleccionando aquí: <a href="https://elements.envato.com/sign-in" target="_parent">Reintentar Login</a></p>
        <p>Si el acceso falla nuevamente, comunícate con el equipo de soporte y entrégale el código de error <strong class="mensaje-popup-error">#00012</strong>.</p>
      `;
      overlay.style.display = 'block';
      overlay.style.opacity = '1';
    }  
  }

}

function createOverlayLoading(){

var styleOverLay =` 
                  /* overlay */
                  
                  #overlay-giga {
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      background: rgba(0, 0, 0, 1);
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      z-index: 9999999999;
                      transition: opacity 0.3s ease;
                  }

                  .loader-giga {
                      color: #fff;
                      font-size: 24px;
                  }`;
                  
  var styleElement = document.createElement('style');
  styleElement.innerHTML = styleOverLay;
  document.head.appendChild(styleElement);

  var overlayContent = `<div id="overlay-giga" class="loader-giga">🤖 Cargando Envato Elements, espera un momento...</div>`;
  var tempContainer = document.createElement('div');
  tempContainer.innerHTML = overlayContent;
  document.body.appendChild(tempContainer);
}

function createBtnMenu(data){
  var newStyle = `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            height: 200vh; 
        }

        .gt-btn-floating-button {
            position: fixed;
            bottom: 10px;
            left: 10px;
            z-index: 9999999999;
            background-color: #76f326;
            color: black;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-align: left;
        }

        .gt-btn-menu {
            position: fixed;
            bottom: 10px;
            left: 10px;
            z-index: 9999999999;
            background-color: #9cee69;
            border: 1px solid #9cee69;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: none;
        }

        .gt-btn-menu ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }

        .gt-btn-menu li {
            border-bottom: 1px solid #8ada58;
        }

        .gt-btn-menu li:last-child {
            border-bottom: none;
        }

        .gt-btn-menu button {
            background: none;
            border: none;
            color: #000000;
            padding: 10px 20px;
            width: 100%;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
			      cursor:pointer;
        }
        
        .gt-btn-menu button a{
            color: #000000 !important;
        }
            
        .hide-menu-button > label{
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 10px 0px;
          cursor: pointer;
          justify-content: center;
        }
        
        .hide-menu-button > label span.close{
            font-size: 0.8em;
            padding: 0px 4px;
        }

        .gt-btn-menu button:hover {
            background-color: #f0f0f0;
        }
        
        .load-url-content{
            position: fixed;
            bottom: 65px;
            left: 10px;
            z-index: 9999;
        }

        .load-url {
            z-index: 9999999999;
            background-color: rgb(0 0 0);
            color: black;
            border: none;
            padding: 8px 8px;
            cursor: pointer;
            border-radius: 0px 0px 8px 8px;
            display: flex;
            align-items: center;
            gap: 7px;
            text-align: left;
        }

        .load-url input {
            border-radius: 5px;
            font-size: 0.8em;
            padding: 0px 8px;
            min-width: 250px;
            outline: none; 
            transition: border-color 0.3s ease, box-shadow 0.3s ease; 
        }

        .load-url input:focus {
            border-color: #76f326;
            border-style: solid;
            border-width: 2px;
        }

        .load-url button {
            background-color: #76f326;
            border: none;
            border-radius: 5px;
            cursor:pointer;
        }

        .load-url button:hover {
            background-color: #70cd35;
        }

        input[type="checkbox"] {
            display: none;
        }

        input[type="checkbox"]:checked ~ .gt-btn-menu {
            display: block;
        }

        input[type="checkbox"]:checked ~ .gt-btn-floating-button{
            display: none;
        }
            
        input[type="checkbox"]:checked ~ .load-url-content {
            display: none;
        }
        
        .gt-counter{
            display: flex;
            flex-direction: row;
            left: 0px;
            justify-content: space-between;
            font-size: 0.8em;
            font-weight: bold;
            cursor: default;
            background-color: #76f326;
            padding: 0px 8px;
            border-radius: 8px 8px 0px 0px;
        }
            

        /* login */

        #username,
        #password {
          color: transparent; 
          /*text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);*/ 
          user-select: none; 
        }

        #username::selection,
        #password::selection {
          background: transparent; 
          color: transparent; 
        }

        #username::-moz-selection,
        #password::-moz-selection {
          background: transparent;
          color: transparent; 
        }

        /* popup */

        .gt-p-overlay {
            display: none; /* Oculto por defecto */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .gt-p-popup {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            width: 700px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: relative;
            padding-bottom:0px;
            margin: auto;
            top: 15%;
        }

        .gt-p-popup h3{
            margin:0px 0px;
        }

        .gt-p-popup p{
            font-size: 0.95em;
            line-height: 1.2em;
            margin: 8px 0px;
        }

        .gt-p-close-btn {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
        }  

        .gt-p-title{
            font-size: 2em;
            font-weight: bold;
        }

        .log-error{
            padding-top: 15px;
            padding-bottom: 20px;
        }
        
        .log-error p {
            font-size: 1.2em !important;
        }
        .log-error a {
            font-weight: 600;
        }
        .log-error strong {
            color:#ff2063;
        }
        .popup .mensaje-popup-error {
            color: #FF0C5B !important;
        }

        `;

  // Crear un nuevo elemento <style> para el CSS
  var styleElement = document.createElement('style');
  styleElement.innerHTML = newStyle;

  // Insertar el CSS al <head> de la página
  document.head.appendChild(styleElement);
/*position: absolute;
    display: flex;
    bottom: 45px;
    flex-direction: row;
    gap: 50px;
    left: 0px;*/ 
  var menuContent = `
    <input type="checkbox" id="gt-btn-toggle-menu"> 
    <div class="load-url-content" for="gt-btn-toggle-menu">
      <div class="gt-counter"><div class="t-downloated">Descargas de hoy: <span>-</span></div><div class="t-available">Disponible: <span>-</span></div></div>
      <div class="load-url">
        <input type="text" id="gt_input_load_url" placeholder="Ingresa tu enlace elements.envato.com">
        <button id="gt_btn_load_url">🔍</button>
      </div>
    </div>
    <label class="gt-btn-floating-button" for="gt-btn-toggle-menu">
        ☰ Más opciones
    </label>
    <div class="gt-btn-menu">
        <ul
            <li><button id="btn-cerrar-sesion" title="Cerrar sesion de la aplicación">🔐 Cerrar sesión</button></li>
            <li><button><a href="https://elements.envato.com/account/downloads" target="_parent" title="Gestiona tus descargas y licencias en Envato Elements">🔑 Descagas y Licencias</a></button></li>
            <li class="hide-menu-button"><label for="gt-btn-toggle-menu" title="Ocultar menú de opciones"><span class="close">❌</span> Ocultar Menú</label></li>
        </ul>
    </div>
   
    `;

    var modalContent = `
    <div id="gt-p-overlay" class="gt-p-overlay">
        <div class="gt-p-popup">
            <div class="gt-p-popup-content">
                <span class="gt-p-close-btn" id="gt-p-closeBtn">&times;</span>

                <h3 class="gt-p-title">¡El acceso fallo!</h3>
                <div id="gt-p-overlay-content">
                  <p>Por favor, verifica si se cargó alguna de estas comprobaciones de seguridad y confirma que no eres un robot. Luego, selecciona el botón de Iniciar sesión o Sign in.</p>
                  <p>Si aun así no puedes acceder, comunícate con el equipo de soporte de Gigathemes.club.</p>
                  <hr>
                  <img src="https://gigathemes.club/wp-content/uploads/2024/08/envato_elements_recaptcha.jpg" style="max-width: 300px;">
                  <hr>
                  <img src="https://gigathemes.club/wp-content/uploads/2024/08/cloudflare-verify.gif" style="max-width: 300px;">
                </div>
            </div>
        </div>
    </div>
    `;
    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = menuContent;
    document.body.appendChild(tempContainer);
    
    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = modalContent;
    document.body.appendChild(tempContainer);

    document.getElementById('gt-p-closeBtn').addEventListener('click', function() {
      var overlay = document.getElementById('gt-p-overlay');
          overlay.style.display = 'none';
          overlay.classList.add("no-show");
    });
    
    document.getElementById('btn-cerrar-sesion').addEventListener('click', function(event) {
      event.preventDefault();
      //const url = this.getAttribute('data-url');
      ipcRenderer.send('cerrar-sesion',data.csg);
    });
    
    document.getElementById('gt_btn_load_url').addEventListener('click', async function(event) {
      event.preventDefault();
      const input = document.getElementById('gt_input_load_url');
      const url = input.value;
      const result = await ipcRenderer.invoke('load-url',url);
      if(result.success){
        window.location.href = url;
        input.value = "";
      }else{
        alert(result.msg);
      }
    });
  
}

async function hideUserActions (del,selector){
  var elements = JSON.parse(selector);
  var hideStatus = await removeElements(elements,del);
   return hideStatus;
};

async function insertDowloadScript(){

  const script = document.createElement('script');
  script.textContent = `
  (function() {
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
          this.method = method;
          this.url = url;
          this.headers = {};
          this.body = null;
          this.setRequestHeader = (function(originalSetRequestHeader) {
            return function(header, value) {
              this.headers[header] = value;
              originalSetRequestHeader.apply(this, arguments);
            };
          })(this.setRequestHeader);
          return originalXhrOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(body) {

          if (this.method.toUpperCase() === 'GET' && this.url.includes('data-api/modal/neue-download')) {
            
            this.body = body;
            this.addEventListener('readystatechange', () => {
              if(this.readyState==XMLHttpRequest.DONE){
                if (this.status === 200) {
                    var data = null;
                    try {
                      var resJson = JSON.parse(this.responseText);
                      data = (typeof resJson.data.item.itemUrl !=="undefined")?resJson.data.item.itemUrl:"error";
                    } catch (error) {}
                    window.electronAPI.sendResponseToNode({type:'url',data:data});
                }else {
                    console.error("Error en la solicitud: ", this.statusText);
                }
              }
            });

          }

          if (this.method.toUpperCase() === 'POST' && this.url.includes('/download_and_license.json')) {
            
            this.body = body;
            this.addEventListener('readystatechange', () => {
              if (this.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                /*fetch(this.url, {
                  method: this.method,
                  headers: this.headers,
                  body: this.body
                }).then(response => {
                  return response.json();
                }).then(data => {
                  // Enviar la respuesta a Node.js
                  window.electronAPI.sendResponseToNode(data);
                }).catch(error => {
                  // Enviar el error a Node.js
                  window.electronAPI.sendResponseToNode({ error: error.message });
                });*/
              }

              if (this.readyState === XMLHttpRequest.DONE) {
                  if (this.status === 200) {
                      window.electronAPI.sendResponseToNode({type:'file',data:this.responseText});
                      this.abort();
                  } else {
                      console.error("Error en la solicitud: ", this.statusText);
                  }
              }
            });
          }

          return originalSend.apply(this, arguments);
        };

      })();

      

  `;
  document.head.appendChild(script);
}

async function removeElements(elements,del){

  var counter = 1;
  var totalElements = elements.length;
  return await (async function loop() {
      
      var counterDelete = 0;
      elements.forEach(elementSelector => {
        try {
          let element = document.querySelector(elementSelector);
          if (element) {
            if(del===true){
              element.remove(); //Oculta el elemento
              counterDelete++;
            }else{
              element.style.visibility = 'hidden';
              counterDelete++;
            }
          }else{
            if(del===true){
              //console.log("No se encontro, intento:"+counter+" - "+elementSelector);
            }
          }
        } catch (error) {
            //console.log("no encontro: %s",elementSelector);
        }
      });
      if(counterDelete==totalElements){
        return true;
      }
      counter++;
      
      if(counter<=((del===false)?40:20)){
        await delay(500);
        return await loop();
      }
      

      return false

  })();

}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function initAutoL(data) {
  
  var loadInputsLogin = await verifyInputsLogin(0);

  if(loadInputsLogin){

      if(await intentLogin(data)){
        
        const submitButtonResult = clickToBtn('[data-testid="submitButton"]');

        if(submitButtonResult){

          var sesionStatus = await verifySession(0);
          console.log("session:"+sesionStatus);
          ipcRenderer.send('set-loged-status', sesionStatus);
          if(sesionStatus){
            hideOverlayLoding();
            const hideUserResult = await hideUserActions(sesionStatus,data.js_s);
            if(!hideUserResult){
              ipcRenderer.send('redirect-out','?param=5');
            }
            //window.location.href="https://elements.envato.com/";
            return true;
          }else{
            mostrarOverlayErrorLogin();
          }
          //ocultarOverlay();
        }else{
          ipcRenderer.send('redirect-out','?param=4');
        }
      }else{
        
        //comprobar el estado de login nuevamente si se ejecuto 2 veces el login
        var loged_status = await ipcRenderer.invoke('get-loged-status');
        if(!loged_status){
          ipcRenderer.send('redirect-out','?param=2');
        }
      }

  }else{
    console.log("No carga login");
  }
  /*while(end==false && intents<2){
    await new Promise(resolve => setTimeout(resolve, 1000));
    intents++;
  }*/    

}

async function verifyInputsLogin(exitCounter){
  var uIn = document.querySelector('input[name="username"]');
  var pIn = document.querySelector('input[name="password"]');
  var btn = document.querySelector('[data-testid="submitButton"]');
  if(!(uIn&&pIn&&btn) && exitCounter<20){
      await new Promise(resolve => setTimeout(resolve, 500));
      //return verifyInputsLogin(exitCounter+1);
  }else{
    return ((uIn&&pIn&&btn)?true:false);
  }
}

async function intentLogin(platformData){
  this.platformData = platformData;
  var usernameInput = document.querySelector('input[name="username"]');
  var passwordInput = document.querySelector('input[name="password"]');

  if(usernameInput==null || typeof usernameInput ==="undefined"){
    clickToBtn('button[data-testid="signInLink"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    usernameInput = document.querySelector('input[name="username"]');
    passwordInput = document.querySelector('input[name="password"]');
  }

  // Simular el tipeo en el campo de usuario y contraseña
  if (usernameInput && passwordInput) {
    await typeInInput(usernameInput, platformData.u); // Simular tipeo en el campo de usuario
    await typeInInput(passwordInput, platformData.ps); // Simular tipeo en el campo de contraseña
    disabledInputEvents(usernameInput);
    disabledInputEvents(passwordInput);
    return true;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  return false;

}

function disabledInputEvents(input){
  // Deshabilitar el corte, copia y pegado
  input.addEventListener('cut', function(event) {
      event.preventDefault();
  });
  input.addEventListener('copy', function(event) {
      event.preventDefault();
  });
  input.addEventListener('paste', function(event) {
      event.preventDefault();
  });
  // Evitar que se escriba en el input
  input.addEventListener('keydown', function(event) {
      event.preventDefault();
  });
  // Deshabilitar la selección de texto
  input.addEventListener('mousedown', function(event) {
      event.preventDefault();
  });

}

async function typeInInput(inputElement, text) {
  inputElement.focus(); // Enfocar el input primero
  for (let char of text) {
    inputElement.value += char; // Agregar el caracter al valor del input
    inputElement.dispatchEvent(new Event('input', { bubbles: true })); // Disparar evento de input
    await new Promise(resolve => setTimeout(resolve, 50)); // Pequeño retraso para simular tipeo
  }
}

function showOverlayLoding(){
  var overlayGiga = document.getElementById('overlay-giga');
  if(overlayGiga){
    overlayGiga.style.display = 'block';
  }
}

function hideOverlayLoding(){
  var overlayGiga = document.getElementById('overlay-giga');
  if(overlayGiga){
    overlayGiga.style.display = 'none';
  }
}

function clickToBtn(selector){
  const btn = document.querySelector(selector);
  if(btn!=null && typeof btn !=="undefined"){
    try{
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      btn.dispatchEvent(clickEvent);
      return true;
    } catch (error) {
      console.error('No se encontro boton selector:'+selector, err)
    }
  }
  return false;
}

function updateDownloadCounter(data){
  const t_downloated = document.querySelector(".gt-counter .t-downloated span");
  const t_available = document.querySelector(".gt-counter .t-available span");
  if(data!==null){
    if(t_downloated!==null){
      t_downloated.innerHTML = data.d_c;
    }
    if(t_available!==null){
      t_available.innerHTML = (parseInt(data.l_d) - parseInt(data.d_c));
    }
  }
}
