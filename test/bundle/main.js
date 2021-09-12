(()=>{"use strict";var t={69:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.randomFillSync=void 0,e.randomFillSync=void 0},590:(t,e,n)=>{e.A=void 0;const o=n(69);e.A=()=>{const[t,e]=f();let n="00000000"+(t/1e3).toString(16);n+=/\./.test(n)?"00":".000";const o=/([0-9a-f]{8})([0-9a-f])\.([0-9a-f]{3})/.exec(n);if(null==o)throw new Error(`assertion error: ${n} !~ xxxxxxxxx.xxx`);return o[1]+"-"+o[2]+o[3]+"-"+r(28672|e,4)+"-"+r(32768|a(14),4)+"-"+r(a(48),12)};const r=(t,e)=>("0000000000000"+t.toString(16)).slice(-e),a="undefined"!=typeof window&&window.crypto?t=>{const[e,n]=window.crypto.getRandomValues(new Uint32Array(2));return t>32?e%Math.pow(2,t-32)*Math.pow(2,32)+n:n%Math.pow(2,t)}:o.randomFillSync?t=>{const[e,n]=(0,o.randomFillSync)(new Uint32Array(2));return t>32?e%Math.pow(2,t-32)*Math.pow(2,32)+n:n%Math.pow(2,t)}:t=>t>30?Math.floor(Math.random()*(1<<t-30))*(1<<30)+Math.floor(Math.random()*(1<<30)):Math.floor(Math.random()*(1<<t));let i=0,s=0,c=11;const f=()=>{let t=Date.now();if(i<t)i=t,s=a(c);else if(s++,s>4095){c>0&&c--;for(let e=0;i>=t&&e<1e6;e++)t=Date.now();i=t,s=a(c)}return[i,s]}}},e={};function n(o){var r=e[o];if(void 0!==r)return r.exports;var a=e[o]={exports:{}};return t[o](a,a.exports,n),a.exports}(()=>{var t=n(590);const e=(t,e="")=>{if(!t)throw new Error("Assertion failed"+(e?": "+e:""))};describe("uuidv7()",(function(){const n=[];for(let e=0;e<1e5;e++)n[e]=(0,t.A)();it("returns 8-4-4-4-12 hexadecimal string representation",(function(){n.forEach((t=>e("string"==typeof t)));const t=/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;n.forEach((n=>e(t.test(n))))})),it("generates unique identifier",(function(){e(new Set(n).size===n.length)})),it("generates sortable string representation by creation time",(function(){const t=n.slice().sort();for(let o=0;o<n.length;o++)e(n[o]===t[o])})),it("encodes up-to-date unix timestamp",(function(){const n=/^([0-9a-f]{8})-([0-9a-f])([0-9a-f]{3})-7([0-9a-f]{3})/;for(let o=0;o<1e4;o++){const o=Date.now()/1e3,r=n.exec((0,t.A)()),a=parseInt(r[1]+r[2],16),i=parseInt(r[3]+r[4],16)/(1<<24);e(Math.abs(o-(a+i))<.01)}})),it("encodes sortable timestamp",(function(){const t=/^([0-9a-f]{8})-([0-9a-f])([0-9a-f]{3})-7([0-9a-f]{3})/,o=t.exec(n[0]);let r=parseInt(o[1]+o[2],16),a=parseInt(o[3]+o[4],16);for(let o=1;o<n.length;o++){const i=t.exec(n[o]),s=parseInt(i[1]+i[2],16),c=parseInt(i[3]+i[4],16);e(r<s||r===s&&a<c),r=s,a=c}})),it("sets constant bits and random bits properly",(function(){const t=new Array(128).fill(0);for(const e of n){const n=e.replaceAll("-","");for(let e=0;e<8;e++){const o=parseInt(n.substring(4*e,4*e+4),16);for(let n=0;n<16;n++)o&32768>>>n&&t[16*e+n]++}}const o=n.length;e(0===t[48],"version bit 48"),e(t[49]===o,"version bit 49"),e(t[50]===o,"version bit 50"),e(t[51]===o,"version bit 51"),e(t[64]===o,"variant bit 64"),e(0===t[65],"variant bit 65");const r=4.417173*Math.sqrt(.25/o);for(let n=66;n<128;n++){const a=t[n]/o;e(Math.abs(a-.5)<r,`random bit ${n}: ${a}`)}}))}))})()})();