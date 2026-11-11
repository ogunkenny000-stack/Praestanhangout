import { originMatches } from '../lib/registration-validation.js';
import { gateway } from '../lib/gateway.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
 if(!originMatches(req.headers.origin,req.headers['x-forwarded-host']||req.headers.host))return res.status(403).json({error:'Request origin not allowed.'});
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({error:'Expected JSON.'});
 let b;try{b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>4096)throw Error();}catch{return res.status(400).json({error:'Invalid request.'});}
 const r=await gateway('ticket',{reference:b.reference,accessToken:b.accessToken});
 if(r.status===200&&r.data.success)return res.status(200).json(r.data);
 return res.status(r.status===404?404:503).json({error:'Your private ticket status could not be loaded.'});
}
