import React from 'react';
import {createRoot} from 'react-dom/client';
import {ExchangeWidget} from './components/exchange-widget';
import {Header} from './components/header';
import {HowItWorksSection} from './components/how-it-works-section';
import {VideoSection} from './components/video-section';
import {FeaturesSection} from './components/features-section';
import {FAQSection} from './components/faq-section';
import {ContactSection} from './components/contact-section';
import {CTASection} from './components/cta-section';
import {Footer} from './components/footer';
function ExchangePage(){return <div className="dark landing-shell exchange-polished bg-background text-foreground"><Header/><main><section id="exchange" className="exchange-hero"><div className="exchange-intro"><h1>Exchange crypto</h1><p>Choose a currency pair, check the estimate, and enter the wallet that will receive your crypto.</p><div className="exchange-help-links"><a href="#how-it-works">How it works</a><a href="#video-section">Watch the guide</a></div></div><div className="exchange-widget-area"><ExchangeWidget/></div></section><HowItWorksSection/><VideoSection/><FeaturesSection/><FAQSection/><aside className="exchange-tv-promo"><div><h2>Live TV is here, too.</h2><p>Explore channels and playlists in the PlasmaX player.</p></div><a className="exchange-link exchange-link-outline" href="/iptv/">Explore IPTV</a></aside><ContactSection/><CTASection/></main><Footer/></div>}

const host=document.getElementById('plasmax-exchange-page');if(host){const shadow=host.attachShadow({mode:'open'});const css=document.createElement('link');css.rel='stylesheet';css.href='/exchange-sections.css';shadow.append(css);const mount=document.createElement('div');shadow.append(mount);shadow.addEventListener('click',e=>{const a=e.composedPath().find(x=>x instanceof HTMLAnchorElement) as HTMLAnchorElement|undefined;const href=a?.getAttribute('href');if(href?.startsWith('#')){const target=shadow.getElementById(href.slice(1));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}});createRoot(mount).render(<ExchangePage/>);if(location.hash)setTimeout(()=>shadow.getElementById(location.hash.slice(1))?.scrollIntoView(),300);}
