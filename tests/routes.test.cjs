const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/route-core.js');
const coords=[[10,45],[10.1,45.02],[10.2,45.03],[10.3,45.06],[10.4,45.1],[10.5,45.11],[10.6,45.12]];
const base={km:100,sec:3600,coords,tollKm:0};
const profile={base:6,adjusted:6,mix:{urban:.2,extra:.4,highway:.4},source:'estimated'};
const params={mode:'benzina',price:2};
const live=(delaySec)=>({status:'live',delaySec,fetchedAt:Date.now()});
const cost=(route,p=params)=>core.energyCost(route,p,profile,{...profile,base:20,adjusted:20});
test('same endpoints, different roads: different Google pass-throughs and route IDs',()=>{
 const other={...base,coords:coords.map((p,i)=>[p[0],p[1]+(i>0&&i<6?.2:0)])};
 const a={lat:45,lon:10},b={lat:45.12,lon:10.6};
 const one=core.navigation(base,a,b),two=core.navigation(other,a,b);
 assert.notEqual(one.google,two.google);assert.notEqual(core.routeId(coords),core.routeId(other.coords));
 assert.equal(one.waze,two.waze);assert.equal(one.apple,two.apple);
 const waypoints=new URL(one.google).searchParams.get('waypoints').split('|');assert.ok(waypoints.length<=3);
 for(const point of core.anchors(coords,3))assert.ok(coords.includes(point));
});
test('GPX preserves every original point, without sampling',()=>{
 const gpx=core.gpx(base);assert.equal((gpx.match(/<trkpt /g)||[]).length,coords.length);
 assert.match(gpx,/lat="45.12" lon="10.6"/);assert.throws(()=>core.gpx({coords:[]}));
 assert.equal(core.navigation({coords:[]},{},{}),null);
});
test('traffic affects fuel cost but never adds the delay to ETA twice',()=>{
 const route={...base,sec:4800,traffic:live(1200)},normal=cost(base),jam=cost(route);
 assert.equal(route.sec,4800);assert.ok(Math.abs(jam.total-normal.total-(1200/3600*.8*2))<1e-9);
 assert.ok(jam.consumption>normal.consumption);
});
test('congestion can change the cheapest eligible route',()=>{
 const fast={...base,sec:3600,traffic:live(2400)},slow={...base,km:104,sec:3900,traffic:live(0)};
 const ranking=core.rank([{route:fast,cost:cost(fast)},{route:slow,cost:cost(slow)}],10);
 assert.equal(ranking.best.route,slow);assert.ok(ranking.best.save>0);
 const limited=core.rank([{route:fast,cost:cost(fast)},{route:slow,cost:cost(slow)}],4);
 assert.equal(limited.best.route,fast);
});
test('missing tolls never masquerade as zero cost or produce a savings claim',()=>{
 const unknown={...base,tollKm:null},data=[{route:unknown,cost:cost(unknown)},{route:base,cost:cost(base)}];
 assert.equal(core.rank(data,10).complete,false);assert.equal(data[0].save,null);
 unknown.tollOverride=0;data[0].cost=cost(unknown);assert.equal(core.rank(data,10).complete,true);
 assert.equal(core.toll({...base,tollKm:20}).amount,1.56);
});
test('EV uses auxiliaries; PHEV never exceeds available battery even in a long queue',()=>{
 const route={...base,traffic:live(3600)};
 const ev=cost(route,{mode:'elettrica',price:.3});assert.equal(ev.energyUse,7);
 const phev=cost(route,{mode:'plugin',price:2,evPrice:.3,capacity:10,soc:80});
 assert.ok(phev.electricUse<=7+1e-9);assert.ok(phev.electricKm<35);assert.ok(phev.trafficExtraCost>0);
 const empty=cost(route,{mode:'plugin',price:2,evPrice:.3,capacity:10,soc:0});
 assert.equal(empty.electricKm,0);assert.equal(empty.electricUse,0);assert.ok(empty.fuelUse>6);
});
test('old traffic suspends recommendation without silently removing congestion cost',()=>{
 const route={...base,traffic:live(600)},fresh=cost(route);
 route.traffic.fetchedAt-=301000;assert.equal(core.traffic(route).status,'stale');
 assert.equal(cost(route).total,fresh.total);assert.equal(core.rank([{route,cost:cost(route)}],10).complete,false);
 assert.equal(core.traffic({...base,traffic:live(NaN)}).status,'unavailable');
});
test('real recommendations require live traffic on every alternative',()=>{
 const unavailable={...base},withTraffic={...base,traffic:live(0)};
 assert.equal(core.rank([{route:unavailable,cost:cost(unavailable)}],10,{requireLiveTraffic:true}).complete,false);
 assert.equal(core.rank([{route:withTraffic,cost:cost(withTraffic)}],10,{requireLiveTraffic:true}).complete,true);
 assert.equal(core.rank([{route:unavailable,cost:cost(unavailable)}],10).complete,true);
});
function raw(sections=[]){return {summary:{lengthInMeters:50000,travelTimeInSeconds:2400,noTrafficTravelTimeInSeconds:1800},legs:[{points:coords.map(p=>({longitude:p[0],latitude:p[1]}))}],sections};}
test('TomTom geometry/time are from one response; toll sections are unioned and foreign rates unknown',()=>{
 const sections=[{sectionType:'COUNTRY',countryCode:'ITA'},{sectionType:'TOLL_ROAD',startPointIndex:1,endPointIndex:4},{sectionType:'TOLL_ROAD',startPointIndex:2,endPointIndex:4}];
 const r=core.tomtomRoute(raw(sections),Date.now());assert.equal(r.sec,2400);assert.equal(r.traffic.delaySec,600);assert.equal(r.freeFlowSec,1800);
 const ds=core.cumulative(coords);assert.ok(Math.abs(r.tollKm-(ds[4]-ds[1]))<1e-9);
 sections[0].countryCode='FRA';assert.equal(core.tomtomRoute(raw(sections),Date.now()).tollKm,null);
 assert.equal(core.tomtomRoute(raw([{sectionType:'FERRY'}]),Date.now()).tollKm,null);
 assert.equal(core.tomtomRoute(raw([{sectionType:'TOLL_ROAD',startPointIndex:-1,endPointIndex:4}]),Date.now()).tollKm,null);
 assert.throws(()=>core.tomtomRoute({summary:{},legs:[]},Date.now()));
});
test('toll-free TomTom comparison is optional and uses the same live provider',async()=>{
 const urls=[];let fail=false;
 const fetcher=async url=>{urls.push(new URL(url));return {ok:!(fail&&urls.length===2),json:async()=>({routes:[raw()]})};};
 const a={lat:45,lon:10},b={lat:45,lon:11};
 const rs=await core.tomtomRoutes(a,b,'https://proxy.example/api/tomtom',fetcher);assert.equal(rs.source,'TomTom');assert.equal(rs.smart,undefined);
 assert.equal(urls[0].searchParams.get('from'),'45,10');assert.equal(urls[0].searchParams.get('to'),'45,11');
 assert.equal(urls.length,1);assert.equal(urls[0].searchParams.has('avoid'),false);assert.equal(urls[0].origin,'https://proxy.example');
 urls.length=0;await core.tomtomRoutes(a,b,'https://proxy.example/api/tomtom',fetcher,{includeNoToll:true});
 assert.equal(urls.length,2);assert.equal(urls[1].searchParams.get('avoid'),'tollRoads');
 urls.length=0;fail=true;await assert.rejects(core.tomtomRoutes(a,b,'https://proxy.example/api/tomtom',fetcher,{includeNoToll:true}));
});
