const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('node:path');
const util = require('./util');

console.log(process.env.NODE_ENV);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
// descomentar para proxy
//app.commandLine.appendSwitch('proxy-server', 'http://154.127.55.180:21230');

app.on('ready', async() => {

    console.log('Ruta de almacenamiento de datos del usuario:', app.getPath('userData'));
    const app_updated = await util.verifyAppVersion(app.getVersion());
    let mainWindow = createWindow(app_updated);
    util.setMainWindow(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const app_updated = await util.verifyAppVersion(app.getVersion());
    createWindow(app_updated);
  }
});

app.on('web-contents-created', (event, contents) => {

  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://elements.envato.com') && !url.includes('gigathemes.club') && !url.includes('giga-dev.test')) {
      if(!util.isValidEnvatoUrl(url).success){
        if(url.startsWith('https://api.whatsapp.com/send?phone=')){
          shell.openExternal(url);
        }
        event.preventDefault();
      }
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (util.isValidEnvatoUrl(url).success) {
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (mainWindow) {
        mainWindow.loadURL(url);
      }
    }
    return { action: 'deny' };
  });

});

function createWindow(app_updated) {

  //cambiar de header antes que cargue la pagina
  const customSession = session.fromPartition('persist:main', { cache: false });

  const allowedDomains = ['facebook.com', 
                          'analytics.tiktok.com', 
                          'bat.bing.com',
                          'googleads.g.doubleclick.net',
                          'ct.pinterest.com',
                          'ad.doubleclick.net',
                          '9130649.fls.doubleclick.net',
                          ];

  customSession.webRequest.onBeforeSendHeaders((details, callback) => {

    let userAgent = details.requestHeaders['User-Agent'];
    if(typeof userAgent !=="undefined"){
      userAgent = userAgent.replace(/GigathemesEnvatoDownloader\/\d+\.\d+\.\d+/g, '')
                            .replace(/Electron\/\d+\.\d+\.\d+/g, '')
                            .replace(/(\s{2,})/g, ' ')
                            .trim();
      details.requestHeaders['User-Agent'] = userAgent;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });

  });

  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, "../images/icon.ico"),
    webPreferences: {
      session: session.fromPartition('persist:main'), // Usando partición persistente
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      devTools: false, // Deshabilitar DevTools
    }
  });
  
  //Eliminar menu
  win.setMenu(null);
  //abrir el debugger
  //win.webContents.openDevTools();

  if(app_updated){
    win.loadURL(util.getHost()+'/access/login-externo/?service_platform=1');
  }else{
    win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY); 
    return true;
  }

  // Manejar el evento will-download desde webContents
  win.webContents.session.on('will-download', (event, downloadItem, webContents) => {

        // Obtener el nombre del archivo
        const fileName = downloadItem.getFilename();
        // Obtener la ruta completa donde se guardará el archivo

        /*const savePath = path.join(app.getPath('downloads'), downloadItem.getFilename());
        console.log("will-download: "+savePath);

        downloadItem.setSavePath(savePath);
        console.log('Descarga pausada');
        event.preventDefault();
        
        // Opcional: Manejar eventos de progreso
        downloadItem.on('updated', (event, state) => {
          if (state === 'progressing') {
              if (downloadItem.isPaused()) {
                  console.log('Descarga pausada');
              } else {
                  console.log(`Progreso de la descarga: ${downloadItem.getReceivedBytes()}/${downloadItem.getTotalBytes()}`);
              }
          }
      });*/

      downloadItem.on('done', (event, state) => {
          if (state === 'completed') {
            const savePath = downloadItem.getSavePath();
            util.showAlertConfirmDownloadLicense(fileName,savePath);
            //console.log(`El archivo ${fileName} se guardaro en: ${savePath}`);
          } else {
              console.log(`Descarga fallida: ${state}`);
          }
      });

  });
    
  
  win.webContents.on('dom-ready', async() => {
    if (win.webContents.getURL().startsWith('https://elements.envato.com')) {
      const platFormData = util.getPlatformData();
      if(platFormData!==false){
        const pData = util.getPlatformData().pf;
        const counterData =  {d_c:platFormData.d_c,l_d:platFormData.cf.c_l};
        win.webContents.send('data-from-main', pData,counterData);
      }
    }
  });

  /*win.webContents.on('did-finish-load', async() => {
    if (win.webContents.getURL().startsWith('https://elements.envato.com')) {
        await win.webContents.executeJavaScript(`window.electronAPI.initAutoL(${util.getLogged()})`)
        .catch(err => {
          console.log("Volver a cargar 2:",err)
        });
    }
  });*/

  // Manejar fallos de carga de página
  win.webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error(`Error al cargar ${validatedURL}: ${errorDescription} (Código de error: ${errorCode})`);
    if(win.webContents.getURL()==util.getEnvatoSignIn()){
      await util.delay(1000);
      await win.loadURL(util.getEnvatoSignIn());
    }
  });

  win.on('closed', () => {
    win = null;
  });

  app.on('login', (event, webContents, details, authInfo, callback) => {
    event.preventDefault()
    const platformData = util.getPlatformData();
    if(platformData!==false){
      callback(platformData.p.u, platformData.p.ps);
    }
  });

  return win;
}

