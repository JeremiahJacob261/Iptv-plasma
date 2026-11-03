export function useRouter(){return {push:(url:string)=>{location.href=url},replace:(url:string)=>location.replace(url),back:()=>history.back(),refresh:()=>location.reload()};}
