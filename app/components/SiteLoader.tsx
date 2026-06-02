 "use client";

 import { useEffect, useState } from "react";

 export default function SiteLoader() {
   const [flyToLogo, setFlyToLogo] = useState(false);
   const [hideText, setHideText] = useState(false);
   const [fadeOut, setFadeOut] = useState(false);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const hideTextTimer = setTimeout(() => {
       setHideText(true);
     }, 900);

     const flyTimer = setTimeout(() => {
       setFlyToLogo(true);
     }, 1100);

     const fadeTimer = setTimeout(() => {
       setFadeOut(true);
     }, 2100);

     const endTimer = setTimeout(() => {
       setLoading(false);
     }, 2600);

     return () => {
       clearTimeout(hideTextTimer);
       clearTimeout(flyTimer);
       clearTimeout(fadeTimer);
       clearTimeout(endTimer);
     };
   }, []);

   if (!loading) return null;

   return (
     <div
       className={`fixed inset-0 z-[9999] overflow-hidden bg-[#fff7fb] transition-opacity duration-500 ${
         fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
       }`}
     >
       <div className="pointer-events-none absolute inset-0">
         <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/35 blur-3xl" />
         <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-pink-300/25 blur-3xl" />
         <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />
       </div>

       <div
         className={`fixed flex flex-col items-center text-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
           flyToLogo
             ? "left-[50px] top-[30px] translate-x-0 translate-y-0 scale-[0.25]"
             : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100"
         }`}
       >
         <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
           <div
             className={`absolute h-28 w-28 rounded-full border border-purple-300/40 transition-opacity duration-500 ${
               flyToLogo ? "opacity-0" : "opacity-100"
             }`}
           />

           <div
             className={`absolute h-28 w-28 animate-spin rounded-full border-2 border-transparent border-r-pink-300 border-t-purple-300 transition-opacity duration-500 ${
               flyToLogo ? "opacity-0" : "opacity-100"
             }`}
           />

           <div className="absolute h-20 w-20 rounded-full bg-purple-300/30 blur-xl" />

           <img
             src="/loader-icon.png"
             alt="深夜不關燈"
             className="relative h-16 w-16 rounded-2xl object-cover shadow-[0_0_35px_rgba(192,132,252,0.5)]"
           />
         </div>

         <div
           className={`transition-all duration-500 ${
             hideText ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
           }`}
         >
           <p className="mb-3 text-sm tracking-[0.35em] text-purple-400">
             WE ARE STILL HERE
           </p>

           <h1 className="text-3xl font-black tracking-tight text-[#18111f] md:text-5xl">
             深夜不關燈
           </h1>

           <p className="mt-4 text-sm text-zinc-500">
             正在為你點亮今晚的微光...
           </p>

           <div className="mt-8 flex justify-center gap-2">
             <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]" />
             <span className="h-2 w-2 animate-bounce rounded-full bg-pink-300 [animation-delay:-0.15s]" />
             <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300" />
           </div>
         </div>
       </div>
     </div>
   );
 }