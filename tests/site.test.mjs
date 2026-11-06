import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {campaignParameters,destinationWithCampaign} from '../public/assets/site.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const routes=['/','/junk-removal/','/loading-unloading/','/estimate/','/privacy/','/404.html'];
const fileFor=route=>path.join(dist,route.endsWith('/')?route+'index.html':route);
const pages=new Map(routes.map(route=>[route,fs.readFileSync(fileFor(route),'utf8')]));
const attrs=(html,attribute)=>[...html.matchAll(new RegExp(`\\b${attribute}="([^"]*)"`,'g'))].map(m=>m[1].replaceAll('&amp;','&'));

test('all generated pages resolve internal links, fragments and local resources',()=>{
  for(const [route,html] of pages){
    const ids=attrs(html,'id');assert.equal(new Set(ids).size,ids.length,`Duplicate ID on ${route}`);
    for(const href of [...attrs(html,'href'),...attrs(html,'src')]){
      const url=new URL(href,'https://jandmremoval.com'+route);
      if(url.origin!=='https://jandmremoval.com')continue;
      assert.ok(fs.existsSync(fileFor(url.pathname)),`Missing ${url.pathname} from ${route}`);
      if(url.hash){const target=fs.readFileSync(fileFor(url.pathname),'utf8');assert.ok(attrs(target,'id').includes(decodeURIComponent(url.hash.slice(1))),`Missing fragment ${href}`);}
    }
  }
});

test('pages expose real titles, descriptions, main landmarks and safe index metadata',()=>{
  for(const [route,html] of pages){
    assert.equal((html.match(/<h1\b/g)||[]).length,1,route);
    assert.ok(html.includes('<html lang="en">'));
    assert.ok(html.includes('<main id="main" tabindex="-1">'));
    assert.ok(/<title>[^<]+<\/title>/.test(html));
    assert.ok(/<meta name="description" content="[^"]+">/.test(html));
    assert.ok(!/Local design preview|Not published|\{\{\w+\}\}/.test(html));
    if(route==='/404.html')assert.ok(html.includes('name="robots" content="noindex"'));
    else {assert.ok(html.includes(`rel="canonical" href="https://jandmremoval.com${route}"`));assert.ok(!html.includes('noindex'));}
  }
});

test('estimate uses only the existing Tally form and an always-visible fallback',()=>{
  const html=pages.get('/estimate/');
  assert.ok(html.includes('id="tally-embed" data-tally-base="https://tally.so/embed/QoMoPA"'));
  assert.equal((html.match(/data-tally-link href="https:\/\/tally.so\/r\/QoMoPA"/g)||[]).length,2);
  assert.ok(!html.includes('class="mobile-action-bar"'));
  assert.ok(html.includes('<noscript><iframe'));
  assert.ok(!html.includes('widgets/embed.js'));
  assert.ok(!/<form\b/.test(html));
});

test('campaign labels survive internal navigation and the Tally embed/fallback without unrelated query data',()=>{
  const incoming='https://jandmremoval.com/?utm_source=instagram&utm_medium=social&utm_campaign=Eastwood-26&email=private%40example.com&token=secret';
  const service=destinationWithCampaign('/junk-removal/',incoming);
  const estimate=destinationWithCampaign('/estimate/','https://jandmremoval.com'+service);
  const location='https://jandmremoval.com'+estimate;
  for(const target of ['https://tally.so/r/QoMoPA','https://tally.so/embed/QoMoPA?alignLeft=1&hideTitle=1&transparentBackground=1']){
    const url=new URL(destinationWithCampaign(target,location));
    assert.equal(url.searchParams.get('utm_source'),'instagram');
    assert.equal(url.searchParams.get('utm_medium'),'social');
    assert.equal(url.searchParams.get('utm_campaign'),'Eastwood-26');
    assert.ok(!url.searchParams.has('email'));assert.ok(!url.searchParams.has('token'));
  }
  assert.ok(destinationWithCampaign('/#faqs',incoming).endsWith('#faqs'));
  assert.ok(!destinationWithCampaign('#main',incoming).includes('email='));
  assert.ok(!destinationWithCampaign('#main',incoming).includes('token='));
  assert.ok(!destinationWithCampaign('https://tally.so/embed/QoMoPA?email=private&alignLeft=1',incoming).includes('email='));
  assert.equal(destinationWithCampaign('https://www.instagram.com/jmremovalhtx/',incoming),'https://www.instagram.com/jmremovalhtx/');
  assert.equal(destinationWithCampaign('mailto:jmremovalhtx@gmail.com',incoming),'mailto:jmremovalhtx@gmail.com');
});

test('ambiguous, excessive and sensitive-looking campaign labels are rejected',()=>{
  assert.equal(campaignParameters('?utm_source=one&utm_source=two&utm_medium=person%40example.com&utm_campaign='+('x'.repeat(101))).toString(),'');
  assert.equal(campaignParameters('?utm_source=https%3A%2F%2Fprivate.example&utm_campaign=%3Cscript%3E').toString(),'');
  assert.equal(campaignParameters('?utm_source=QR&utm_medium=card&utm_campaign=Eastwood%20November').get('utm_campaign'),'Eastwood November');
});

test('public assets preserve the original identity and the approved hero replacement',()=>{
  const hash=file=>createHash('sha256').update(fs.readFileSync(path.join(dist,'assets',file))).digest('hex');
  assert.equal(hash('original-logo.png'),'58d47354fcd9441d74c9aa4c476aaf3ccad14e708bd6a59823940f8e1b30e56c');
  assert.equal(hash('hero-clear-space.png'),'aa052b0edb7d3208e22628bcbff46c7d40f4eb94215422525ec911c82e951fe6');
  assert.ok(pages.get('/').includes('src="/assets/hero-clear-space.png"'));
  for(const html of pages.values())assert.ok(!/C:\\|dispatcher\.lock|administrative-thread|customer-record|api[_-]?key|BEGIN PRIVATE KEY/.test(html));
});

test('crawler files cover the public pages and not the 404 page',()=>{
  const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
  for(const route of routes.filter(r=>r!=='/404.html'))assert.ok(sitemap.includes(`<loc>https://jandmremoval.com${route}</loc>`));
  assert.ok(!sitemap.includes('/404.html'));
  assert.ok(fs.readFileSync(path.join(dist,'robots.txt'),'utf8').includes('Sitemap: https://jandmremoval.com/sitemap.xml'));
});
