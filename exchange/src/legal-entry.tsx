import React from 'react';
import {createRoot} from 'react-dom/client';
import Privacy from './app/privacy-policy/page';
import Terms from './app/terms-and-conditions/page';
import Risk from './app/risk-disclosure/page';
import AML from './app/aml-kyc-policy/page';
import Disclaimer from './app/disclaimer/page';
const pages:Record<string,React.ComponentType>={'privacy-policy':Privacy,'terms-and-conditions':Terms,'risk-disclosure':Risk,'aml-kyc-policy':AML,'disclaimer':Disclaimer};
const host=document.getElementById('plasmax-exchange-legal'),Page=pages[location.pathname.replace(/\/+$/,'').split('/').pop()||''];
if(host&&Page){const shadow=host.attachShadow({mode:'open'}),link=document.createElement('link');link.rel='stylesheet';link.href='/exchange-sections.css';shadow.append(link);const mount=document.createElement('div');mount.className='dark';shadow.append(mount);createRoot(mount).render(<Page/>);}