// Manejar la recepción de detalles de solicitudes POST en el proceso principal
ipcMain.on('set-diviWebCliConfig', async (event, diviWebCliConfig) => {
  let data64 = diviWebCliConfig.serial;
  let data = JSON.parse(Buffer.from(data64, 'base64').toString('utf-8'));
  let full_nonce = data.nonce+"24yGig$*4pp";
  let stringResponse = util.decrypt(data.a, full_nonce);

  try {
    // Intentar convertir el string a un objeto JSON
    const jsonResponse = JSON.parse(stringResponse);
    if(typeof jsonResponse.st!=="undefined" && jsonResponse.st==1){
      
      jsonResponse.d_c = parseInt(data.d_c);
      jsonResponse.resources = diviWebCliConfig.resources;
      util.setPlatformData(jsonResponse);

      let proxyCredentials = {  
                                username : jsonResponse.p.u,
                                password : jsonResponse.p.ps,
                                proxyRules : jsonResponse.p.url+":"+jsonResponse.p.p
                                };
      util.setProxyCredentials(proxyCredentials);
      await util.setProxy(util.getMainWindow(),util.getEnvatoSignIn());
    }
    
  } catch (error) {
      // Manejar el error si el string no es un JSON válido
      console.error('Error al convertir el string a JSON:', error);
  }

  
});
// Manejar la recepción de detalles de solicitudes POST en el proceso principal
ipcMain.on('post-request-response', async (event, response) => {
  const type = response.type;
  
  if(type!="file"){
    util.setCurrentUrl(response.data);
  }

  const current_url = util.getCurrentUrl();
  let newResource = null;

  if(current_url){
    newResource = (util.getPlatformData().resources.includes(current_url))?false:current_url;
  }else{
    util.redirectAccountResume('?param=9');
    return true;
  }

  if(util.getCounter() >= util.getLimitDownload() && newResource){
    util.redirectAccountResume('?param=1');
    return true;
  }else{
      if(type=="file"){

        const downloadData = JSON.parse(response.data);
        const platformData = util.getPlatformData();
        const user_id = platformData.u;
        const platform_id = platformData.pf.pid;
        const tk = platformData.tk;
      
        const resultRegisterDownload = await util.registerDownload(user_id,platform_id,current_url,tk);
      
        if(resultRegisterDownload.success){
          util.addCounter(resultRegisterDownload.total_download);
          util.addNewResource(newResource);
          util.updateDownloadCounter();
          shell.openExternal(downloadData.data.attributes.downloadUrl);
        }else{
          //code 10 - IP ivalida
          //code 9 - nonce expiro
          if(resultRegisterDownload.code==9){
            util.redirectLogin('&msg='+resultRegisterDownload.code);
          }else{
            util.redirectAccountResume('?param='+resultRegisterDownload.code);
          }

        }
      }
  }
 
});

// Recibir la URL desde el proceso de renderizado
/*ipcMain.on('url-clicked', (event, url) => {

  const current_url = util.getCurrentUrl();
  
  if(current_url =="error"){
    console.log("Error consulta con el equipo de soporte Gigathemes");
    util.redirectAccountResume('?param=3');
    return true;
  }

  console.log("getCounter: "+util.getCounter());
  console.log("getLimitDownload: "+util.getLimitDownload());

  if(current_url){
    const newResource = (util.getPlatformData().resources.includes(current_url))?false:current_url;
    console.log("newResource: "+newResource);
    if(newResource){
      if(util.getCounter() >= util.getLimitDownload()){
        console.log("se supero el limite");
        util.redirectAccountResume('?param=1');
      }else{
        util.addNewResource(newResource);
      }
    }
  }
  
});*/

ipcMain.handle('get-loged-status', () => {
  return util.getLogged();
});
ipcMain.on('set-loged-status', (event, status) => {
  util.setLogged(status);
});
ipcMain.on('redirect-out', async (event, param) => {
  //?param=1 - limite de descarga superado
  //?param=2 - inicio de sesion envato fallido
  //?param=3 - no se encontro selector css boton descarga
  //?param=4 - no se encontro selector css boton login envato
  //?param=5 - no se encontro selector de ocultar elementos
  util.redirectAccountResume(param);
});

ipcMain.on('cerrar-sesion', async (event, url) => {
  await util.redirectLogout(url);
});
ipcMain.handle('load-url', async (event, url) => {
  return util.isValidEnvatoUrl(url);
});