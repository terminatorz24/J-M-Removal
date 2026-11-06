// Public navigation and allowlisted campaign labels only. No cookies, storage, analytics or submission calls.
export const CAMPAIGN_KEYS=Object.freeze(['utm_source','utm_medium','utm_campaign']);
export function campaignParameters(search){
  const input=new URLSearchParams(search),output=new URLSearchParams();
  for(const key of CAMPAIGN_KEYS){
    const values=input.getAll(key);
    // Only one bounded, non-sensitive campaign label per supported key. Reject URLs, email-like data and controls.
    if(values.length===1&&/^[A-Za-z0-9][A-Za-z0-9._~ -]{0,99}$/.test(values[0]))output.set(key,values[0]);
  }
  return output;
}
export function destinationWithCampaign(href,locationHref){
  const current=new URL(locationHref),target=new URL(href,current);
  const internal=target.origin===current.origin;
  const form=target.origin==='https://tally.so'&&['/r/QoMoPA','/embed/QoMoPA'].includes(target.pathname);
  if(!internal&&!form)return href;
  const campaign=campaignParameters(current.search);
  const displayOptions=new URLSearchParams();
  if(form&&target.pathname==='/embed/QoMoPA')for(const key of ['alignLeft','hideTitle','transparentBackground'])if(target.searchParams.get(key)==='1')displayOptions.set(key,'1');
  // Fragment-only links inherit the current query in URL(); clear it too, rather than carrying unknown values.
  target.search=displayOptions.toString();
  for(const key of CAMPAIGN_KEYS)if(campaign.has(key))target.searchParams.set(key,campaign.get(key));
  return internal?target.pathname+target.search+target.hash:target.href;
}
if(typeof document!=='undefined'){
  const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('primary-navigation');
  if(toggle&&nav){
    const closeMenu=()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='Menu';};
    toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close':'Menu';});
    nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('is-open')){closeMenu();toggle.focus();}});
    window.matchMedia('(min-width: 701px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
    // Hide the mobile navigation only after its controls are attached; it remains usable if JavaScript fails.
    document.documentElement.classList.add('js');
  }
  document.querySelectorAll('a[href]').forEach(link=>{const href=link.getAttribute('href');if(href.startsWith('/')||href.startsWith('#')||link.hasAttribute('data-tally-link'))link.setAttribute('href',destinationWithCampaign(href,window.location.href));});
  const holder=document.getElementById('tally-embed');
  if(holder){
    const url=new URL(holder.dataset.tallyBase);
    if(url.origin==='https://tally.so'&&url.pathname==='/embed/QoMoPA'){
      url.searchParams.set('alignLeft','1');url.searchParams.set('hideTitle','1');url.searchParams.set('transparentBackground','1');
      const iframe=document.createElement('iframe');
      iframe.className='tally-frame';iframe.title='J&M Removal — Free estimate request';iframe.width='100%';iframe.height='2300';iframe.referrerPolicy='no-referrer';
      // Set the filtered URL before insertion. Do not load embed.js: it forwards all page parameters.
      iframe.src=destinationWithCampaign(url.href,window.location.href);
      holder.append(iframe);
    }
  }
}
