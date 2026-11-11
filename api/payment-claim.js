import { originMatches } from '../lib/registration-validation.js';
import { gateway, getClientIp } from '../lib/gateway.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
 if(!originMatches(req.headers.origin,req.headers['x-forwarded-host']||req.headers.host))return res.status(403).json({error:'Request origin not allowed.'});
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({error:'Expected JSON.'});
 let b;try{b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>4096)throw Error();}catch{return res.status(400).json({error:'Invalid request.'});}
 const ip=getClientIp(req);if(!ip)return res.status(503).json({error:'Security verification unavailable.'});
 const r=await gateway('claim',{reference:b.reference,accessToken:b.accessToken,accountHolderName:b.accountHolderName,bankName:b.bankName},ip);
 if(r.status===200&&r.data.success)return res.status(200).json({success:true,status:'pending'});
 const messages={NOT_FOUND:'Booking details could not be verified.',INVALID:'Check the account holder name and bank name.',PENDING_EXISTS:'A payment claim is already awaiting verification.',ALREADY_APPROVED:'This booking has already been approved.',CLOSED:'This booking cannot accept another claim.'};
 return res.status([400,409,429].includes(r.status)?r.status:503).json({error:messages[r.data.code]||'Payment claim could not be submitted.'});
}
