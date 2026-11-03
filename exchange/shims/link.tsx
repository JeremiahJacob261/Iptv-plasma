import React from 'react';
export default function Link({href,children,onClick,...props}:any){
 return <a href={typeof href==='string'?href:'#'} {...props} onClick={(event)=>{onClick?.(event);if(event.defaultPrevented||typeof href!=='string'||!href.startsWith('#'))return;const target=(event.currentTarget.getRootNode() as ShadowRoot).getElementById?.(href.slice(1));if(target){event.preventDefault();target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}}>{children}</a>;
}
