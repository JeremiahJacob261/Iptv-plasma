import React from 'react';
export default function Image({src,alt,fill,priority,unoptimized,...props}:any){return <img src={typeof src==='string'?src:src.src} alt={alt||''} {...props} />}
