// var debugConsole = function (debug) {
//   this.enabled = debug || false;
// };
// debugConsole.prototype.Log = function (type, str) {
//   if (this.enabled) {
//     var date = new Date();
//     var strdate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
//     var strhour = date.getHours() + ':' + date.getMinutes();
//     console.log('[' + type.toUpperCase() + '][' + strhour + ' ' + strdate + ']:' + str);
//   }
// };

export class Debug {

  constructor(readonly isEnabled : boolean = false) { }

  public log(type : 'error' | 'warning' | 'info', str : string | number) : void {
    if (this.isEnabled) {
    const date = new Date();
    const strdate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const strhour = `${date.getHours()}:${date.getMinutes()}`;
    console.log(`[${type.toUpperCase() || 'info'}][${strhour}-${strdate}]: ${str}`);
    }
  }
}