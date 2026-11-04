import React from 'react';
import {createRoot} from 'react-dom/client';
import {Header} from './components/header';
import {HowItWorksSection} from './components/how-it-works-section';
import {VideoSection} from './components/video-section';
import {FeaturesSection} from './components/features-section';
import {FAQSection} from './components/faq-section';
import {ContactSection} from './components/contact-section';
import {CTASection} from './components/cta-section';
import {Footer} from './components/footer';
function ExchangePage(){return <div className="dark landing-shell bg-background text-foreground"><Header/><main><section className="container mx-auto px-4 pt-32 pb-12"><h1 className="text-4xl md:text-5xl font-bold mb-6">PlasmaX Exchange</h1><p className="text-lg text-muted-foreground mb-8">Learn how to swap crypto, explore the service, and get support.</p><a className="exchange-link" href="/#exchange">Open exchange widget</a></section><HowItWorksSection/><VideoSection/><FeaturesSection/><FAQSection/><ContactSection/><CTASection/></main><Footer/></div>}
const host=document.getElementById('plasmax-exchange-page');if(host){const shadow=host.attachShadow({mode:'open'});const css=document.createElement('link');css.rel='stylesheet';css.href='/exchange-sections.css';shadow.append(css);const mount=document.createElement('div');shadow.append(mount);shadow.addEventListener('click',e=>{const a=e.composedPath().find(x=>x instanceof HTMLAnchorElement) as HTMLAnchorElement|undefined;const href=a?.getAttribute('href');if(href?.startsWith('#')){const target=shadow.getElementById(href.slice(1));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}});createRoot(mount).render(<ExchangePage/>);if(location.hash)setTimeout(()=>shadow.getElementById(location.hash.slice(1))?.scrollIntoView(),300);}
