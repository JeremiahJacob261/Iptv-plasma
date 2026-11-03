import React,{Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import StatusPage from './app/status/[id]/page';
const host=document.getElementById('plasmax-exchange-status');
if(host){const shadow=host.attachShadow({mode:'open'}),style=document.createElement('link');style.rel='stylesheet';style.href='/exchange-sections.css';shadow.append(style);const mount=document.createElement('div');mount.className='dark';shadow.append(mount);const id=decodeURIComponent(location.pathname.replace(/\/+$/,'').split('/').pop()||'');const params=Promise.resolve({id});createRoot(mount).render(<Suspense fallback={<p>Loading exchange status…</p>}><StatusPage params={params}/></Suspense>);}
