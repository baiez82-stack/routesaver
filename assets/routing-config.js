/* Public runtime configuration. Secrets must never be added to this file. */
(function configureRouteSaver(){
  'use strict';

  var existing=window.RouteSaverConfig||{};
  window.RouteSaverConfig=Object.assign({
    tomtomProxyUrl:'https://routesaver-pi.vercel.app/api/tomtom',
    tomtomTrafficEnabled:false,
    tomtomKeySource:'server-proxy'
  },existing);

  var proxy=String(window.RouteSaverConfig.tomtomProxyUrl||'').trim();
  window.RouteSaverConfig.tomtomProxyUrl=proxy;
  window.RouteSaverConfig.tomtomTrafficEnabled=Boolean(proxy);
  document.documentElement.dataset.tomtomTraffic=proxy?'configured':'not-configured';
})();

/* Public-beta labels live here so the calculator stays untouched while the
   commercial offer is validated separately. */
(function alignPublicBetaLabels(){
  var status=document.querySelector('.topright .beta');
  var plans=document.querySelector('.topright a[href="plus.html"]');
  var footer=document.querySelector('footer.foot > span');

  if(status){
    status.textContent='BETA GRATUITA';
    status.title=window.RouteSaverConfig.tomtomTrafficEnabled
      ?'Traffico live TomTom configurato'
      :'Traffico live non ancora configurato';
  }
  if(plans)plans.textContent='Piani';
  if(footer)footer.textContent='RouteSaver · Beta pubblica gratuita';
})();
