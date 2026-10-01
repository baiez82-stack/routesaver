/*
 * Runtime configuration for RouteSaver.
 *
 * During the GitHub Pages deployment, the TOMTOM_API_KEY repository secret
 * replaces the marker below. The key is never committed to the repository.
 * Because this is a browser application, the deployed key must also be
 * restricted in TomTom to the RouteSaver domain and to the Routing product.
 */
(function configureRouteSaver(){
  'use strict';

  var injectedKey='__TOMTOM_API_KEY__';
  if(injectedKey==='__TOMTOM_API_KEY__')injectedKey='';

  var existing=window.RouteSaverConfig||{};
  window.RouteSaverConfig=Object.assign({
    tomtomApiKey:injectedKey,
    tomtomTrafficEnabled:false,
    tomtomKeySource:injectedKey?'github-pages-secret':'not-configured'
  },existing);

  var finalKey=String(window.RouteSaverConfig.tomtomApiKey||'').trim();
  window.RouteSaverConfig.tomtomApiKey=finalKey;
  window.RouteSaverConfig.tomtomTrafficEnabled=Boolean(finalKey);
  if(finalKey&&window.RouteSaverConfig.tomtomKeySource==='not-configured'){
    window.RouteSaverConfig.tomtomKeySource='runtime-override';
  }

  document.documentElement.dataset.tomtomTraffic=finalKey?'configured':'not-configured';
})();

/* Public-beta labels live here so the calculator stays untouched while the
   commercial offer is validated separately. This script is loaded after the
   page markup, therefore no extra listener is required. */
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
