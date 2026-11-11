import { originMatches } from '../lib/registration-validation.js';
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!originMatches(req.headers.origin,req.headers['x-forwarded-host']||req.headers.host))return res.status(403).json({error:'Origin not allowed'});
 if(!(req.headers['content-type']||'').includes('application/json'))return res.status(415).json({error:'Expected JSON'});
 const jwt=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
 if(jwt.length<60 || jwt.length>2900)return res.status(401).json({error:'Sign in required'});
 const url=process.env.SUPABASE_URL;
 const anon=process.env.SUPABASE_ANON_KEY;
 if(!url||!anon)return res.status(503).json({error:'Not configured'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||JSON.stringify(body).length>4096)return res.status(400).json({error:'Invalid request'});
  const upstream=await fetch(`${url.replace(/\/$/,'')}/functions/v1/praestans-admin`,{
   method:'POST',headers:{'apikey':anon,'Authorization':`Bearer ${jwt}`,'Content-Type':'application/json'},
   body:JSON.stringify(body),signal:AbortSignal.timeout(8000)
  });
  const data=await upstream.json().catch(()=>({error:'Service unavailable'}));
  return res.status(upstream.status).json(data);
 }catch{return res.status(503).json({error:'Review service unavailable'});}
}
