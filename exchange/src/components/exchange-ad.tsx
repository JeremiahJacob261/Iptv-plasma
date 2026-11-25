"use client";

import { useEffect, useRef } from "react";

export function ExchangeAd() {
    const frameRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;
        const mobile = window.matchMedia("(max-width: 700px)");
        const loadAd = () => {
            const unitId = mobile.matches ? "2463138" : "2463134";
            if (frame.dataset.aa === unitId) return;
            frame.dataset.aa = unitId;
            frame.src = `https://acceptable.a-ads.com/${unitId}/?size=Adaptive`;
        };

        loadAd();
        mobile.addEventListener?.("change", loadAd);
        return () => mobile.removeEventListener?.("change", loadAd);
    }, []);

    return (
        <aside className="exchange-ad" aria-label="Advertisement">
            <span className="exchange-ad-label">Advertisement</span>
            <iframe
                ref={frameRef}
                title="Advertisement"
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
            />
        </aside>
    );
}
