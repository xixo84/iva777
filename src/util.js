const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

class UtilHelper {
  constructor() {
    let mainWindow = null;
    this.proxyCredentials = {
      proxyRules: 'direct://',
      username: '',
      password: ''
    };
    this.current_url = "";
    this.platformData = {};
    this.logged = false;
    this.host_url = 'https://giga-dev.test';
  }

  static getInstance() {
    if (!UtilHelper.instance) {
      UtilHelper.instance = new UtilHelper();
    }
    return UtilHelper.instance;
  }

  setMainWindow(mainWindow){
    return this.mainWindow = mainWindow;
  }

  getMainWindow(){
    return this.mainWindow;
  }

  getHost(){
    return this.host_url;
  }

  getEnvatoSignIn() {
    return "https://elements.envato.com/sign-in";
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getLogged() {
    return this.logged;
  }

  setLogged(logged) {
    this.logged = logged;
  }

  getCurrentUrl() {
    return this.current_url;
  }

  setCurrentUrl(current_url) {
    this.current_url = current_url;
  }

  getPlatformData() {
    if (Object.keys(this.platformData).length > 0 && this.platformData.tk !== undefined) {
      return this.platformData;
    }
    return false;
  }

  setPlatformData(platformData) {
    this.platformData = platformData;
  }

  getProxyCredentials() {
    return this.proxyCredentials;
  }

  setProxyCredentials(proxyCredentials) {
    this.proxyCredentials = proxyCredentials;
  }

  getCounter() {
    if (Object.keys(this.platformData).length > 0) {
      return parseInt(this.platformData.d_c);
    }
    return false;
  }

  getLimitDownload() {
    if (Object.keys(this.platformData).length > 0) {
      if (this.platformData.cf && this.platformData.cf.c_l !== undefined) {
        return this.platformData.cf.c_l;
      }
    }
    return 3;
  }

  addCounter(total_download) {
    if (Object.keys(this.platformData).length > 0) {
      if(typeof total_download !=="undefined"){
        this.platformData.d_c = parseInt(total_download);
      }else{
        this.platformData.d_c = parseInt(this.platformData.d_c) + 1;
      }
      return true;
    }
    return false;
  }

  decrypt(encryptedData, key) {
    const method = 'aes-256-cbc';
    const keyHash = crypto.createHash('sha256').update(key).digest();

    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const ivLength = 16;
    const iv = encryptedBuffer.slice(0, ivLength);
    const encryptedText = encryptedBuffer.slice(ivLength);

    const decipher = crypto.createDecipheriv(method, keyHash, iv);
    let decrypted = decipher.update(encryptedText, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async setProxy(mainWindow, url) {
    const proxyRules = this.platformData.p.url + ":" + this.platformData.p.p;
    try {
      await mainWindow.webContents.session.setProxy({ proxyRules });
      await this.delay(1000);
      await mainWindow.loadURL(url);
      return true;
    } catch (error) {
      console.error('Error configurando el proxy:', error);
      throw error;
    }
  }

  async verifyAppVersion(app_version){
    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const response = await axios.post(this.host_url+'/wp-api/rest/envato_app_version', {
        gtoken: '&yo5Zg$3/FKZo334Lp3fa'
      }, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (response.data) {
        if(response.data.success){
          return (response.data.version == app_version);
        }
      }
    } catch (error) {
      console.error('Error while load api resource envato_app_version:', error);
    }
    return true;
  }

  async registerDownload(id_user, id_platform, url, nonce) {
    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const response = await axios.post(this.host_url+'/wp-admin/admin-ajax.php', {
        action: 'register_download',
        id_user:id_user,
        id_platform:id_platform,
        url:url,
        nonce:nonce
      }, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (response.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error while registering download:', error);
    }
    return false;
  }

  addNewResource(url){
    if (Object.keys(this.platformData).length > 0) {
      if(!this.platformData.resources.includes(url)&&url){
        this.platformData.resources.push(url);
        return true;
      }
    }
    return false;
  }

  async redirectAccountResume(param){
    await this.mainWindow.loadURL(this.host_url+"/access/envato-account-resume/"+param);
    return true;
  }
  async redirectLogin(param){
    await this.mainWindow.webContents.session.setProxy({ proxyRules: 'direct://' });
    await this.delay(1000);
    await this.mainWindow.loadURL(this.host_url+"/access/login-externo/?service_platform=1"+param);
    return true;
  }
  async redirectLogout(url){
    await this.mainWindow.webContents.session.setProxy({ proxyRules: 'direct://' });
    await this.delay(1000);
    await this.mainWindow.loadURL(url);
    return true;
  }

  async updateDownloadCounter(){
    let data = null;
    if (Object.keys(this.platformData).length > 0) {
      data = {d_c:this.platformData.d_c,l_d:this.getLimitDownload()};
    }
    return await this.mainWindow.webContents.send('updateDowloadCounter', data);
  };

  isValidEnvatoUrl(url) {
    try {
        // Crear un objeto URL para validar y extraer las partes de la URL
        const parsedUrl = new URL(url);

        // Validar que el host sea 'elements.envato.com'
        if (parsedUrl.host !== 'elements.envato.com') {
            return {success:false,msg:"Solo se admiten enlaces de elements.envato.com"};
        }

        // Lista de rutas no permitidas
        const forbiddenPaths = [
            '/pricing/teams/upgrade',
            '/sign-out',
            '/extensions/figma',
            '/extensions/canva',
            '/extensions/premiere-pro'
        ];

        // Verificar si la ruta coincide con alguna de las rutas prohibidas
        for (const path of forbiddenPaths) {
            if (parsedUrl.pathname.includes(path)) {
                return {success:false,msg:"Este enlace no esta permitido."};
            }
        }

        // Si pasa todas las validaciones, la URL es válida
        return {success:true,msg:"Enlace inválido"};
    } catch (e) {
        // Si no se puede crear un objeto URL, la URL no es válida
        return {success:false,msg:"Este enlace es inválido, revisa que funcione en tu navegador."};
    }
  };

  async showAlertConfirmDownloadLicense(fileName,savePath){
    if(fileName!==""&&savePath!==""){
      return await this.mainWindow.webContents.send('showAlertConfirmDownloadLicense', {fileName:fileName,savePath:savePath});
    }
    return false;
  };

}



module.exports = {
  delay: (ms) => UtilHelper.getInstance().delay(ms),
  getProxyCredentials: () => UtilHelper.getInstance().getProxyCredentials(),
  setProxyCredentials: (proxyCredentials) => UtilHelper.getInstance().setProxyCredentials(proxyCredentials),
  getPlatformData: () => UtilHelper.getInstance().getPlatformData(),
  setPlatformData: (platformData) => UtilHelper.getInstance().setPlatformData(platformData),
  decrypt: (encryptedData, key) => UtilHelper.getInstance().decrypt(encryptedData, key),
  setProxy: (mainWindow, url) => UtilHelper.getInstance().setProxy(mainWindow, url),
  getCounter: () => UtilHelper.getInstance().getCounter(),
  addCounter: (total_download) => UtilHelper.getInstance().addCounter(total_download),
  getLimitDownload: () => UtilHelper.getInstance().getLimitDownload(),
  getCurrentUrl: () => UtilHelper.getInstance().getCurrentUrl(),
  setCurrentUrl: (current_url) => UtilHelper.getInstance().setCurrentUrl(current_url),
  registerDownload: (id_user, id_platform, url, nonce) => UtilHelper.getInstance().registerDownload(id_user, id_platform, url, nonce),
  getEnvatoSignIn: () => UtilHelper.getInstance().getEnvatoSignIn(),
  getLogged: () => UtilHelper.getInstance().getLogged(),
  setLogged: (logged) => UtilHelper.getInstance().setLogged(logged),
  addNewResource: (url) => UtilHelper.getInstance().addNewResource(url),
  redirectAccountResume: (param) => UtilHelper.getInstance().redirectAccountResume(param),
  redirectLogin: (param) => UtilHelper.getInstance().redirectLogin(param),
  redirectLogout:(url) => UtilHelper.getInstance().redirectLogout(url),
  getHost: () => UtilHelper.getInstance().getHost(),
  getMainWindow: () => UtilHelper.getInstance().getMainWindow(),
  setMainWindow: (mainWindow) => UtilHelper.getInstance().setMainWindow(mainWindow),
  isValidEnvatoUrl:(url) => UtilHelper.getInstance().isValidEnvatoUrl(url),
  showAlertConfirmDownloadLicense:(fileName,savePath) => UtilHelper.getInstance().showAlertConfirmDownloadLicense(fileName,savePath),
  updateDownloadCounter:() => UtilHelper.getInstance().updateDownloadCounter(),
  verifyAppVersion:(version) => UtilHelper.getInstance().verifyAppVersion(version)
};
