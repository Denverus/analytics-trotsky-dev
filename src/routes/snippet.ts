import { FastifyPluginAsync } from 'fastify'

// Minimal analytics snippet — reads data-api-key from its own script tag,
// auto-tracks page_view, exposes window.pz.track(eventName, payload?)
const SNIPPET = `(function(){
  var s=document.currentScript;
  var key=s&&s.getAttribute('data-api-key');
  var endpoint=(s&&s.getAttribute('data-endpoint'))||'';
  if(!key){console.warn('[pz] data-api-key missing');return;}
  var sid=sessionStorage.getItem('_pz_sid');
  if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('_pz_sid',sid);}
  var pid=(s&&s.getAttribute('data-project-id'))||window.location.hostname;
  function send(name,payload){
    var ev={projectId:pid,eventName:name,timestamp:new Date().toISOString(),sessionId:sid};
    if(payload)ev.payload=payload;
    fetch(endpoint+'/api/events',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Api-Key':key},
      body:JSON.stringify(ev),
      keepalive:true
    }).catch(function(){});
  }
  send('page_view',{url:window.location.href,referrer:document.referrer||undefined});
  window.pz=window.pz||{};
  window.pz.track=send;
})();`

const snippetRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/snippet.js', async (_request, reply) => {
    reply.header('Content-Type', 'application/javascript; charset=utf-8')
    reply.header('Cache-Control', 'public, max-age=3600')
    return reply.send(SNIPPET)
  })
}

export default snippetRoute
