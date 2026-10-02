/* Pure route calculations shared by the interface and regression tests. */
(function(root,factory){var api=factory();if(typeof module==='object')module.exports=api;else root.RouteSaverRoutes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function valid(p){return Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;}
  function distance(a,b){var r=Math.PI/180,dlat=(b[1]-a[1])*r,dlon=(b[0]-a[0])*r,v=Math.sin(dlat/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dlon/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,v)));}
  function cumulative(coords){var out=[0];for(var i=1;i<coords.length;i++)out.push(out[i-1]+distance(coords[i-1],coords[i]));return out;}
  function routeId(coords){var h=2166136261;coords.forEach(function(p){var s=p[0].toFixed(6)+','+p[1].toFixed(6)+';';for(var j=0;j<s.length;j++){h^=s.charCodeAt(j);h=Math.imul(h,16777619);}});return 'RS-'+(h>>>0).toString(16).padStart(8,'0');}
  function anchors(coords,count){
    if(!coords||coords.length<3||!coords.every(valid))return [];
    var ds=cumulative(coords),total=ds[ds.length-1],out=[],used=new Set();
    if(total<1)return out;
    // Distance along the actual line, never a point interpolated off the road.
    for(var i=1;i<=count;i++){var target=total*i/(count+1),idx=1;while(idx<ds.length-2&&ds[idx]<target)idx++;
      if(ds[idx]<.1||total-ds[idx]<.1||used.has(idx))continue;used.add(idx);out.push(coords[idx]);}
    return out;
  }
  function navigation(route,a,b){
    var coords=route.coords||[];if(coords.length<2||!coords.every(valid))return null;
    function pair(p){return p[1].toFixed(6)+','+p[0].toFixed(6);}
    var from=valid([a.lon,a.lat])?[a.lon,a.lat]:coords[0],to=valid([b.lon,b.lat])?[b.lon,b.lat]:coords[coords.length-1];
    var via=anchors(coords,3),q=new URLSearchParams({api:'1',origin:pair(from),destination:pair(to),travelmode:'driving'});
    if(via.length)q.set('waypoints',via.map(pair).join('|'));
    return {google:'https://www.google.com/maps/dir/?'+q,waypoints:via.length};
  }
  function gpx(route){
    if(!route.coords||route.coords.length<2||!route.coords.every(valid))throw new Error('Traccia non disponibile');
    return '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="RouteSaver" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>'+routeId(route.coords)+'</name><trkseg>'+route.coords.map(function(p){return '<trkpt lat="'+p[1]+'" lon="'+p[0]+'"/>';}).join('')+'</trkseg></trk></gpx>';
  }
  function lineDistance(point,coords){
    if(!valid(point)||!coords||coords.length<2)return Infinity;
    var best=Infinity,cos=Math.cos(point[1]*Math.PI/180),scale=111.195;
    for(var i=1;i<coords.length;i++){
      var a=coords[i-1],b=coords[i],ax=(a[0]-point[0])*cos*scale,ay=(a[1]-point[1])*scale,bx=(b[0]-point[0])*cos*scale,by=(b[1]-point[1])*scale;
      var dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
      best=Math.min(best,Math.hypot(ax+t*dx,ay+t*dy));
    }return best;
  }
  function toll(route){
    if(Number.isFinite(route.tollOverride)&&route.tollOverride>=0)return {amount:route.tollOverride,source:'Inserito da te',known:true};
    if(Number.isFinite(route.tollKm)&&route.tollKm>=0)return {amount:route.tollKm*.078,source:route.tollKm===0?'Nessun tratto a pedaggio rilevato':'Stima sui km a pedaggio · 0,078 €/km',known:true};
    return {amount:0,source:'Pedaggio non disponibile',known:false};
  }
  function traffic(route,now){
    var t=route.traffic;
    if(!t||t.status!=='live'||!Number.isFinite(t.fetchedAt)||!Number.isFinite(t.delaySec)||t.delaySec<0)return {status:'unavailable',delaySec:0};
    if((now===undefined?Date.now():now)-t.fetchedAt>5*60000)return {status:'stale',delaySec:t.delaySec,fetchedAt:t.fetchedAt};
    return t;
  }
  // Marginal standing/auxiliary consumption only. Not a certified stop-start model.
  // It is additional to the road-speed curve, and delay is NOT added to the ETA twice.
  function congestionCost(route,mode,fuelPrice,energyPrice,electricShare){
    var state=traffic(route),hours=state.status!=='unavailable'?state.delaySec/3600:0;
    var rates={benzina:.8,diesel:.6,ibrida:.2,plugin:.6,elettrica:0};
    var share=mode==='elettrica'?1:mode==='plugin'?Math.max(0,Math.min(1,electricShare||0)):0;
    var fuel=hours*(rates[mode]||0)*(1-share),electric=hours*1*share;
    return {fuelUse:fuel,electricUse:electric,cost:fuel*fuelPrice+electric*energyPrice,delaySec:hours*3600,status:state.status};
  }
  function energyCost(route,p,profile,evProfile){
    var t=toll(route),delay,energyUse,energy;
    if(p.mode==='plugin'){
      var available=Math.max(0,p.capacity)*Math.max(0,Math.min(100,p.soc)-10)/100;
      var state=traffic(route),hours=state.status==='unavailable'?0:state.delaySec/3600;
      var electricKm=Math.min(route.km,available/(evProfile.adjusted/100+(route.km>0?hours/route.km:0)));
      var fuelKm=Math.max(0,route.km-electricKm);
      delay=congestionCost(route,p.mode,p.price,p.evPrice,route.km>0?electricKm/route.km:0);
      var electricUse=electricKm/100*evProfile.adjusted+delay.electricUse,fuelUse=fuelKm/100*profile.adjusted+delay.fuelUse;
      var electricCost=electricUse*p.evPrice,fuelCost=fuelUse*p.price;energy=electricCost+fuelCost;
      return {energy:energy,electricCost:electricCost,fuelCost:fuelCost,electricKm:electricKm,fuelKm:fuelKm,electricUse:electricUse,fuelUse:fuelUse,
        toll:t.amount,tollKnown:t.known,tollSource:t.source,total:energy+t.amount,trafficExtraCost:delay.cost,traffic:delay,
        baseConsumption:profile.base,baseEvConsumption:evProfile.base,consumption:profile.adjusted,evConsumption:evProfile.adjusted,
        roadMix:profile.mix,speedBands:profile.bands,avgRoadSpeed:profile.avgRoadSpeed,mixSource:profile.source};
    }
    delay=congestionCost(route,p.mode,p.price,p.price,0);
    energyUse=route.km/100*profile.adjusted+(p.mode==='elettrica'?delay.electricUse:delay.fuelUse);energy=energyUse*p.price;
    return {energy:energy,energyUse:energyUse,toll:t.amount,tollKnown:t.known,tollSource:t.source,total:energy+t.amount,trafficExtraCost:delay.cost,traffic:delay,
      baseConsumption:profile.base,consumption:route.km>0?energyUse/route.km*100:profile.adjusted,
      roadMix:profile.mix,speedBands:profile.bands,avgRoadSpeed:profile.avgRoadSpeed,mixSource:profile.source};
  }
  function rank(data,maxExtra,options){
    if(!data.length)throw new Error('Nessun percorso');
    var requireLiveTraffic=!!(options&&options.requireLiveTraffic);
    var fastest=data.reduce(function(a,b){return b.route.sec<a.route.sec?b:a;});
    var complete=data.every(function(x){var state=traffic(x.route).status;return x.cost.tollKnown&&state!=='stale'&&(!requireLiveTraffic||state==='live');});
    data.forEach(function(x){x.deltaSec=Math.max(0,x.route.sec-fastest.route.sec);x.save=complete?fastest.cost.total-x.cost.total:null;});
    var eligible=data.filter(function(x){return x.deltaSec<=maxExtra*60;});
    var best=complete?eligible.reduce(function(a,b){return b.cost.total<a.cost.total-.01||(Math.abs(b.cost.total-a.cost.total)<.01&&b.route.sec<a.route.sec)?b:a;}):fastest;
    return {fastest:fastest,best:best,complete:complete};
  }
  function tomtomRoute(raw,fetchedAt){
    var s=raw.summary||{},coords=[];
    (raw.legs||[]).forEach(function(l){(l.points||[]).forEach(function(p){coords.push([p.longitude,p.latitude]);});});
    if(coords.length<2||!coords.every(valid)||!Number.isFinite(s.travelTimeInSeconds)||s.travelTimeInSeconds<=0||!Number.isFinite(s.lengthInMeters)||s.lengthInMeters<=0)throw new Error('Risposta traffico incompleta');
    var ds=cumulative(coords),tollMask=new Set(),sections=raw.sections||[],specialToll=false;
    sections.forEach(function(x){if(x.sectionType==='TOLL_VIGNETTE'||x.sectionType==='FERRY'||x.sectionType==='CAR_TRAIN')specialToll=true;
      if(x.sectionType==='TOLL_ROAD'){if(!Number.isInteger(x.startPointIndex)||!Number.isInteger(x.endPointIndex)||x.startPointIndex<0||x.endPointIndex>=coords.length||x.endPointIndex<=x.startPointIndex){specialToll=true;return;}for(var i=x.startPointIndex;i<x.endPointIndex;i++)tollMask.add(i);}
    });
    var tollKm=0;tollMask.forEach(function(i){tollKm+=ds[i+1]-ds[i];});
    var countries=sections.filter(function(x){return x.sectionType==='COUNTRY';});
    if(tollKm>0&&(!countries.length||countries.some(function(x){return x.countryCode!=='ITA';})))specialToll=true;
    var free=s.noTrafficTravelTimeInSeconds,delay=Number.isFinite(free)?Math.max(0,s.travelTimeInSeconds-free):s.trafficDelayInSeconds;
    var hasTraffic=Number.isFinite(delay)&&delay>=0;
    return {km:s.lengthInMeters/1000,sec:s.travelTimeInSeconds,freeFlowSec:Number.isFinite(free)&&free>0?free:null,coords:coords,live:true,
      tollKm:specialToll?null:tollKm,id:routeId(coords),traffic:{status:hasTraffic?'live':'unavailable',delaySec:hasTraffic?delay:0,fetchedAt:fetchedAt},provider:'TomTom',roadMixSource:'estimated'};
  }
  async function tomtomRoutes(a,b,proxyUrl,fetcher,options){
    if(!/^https:\/\//.test(proxyUrl))throw new Error('Proxy traffico non configurato');
    async function request(avoid){
      var q=new URLSearchParams({from:a.lat+','+a.lon,to:b.lat+','+b.lon,maxAlternatives:avoid?'0':'2'});
      if(avoid)q.set('avoid','tollRoads');
      var r=await fetcher(proxyUrl+'?'+q);if(!r.ok)throw new Error('Traffico non disponibile');var j=await r.json();
      if(!Array.isArray(j.routes)||!j.routes.length)throw new Error('Traffico non disponibile');return j.routes.map(function(x){return tomtomRoute(x,Date.now());});
    }
    var routes=await request(false);
    // The toll-free comparison is optional. If requested, both calls must succeed so
    // geometries and traffic times always come from the same provider and instant.
    if(options&&options.includeNoToll){var noToll=await request(true);routes=routes.concat(noToll);}
    if(routes.some(function(r){return r.traffic.status!=='live';}))throw new Error('Tempi di traffico incompleti');
    routes=routes.filter(function(r,i){return !routes.slice(0,i).some(function(x){return x.id===r.id;});}).sort(function(a,b){return a.sec-b.sec;});
    return {fast:routes[0],smart:routes[1],cheap:routes[2],extra:routes.slice(3),source:'TomTom',trafficStatus:'live'};
  }
  return {valid:valid,distance:distance,cumulative:cumulative,routeId:routeId,anchors:anchors,navigation:navigation,gpx:gpx,lineDistance:lineDistance,toll:toll,traffic:traffic,congestionCost:congestionCost,energyCost:energyCost,rank:rank,tomtomRoute:tomtomRoute,tomtomRoutes:tomtomRoutes};
});
