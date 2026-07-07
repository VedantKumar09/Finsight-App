import path from 'path';
import { fileURLToPath } from 'url';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  if (h.length === 6) {
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
  return { r: 0, g: 0, b: 0 };
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
  const L1 = luminance(hex1);
  const L2 = luminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToHsl(hex){
  const {r,g,b} = hexToRgb(hex);
  const R=r/255,G=g/255,B=b/255;
  const max=Math.max(R,G,B), min=Math.min(R,G,B);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case R: h=(G-B)/d + (G<B?6:0); break; case G: h=(B-R)/d + 2; break; default: h=(R-G)/d + 4;}
    h/=6;
  }
  return {h:h*360,s:s,l:l};
}

function hslToHex(h,s,l){
  h = h/360;
  let r,g,b;
  if(s===0){r=g=b=l;}else{
    const hue2rgb=(p,q,t)=>{if(t<0) t+=1; if(t>1) t-=1; if(t<1/6) return p+(q-p)*6*t; if(t<1/2) return q; if(t<2/3) return p+(q-p)*(2/3-t)*6; return p};
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex=(x)=>{const v=Math.round(x*255); return (v<16?"0":"") + v.toString(16)};
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const themePath = path.resolve(__dirname, '..', 'src', 'theme.js');
  const theme = await import('file://' + themePath);
  const tokens = theme.tokens;

  const bgMain = tokens.background.main;
  const pairs = [];

  function addPair(name, fg, bg){ pairs.push({name, fg, bg}); }

  addPair('Body text on background', tokens.grey[100], bgMain);
  addPair('Muted text on background', tokens.grey[500], bgMain);
  addPair('Primary (500) on background', tokens.primary[500], bgMain);
  addPair('Primary (400) on background', tokens.primary[400], bgMain);
  addPair('Tertiary (500) on background', tokens.tertiary[500], bgMain);
  addPair('Secondary (500) on background', tokens.secondary[500], bgMain);
  addPair('Grey 600 on background', tokens.grey[600], bgMain);
  const chipOverlay = blendHexOver('#FFFFFF', 0.03, bgMain);
  addPair('Chip text (grey100) on chip overlay', tokens.grey[100], chipOverlay);

  console.log('\nContrast audit report (WCAG): threshold small text >=4.5, large text >=3.0');
  const results = [];
  for(const p of pairs){
    const ratio = +contrastRatio(p.fg, p.bg).toFixed(2);
    const passSmall = ratio >= 4.5;
    const passLarge = ratio >= 3.0;
    results.push({pair:p.name, fg:p.fg, bg:p.bg, ratio, passSmall, passLarge});
  }

  for(const r of results){
    console.log(`${r.pair}: ${r.fg} on ${r.bg} -> contrast ${r.ratio} :1` + (r.passSmall? ' ✅':' ❌') + (r.passLarge? ' (large ok)':' (large fail)'));
  }

  console.log('\nSuggested adjustments for failing pairs:');
  for(const r of results.filter(x=>!x.passSmall)){
    const suggested = suggestDarker(r.fg, r.bg, 4.5);
    if(suggested) console.log(`- ${r.pair}: darken ${r.fg} -> ${suggested} to reach >=4.5`);
    else console.log(`- ${r.pair}: no simple darken suggestion available`);
  }
}

function blendHexOver(hexForeground, alpha, hexBackground){
  const fg = hexToRgb(hexForeground);
  const bg = hexToRgb(hexBackground);
  const r = Math.round(fg.r * alpha + bg.r * (1-alpha));
  const g = Math.round(fg.g * alpha + bg.g * (1-alpha));
  const b = Math.round(fg.b * alpha + bg.b * (1-alpha));
  const toHex=(v)=> (v<16?"0":"") + v.toString(16);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function suggestDarker(fg, bg, target){
  let {h,s,l}=hexToHsl(fg);
  let lo=0, hi=l, best=null;
  for(let i=0;i<20;i++){
    const mid=(lo+hi)/2;
    const candidate=hslToHex(h,s,mid);
    const cr=contrastRatio(candidate,bg);
    if(cr>=target){ best=candidate; hi=mid; } else { lo=mid; }
  }
  return best;
}

run().catch((e)=>{console.error('Audit failed:', e); process.exit(2);});
