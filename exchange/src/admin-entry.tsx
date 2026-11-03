import React from 'react';
import {createRoot} from 'react-dom/client';
import AdminLogin from './app/admin/page';
import AdminDashboard from './app/admin/dashboard/page';
const host=document.getElementById('plasmax-admin');
if(host){const shadow=host.attachShadow({mode:'open'}),link=document.createElement('link');link.rel='stylesheet';link.href='/exchange-sections.css';shadow.append(link);const mount=document.createElement('div');mount.className='dark';shadow.append(mount);createRoot(mount).render(location.pathname.replace(/\/+$/,'').endsWith('/dashboard')?<AdminDashboard/>:<AdminLogin/>);}
