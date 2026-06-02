 "use client";

 import { useEffect, useState } from "react";

 export default function SiteLoader() {
   const [hideText, setHideText] = useState(false);
   const [fly, setFly] = useState(false);
   const [fadeBg, setFadeBg] = useState(false);
   const [done, setDone] = useState(false);
   const [target, setTarget] = useState({
     left: 24,
     top: 18,
     size: 28,
   });

   useEffect(() => {
     const logo = document.getElementById("site-logo-icon");

     if (logo) {
       const rect = logo.getBoundingClientRect();

       setTarget({
         left: rect.left,
         top: rect.top,
         size: rect.width,
       });
     }

     const hideTextTimer = setTimeout(() => {
       setHideText(true);
     }, 900);

     const flyTimer = setTimeout(() => {
       setFly(true);
     }, 1200);

     const fadeTimer = setTimeout(() => {
       setFadeBg(true);
     }, 2350);

     const doneTimer = setTimeout(() => {
       setDone(true);
     }, 2900);

     return () => {
       clearTimeout(hideTextTimer);
       clearTimeout(flyTimer);
       clearTimeout(fadeTimer);
       clearTimeout(doneTimer);
     };
   }, []);

   if (done) return null;

   return (
     <div
       className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-500 ${
         fadeBg ? "pointer-events-none opacity-0" : "opacity-100"
       }`}
     >
       <div className="absolute inset-0 bg-[#fff7fb]" />

       <div className="pointer-events-none absolute inset-0">
         <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/35 blur-3xl" />
         <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-pink-300/25 blur-3xl" />
         <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />
       </div>

       <div
         className="fixed transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
         style={
           fly
             ? {
                 left: target.left,
                 top: target.top,
                 width: target.size,
                 height: target.size,
                 transform: "translate(0, 0)",
               }
             : {
                 left: "50%",
                 top: "50%",
                 width: 112,
                 height: 112,
                 transform: "translate(-50%, -50%)",
               }
         }
       >
         <div className="relative flex h-full w-full items-center justify-center">
           <div
             className={`absolute h-full w-full rounded-full border border-purple-300/40 transition-opacity duration-500 ${
               fly ? "opacity-0" : "opacity-100"
             }`}
           />

           <div
             className={`absolute h-full w-full animate-spin rounded-full border-2 border-transparent border-r-pink-300 border-t-purple-300 transition-opacity duration-500 ${
               fly ? "opacity-0" : "opacity-100"
             }`}
           />

           <div
             className={`absolute h-20 w-20 rounded-full bg-purple-300/30 blur-xl transition-opacity duration-500 ${
               fly ? "opacity-0" : "opacity-100"
             }`}
           />

           <img
             src="/loader-icon.png"
             alt="深夜不關燈"
             className={`relative h-full w-full object-cover shadow-[0_0_35px_rgba(192,132,252,0.5)] transition-all duration-1000 ${
               fly ? "rounded-lg" : "rounded-2xl"
             }`}
           />
         </div>

         <div
           className={`absolute left-1/2 top-full mt-8 w-[320px] -translate-x-1/2 text-center transition-all duration-500 ${
             hideText ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100"
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