import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.join(root,'dist');
const data=JSON.parse(fs.readFileSync(path.join(root,'src/site-data.json'),'utf8'));
if(data.origin!=='https://jandmremoval.com'||data.tally!=='https://tally.so/r/QoMoPA')throw new Error('Confirm changed production destinations before building.');
const read=relative=>fs.readFileSync(path.join(root,'src',relative),'utf8');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const facts={...data,year:new Date().getUTCFullYear()};
function render(text,values=facts){return text.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error(`Unknown template value: ${key}`);return String(values[key]);});}
const faqItems=data.faqs.map((faq,index)=>`<details${index===0?' open':''}><summary>${faq.question}</summary><p>${render(faq.answer)}</p></details>`).join('\n');
const areaRows=data.areas.map(area=>`<div class="area-row"><h3>${escape(area.name)}</h3>${area.note?`<span>${escape(area.note)}</span>`:''}</div>`).join('\n');
const pages=[
  {route:'/',file:'home.html',title:'Houston Junk Removal & Loading Help | J&M Removal',description:'J&M Removal offers junk removal and loading/unloading labor in Houston. Run by University of Houston students. Request a free photo/video estimate.'},
  {route:'/junk-removal/',file:'junk-removal.html',title:'Junk Removal in Houston | J&M Removal',description:'Request a free estimate for unwanted furniture, household items and clutter. We review the items, access and eligible destination before confirming your job.'},
  {route:'/loading-unloading/',file:'loading-unloading.html',title:'Loading & Unloading Help in Houston | J&M Removal',description:'Labor-only help with loading and unloading in Houston. You arrange the vehicle and transportation. Get a free estimate based on your items and access.'},
  {route:'/estimate/',file:'estimate.html',title:'Get a Free Estimate | J&M Removal',description:'Tell J&M Removal about your Houston junk removal or loading/unloading request. Photos are optional. A request is not a confirmed booking.',estimate:true},
  {route:'/privacy/',file:'privacy.html',title:'Privacy & Your Information | J&M Removal',description:'How J&M Removal uses estimate requests, contact details, uploaded files and source information, and how to contact us about your information.'},
  {route:'/404.html',file:'404.html',title:'Page Not Found | J&M Removal',description:'Find your way back to J&M Removal or request a free estimate for Houston junk removal and loading/unloading help.',notFound:true}
];
fs.mkdirSync(output,{recursive:true});
// Copy only the public directory. Operational records and build sources are never website assets.
fs.cpSync(path.join(root,'public'),output,{recursive:true});
for(const page of pages){
  const canonical=data.origin+page.route;
  const body=render(read('pages/'+page.file),{...facts,faqItems,areaRows});
  const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}">
  ${page.notFound?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${canonical}">`}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escape(data.name)}">
  <meta property="og:title" content="${escape(page.title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${data.origin}/assets/original-logo.png">
  <meta property="og:image:width" content="1254">
  <meta property="og:image:height" content="1254">
  <meta property="og:image:alt" content="J&amp;M Removal — Hauling Junk, Chasing Degrees">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/png" href="/assets/original-logo.png">
  <link rel="apple-touch-icon" href="/assets/original-logo.png">
  <link rel="stylesheet" href="/assets/site.css">
  <script type="module" src="/assets/site.mjs"></script>
</head>
<body${page.estimate?' class="estimate-page"':''}>
  <a class="skip-link" href="#main">Skip to main content</a>
  ${render(read('templates/header.html'))}
  <main id="main" tabindex="-1">${body}</main>
  ${render(read('templates/footer.html'))}
  ${page.estimate?'':render(read('templates/mobile-bar.html'))}
</body>
</html>\n`;
  const target=page.notFound?path.join(output,'404.html'):path.join(output,page.route,'index.html');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,html);
}
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p=>!p.notFound).map(p=>`  <url><loc>${data.origin}${p.route}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(output,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${data.origin}/sitemap.xml\n`);
console.log(`Built ${pages.length} HTML pages in dist. No provider calls or submissions.`);
