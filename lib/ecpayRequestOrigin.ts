// Railway's internal request URL can differ from the public merchant domain.
// Trust only configured/owned payment origins, never forwarded Host headers.
export function isMerchantPaymentOrigin(origin:string|null, configuredBase:string) {
  if(!origin)return false;
  try {
    const allowed=new Set(['https://wearestilllhere.com','https://www.wearestilllhere.com']);
    const configured=new URL(configuredBase);
    if(configured.protocol==='https:')allowed.add(configured.origin);
    return allowed.has(origin);
  }catch{return false;}
}
