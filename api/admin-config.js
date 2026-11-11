export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
 return res.status(200).json({
  supabaseUrl:process.env.SUPABASE_URL || null,
  publishableKey:process.env.SUPABASE_PUBLISHABLE_KEY || null,
 });
}
