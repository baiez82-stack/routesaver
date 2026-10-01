/* Set only a browser key restricted to this site's domains and Routing API.
   Never put a private/server credential here. No provider is enabled by default. */
window.RouteSaverConfig = Object.assign({tomtomApiKey:''}, window.RouteSaverConfig || {});

/* Public-beta labels live here so the calculator stays untouched while the
   commercial offer is validated separately. This script is loaded after the
   page markup, therefore no extra listener is required. */
(function alignPublicBetaLabels(){
  var status = document.querySelector('.topright .beta');
  var plans = document.querySelector('.topright a[href="plus.html"]');
  var footer = document.querySelector('footer.foot > span');

  if (status) status.textContent = 'BETA GRATUITA';
  if (plans) plans.textContent = 'Piani';
  if (footer) footer.textContent = 'RouteSaver · Beta pubblica gratuita';
})();
