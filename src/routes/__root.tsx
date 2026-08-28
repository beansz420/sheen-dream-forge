import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { captureTrackingFromUrl } from "@/lib/tracking";
import { applyStoredMetaAdvancedMatching, ensureMetaAdvancedMatching, ensureMetaBrowserIds } from "@/lib/meta-pixel";
import { fpAttrs, fpBuildId, fpClass } from "@/lib/daily-fingerprint";

import appCss from "../styles.css?url";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Clareador" },
      { name: "description", content: "Bright Skin Journey is an e-commerce application for purchasing skincare products." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Clareador" },
      { property: "og:description", content: "Bright Skin Journey is an e-commerce application for purchasing skincare products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Clareador" },
      { name: "twitter:description", content: "Bright Skin Journey is an e-commerce application for purchasing skincare products." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fa76ffb2-0035-447c-b0f0-c66290a454b2/id-preview-c116f89e--102004a2-773f-4476-8caa-d49c27368f3d.lovable.app-1779406754081.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fa76ffb2-0035-447c-b0f0-c66290a454b2/id-preview-c116f89e--102004a2-773f-4476-8caa-d49c27368f3d.lovable.app-1779406754081.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
(function(){var PID='3903982886564566';
function gc(n){var m=document.cookie.match('(^|; )'+n+'=([^;]*)');return m&&m[2]}
function sc(n,v){try{document.cookie=n+'='+v+'; path=/; max-age=7776000; SameSite=Lax'}catch(e){}}
function ls(k){try{return localStorage.getItem(k)}catch(e){return null}}
function ss(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var fbclid=null;try{fbclid=new URLSearchParams(location.search).get('fbclid')}catch(e){}
var fbc=gc('_fbc')||ls('meta_fbc_v1');
if(fbclid){fbc='fb.1.'+Date.now()+'.'+fbclid}
if(fbc){sc('_fbc',fbc);ss('meta_fbc_v1',fbc)}
var fbp=gc('_fbp')||ls('meta_fbp_v1');
if(!fbp){fbp='fb.1.'+Date.now()+'.'+Math.floor(Math.random()*1e10)}
sc('_fbp',fbp);ss('meta_fbp_v1',fbp);
var ext=ls('meta_anon_external_id_v1');
if(!ext){ext=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'anon_'+Math.random().toString(36).slice(2)+Date.now().toString(36);ss('meta_anon_external_id_v1',ext)}
var stored={};try{stored=JSON.parse(ls('meta_advanced_matching_v1')||'{}')}catch(e){}
function go(am){fbq('init',PID,am);fbq('track','PageView',{},{eventID:'pv_'+Date.now().toString(36)+Math.random().toString(36).slice(2)})}
function h(s){if(!s||!window.crypto||!crypto.subtle)return Promise.resolve(null);return crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s).trim().toLowerCase())).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')}).catch(function(){return null})}
try{Promise.all([h(ext),h('br')]).then(function(r){var am={};for(var k in stored)am[k]=stored[k];if(r[0]&&!am.external_id)am.external_id=r[0];if(r[1])am.country=r[1];ss('meta_advanced_matching_v1',JSON.stringify(am));go(am)},function(){go(stored)})}catch(e){go(stored)}
})();`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const buildId = fpBuildId();
  return (
    <html lang="en" className={fpClass("html")} {...fpAttrs("html")}>
      <head>
        <HeadContent />
        <meta name="x-build" content={buildId} />
      </head>
      <body className={fpClass("body")} {...fpAttrs("body")}>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=3903982886564566&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <div hidden aria-hidden="true" data-b={buildId} />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    captureTrackingFromUrl();
    ensureMetaBrowserIds();
    applyStoredMetaAdvancedMatching();
    void ensureMetaAdvancedMatching();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

