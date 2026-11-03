import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Play } from 'lucide-react';
import { ExchangeWidget } from './components/exchange-widget';
import { HowItWorksSection } from './components/how-it-works-section';
import { VideoSection } from './components/video-section';
import { FeaturesSection } from './components/features-section';
import { FAQSection } from './components/faq-section';
import { ContactSection } from './components/contact-section';
import { CTASection } from './components/cta-section';
import { Footer } from './components/footer';
import { VisitTracker } from './components/visit-tracker';
const SpeedtestSection = lazy(() => import('./components/speedtest-section').then(x => ({default:x.SpeedtestSection})));
function DeferredSpeedtest(){const ref=useRef<HTMLDivElement>(null);const [ready,setReady]=useState(false);useEffect(()=>{if(!ref.current)return;if(!('IntersectionObserver' in window)){setReady(true);return;}const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();setReady(true)}},{rootMargin:'300px'});io.observe(ref.current);return()=>io.disconnect()},[]);return ready?<Suspense fallback={<div style={{minHeight:300}}/>}><SpeedtestSection/></Suspense>:<div ref={ref} id="speedtest" style={{minHeight:300}}/>}
function Sections(){return <div className="dark landing-shell bg-background text-foreground"><VisitTracker/>
 <section id="exchange" className="py-20 md:py-32 bg-background"><div className="container mx-auto px-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
 <div><h2 className="text-4xl md:text-5xl font-bold mb-6">PlasmaX <span className="gradient-text">Exchange</span></h2><p className="text-lg text-muted-foreground mb-8">Exchange crypto with our non-custodial swap service.</p><div className="flex flex-wrap gap-4"><a className="exchange-link" href="#how-it-works">How it works <ArrowRight size={18}/></a><a className="exchange-link exchange-link-outline" href="#video-section">Watch video <Play size={18}/></a></div></div><ExchangeWidget />
 </div></div></section>
 <HowItWorksSection/><VideoSection/><FeaturesSection/><FAQSection/><ContactSection/><CTASection/><Footer/>
 </div>}
const host=document.getElementById('plasmax-exchange-sections');if(host){const shadow=host.attachShadow({mode:'open'});const link=document.createElement('link');link.rel='stylesheet';link.href='/exchange-sections.css';shadow.append(link);const mount=document.createElement('div');shadow.append(mount);shadow.addEventListener('click',e=>{const a=(e.composedPath().find(x=>x instanceof HTMLAnchorElement) as HTMLAnchorElement|undefined);const href=a?.getAttribute('href');if(!href?.startsWith('#'))return;const target=shadow.getElementById(href.slice(1));if(target){e.preventDefault();target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});createRoot(mount).render(<Sections/>);if(location.hash){setTimeout(()=>{const target=shadow.getElementById(decodeURIComponent(location.hash.slice(1)));target?.scrollIntoView();},250);}}
