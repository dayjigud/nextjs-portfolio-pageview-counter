import { isConfigured, getAuthState, startCheckout, signInShop, completeOAuthCallback, signOutShop, getTransferReview, reviseGuestTransfer, retryGuestTransfer } from './auth.js';
import { getCatalog, getProduct } from './catalog.js';
import { getCart, updateCart, getQuote, placeOrder, getOrder, listOrders, findOrderByRequest } from './api.js';
import { addToCart } from './cart.js';
import { orderRequestKey, clearOrderKey, pendingOrderKey } from './checkout.js';
import { formatMoney, escapeHtml } from './contracts.js';
import { shopPath, navHtml, googleIconHtml, heroHtml, unavailableHtml, stateHtml, collectionHtml, cardHtml, cartLinesHtml, totalsHtml, notify } from './render.js';

export async function initShopPage(root, embedded = false) {
 const content = root.querySelector('[data-shop-content]');
 const bundledImages=new Set(['luma-a1.svg','luma-buds-pro.svg','soundcylinder.svg','magstand.svg','mechkey-flow.svg','pro-hub.svg','luma-watch-s1.svg']);
 root.addEventListener('error',event=>{
  const image=event.target;if(!(image instanceof HTMLImageElement))return;
  const path=new URL(image.currentSrc||image.src,location.origin).pathname;
  const match=path.match(/\/storage\/v1\/object\/public\/luma-catalog\/([a-z0-9-]+\.svg)$/);
  if(match&&bundledImages.has(match[1]))image.src=`/images/luma/${match[1]}`;
 },true);
 let auth = {}, cart = { revision:0, lines:[], subtotalKobo:0 }, products = [], category = '', query = '', quote, transferReview;
 const mode = embedded ? 'catalog' : root.dataset.shopPage;
 const showError = error => notify(root, error?.message || 'Something went wrong. Please try again.', true);
 const updateBadge = () => { root.querySelectorAll('[data-cart-count]').forEach(el=> el.textContent = String(cart.lines.reduce((n,l)=>n+l.quantity,0))); };
 const refreshCart = async () => { cart = await getCart(); updateBadge(); return cart; };
 function signInGate(checkout = false) {
  const dialog = document.createElement('dialog'); dialog.className = 'luma luma-dialog';
  dialog.innerHTML = `<form method="dialog"><button class="luma-dialog-close" aria-label="Close sign-in" type="submit">×</button></form><span class="luma-eyebrow">YOUR BAG IS SAFE</span><h2>${checkout ? 'One last step.' : 'Make yourself at home.'}</h2><p>Continue with Google ${checkout ? 'to review your bag and place a demo order' : 'to save your bag across devices'}. Your guest bag comes with you.</p><p class="luma-small">Portfolio demo. No payment or shipment.</p><button class="luma-button" type="button" data-google>${googleIconHtml()}Continue with Google</button><p role="status" data-login-status></p>`;
  document.body.append(dialog); dialog.showModal(); dialog.addEventListener('close',()=>dialog.remove());
  dialog.querySelector('[data-google]').addEventListener('click',async e=> {e.currentTarget.disabled=true; try {await (checkout ? startCheckout() : signInShop(mode==='confirmation'||mode==='account'?location.pathname+location.search:undefined));} catch(error){dialog.querySelector('[data-login-status]').textContent=error.message;e.currentTarget.disabled=false;}});
 }
 async function renderCollection() {
  products = await getCatalog({query,category:category || null});
  const categories = ['audio','desk','power','wearables'];
  const collection = collectionHtml(products,categories,category);
  content.innerHTML=heroHtml()+collection;
  content.querySelector('[name=query]').value=query;
 }
 async function renderCart() {
  await refreshCart();
  if (!cart.lines.length) {content.innerHTML=stateHtml('A little room for good things.','Your bag is empty. Find a gadget that makes your everyday a little brighter.');return;}
  content.innerHTML=`<div class="luma-page-heading"><a href="${shopPath}">← Keep exploring</a><p class="luma-eyebrow">YOUR FINDS, ALL TOGETHER</p><h1>Your bag<span>.</span></h1><p>Saved for later. Ready whenever you are.</p></div><div class="luma-two-column"><section class="luma-surface" aria-label="Bag items">${cartLinesHtml(cart)}</section><aside class="luma-surface luma-summary"><h2>Looking good.</h2>${totalsHtml(cart)}<p class="luma-small">The fictional delivery fee is shown at checkout.</p><button class="luma-button" type="button" data-action="checkout">Checkout <span aria-hidden="true">↗</span></button><p class="luma-small">${auth.isAnonymous || !auth.user ? 'Browse and fill your bag freely. Google sign-in is only required at checkout.' : 'Portfolio demo — no payment or shipment.'}</p><p class="luma-small">Guest bags stay linked to this browser. Sign in to save your bag across devices.</p></aside></div>`;
 }
 async function renderProduct() {
  const product = await getProduct(new URLSearchParams(location.search).get('slug') || '');
  if(!product) {content.innerHTML=stateHtml('That find is missing.','This product is unavailable or the link has changed.');return;}
  const variants=product.variants.filter(v=>v.active); const image=product.images?.[0];
  content.innerHTML=`<div class="luma-page-heading"><a href="${shopPath}">← The collection</a></div><section class="luma-product-detail"><div class="luma-detail-image">${image ? `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || product.name)}">` : '<span aria-hidden="true">✳</span>'}</div><div class="luma-detail-copy"><p class="luma-eyebrow">${escapeHtml(product.categorySlug)}</p><h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(product.description)}</p><form data-product-form><label>Choose your finish<select name="variant">${variants.map(v=>`<option value="${escapeHtml(v.id)}">${escapeHtml(v.label)} — ${formatMoney(v.priceKobo)}</option>`).join('')}</select></label><label>Quantity<input type="number" name="quantity" min="1" max="10" value="1" required></label><button class="luma-button" ${variants.length?'':'disabled'}>Add to bag <span aria-hidden="true">+</span></button></form><p class="luma-small">No payment or shipment. This is a portfolio demo.</p><details class="luma-specs" open><summary>The details</summary><dl>${Object.entries(product.specifications || {}).map(([key,value])=>`<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(Array.isArray(value)?value.join(', '):value)}</dd></div>`).join('')}</dl></details></div></section>`;
 }
 async function renderCheckout() {
  if(!auth.user || auth.isAnonymous) {content.innerHTML=stateHtml('Your bag comes with you.','Sign in with Google to review your bag and place a demo order.',`<button class="luma-button" type="button" data-action="checkout">Continue to checkout</button><a class="luma-text-link" href="${shopPath}cart/">Back to your bag</a>`);return;}
  const pending=pendingOrderKey(sessionStorage,auth.user.id);
  if(pending){
   try{const saved=await findOrderByRequest(pending);clearOrderKey(sessionStorage);location.assign(shopPath+'confirmation/?order='+encodeURIComponent(saved.id));return;}
   catch(error){if(error.code!=='ORDER_NOT_FOUND'&&error.code!=='NOT_FOUND')throw error;}
  }
  await refreshCart();
  if(!cart.lines.length){content.innerHTML=stateHtml('Your bag is empty.','Choose something from the collection before checking out.');return;}
  quote=await getQuote();
  content.innerHTML=`<div class="luma-page-heading"><a href="${shopPath}cart/">← Your bag</a><p class="luma-eyebrow">JUST A DEMO. STILL A LITTLE DELIGHTFUL.</p><h1>Make it yours<span>.</span></h1><p>No card. No charge. No shipment.</p></div><div class="luma-two-column"><form class="luma-surface luma-delivery" data-checkout-form><h2>Demo delivery details</h2><p>Use fictional delivery details. Nothing will be shipped.</p><label>Recipient name<input name="recipientName" autocomplete="off" required minlength="2" maxlength="100" value="${escapeHtml(auth.user.user_metadata?.full_name || '')}"></label><label>City<input name="city" autocomplete="off" required minlength="2" maxlength="100" placeholder="e.g. Demo City"></label><label>Fictional address<textarea name="address" autocomplete="off" rows="3" required minlength="5" maxlength="300" placeholder="e.g. 12 Example Street"></textarea></label><div class="luma-receipt-email"><span>Confirmation email</span><strong>${escapeHtml(auth.user.email)}</strong><p>Sent to your Google account email.</p></div><label class="luma-consent"><input name="demoConsent" type="checkbox" required><span>I understand this is a demo order with no payment or shipment.</span></label><button class="luma-button" type="submit">Place demo order <span aria-hidden="true">↗</span></button></form><aside class="luma-surface luma-summary"><h2>Your good things.</h2>${cartLinesHtml(cart,false)}${totalsHtml(quote)}<p class="luma-small">All totals are fictional. No money is collected.</p></aside></div>`;
 }
 async function renderReceipt() {
  if(!auth.user || auth.isAnonymous){content.innerHTML=stateHtml('Your receipt is private.','Sign in with Google to view your demo order.', '<button class="luma-button" data-action="signin">Sign in with Google</button>');return;}
  const order=await getOrder(new URLSearchParams(location.search).get('order') || '');
  const emailCopy={pending:'Confirmation email queued.',processing:'Confirmation email being requested.',accepted:'Confirmation email requested. Provider acceptance does not guarantee inbox delivery.',retrying:'Confirmation email is being retried.',failed:'Your order is saved. The confirmation email could not be sent.'};
  content.innerHTML=`<div class="luma-receipt-heading"><span class="luma-success" aria-hidden="true">✓</span><p class="luma-eyebrow">DEMO ORDER CONFIRMED</p><h1>Good things,<br><em>all wrapped up.</em></h1><p>No payment was collected. No shipment will occur.</p></div><section class="luma-surface luma-receipt"><div class="luma-receipt-meta"><h2>${escapeHtml(order.reference)}</h2><time>${escapeHtml(new Date(order.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}))}</time></div>${cartLinesHtml({lines:order.items.map(item=>({...item,productName:item.productName || item.name,variantLabel:item.variantLabel || item.variant,priceKobo:item.priceKobo ?? item.unitPriceKobo}))},false)}${totalsHtml(order)}<p class="luma-email-status">${emailCopy[order.emailStatus] || 'Confirmation email status unavailable.'}</p><div class="luma-receipt-actions"><a class="luma-button" href="${shopPath}">Back to the good stuff</a><a href="${shopPath}account/">View your orders ↗</a></div></section>`;
 }
 async function renderTransferReview(){
  transferReview=await getTransferReview();
  content.innerHTML=`<div class="luma-page-heading"><p class="luma-eyebrow">YOUR FINDS ARE SAFE</p><h1>A little bag review<span>.</span></h1><p>Both bags are saved. Reduce guest quantities or remove unavailable items before combining them. Each item can have up to 10 units, across at most 20 different items.</p></div><div class="luma-two-column"><section class="luma-surface"><h2>Your guest bag</h2>${transferReview.guest.lines.map(line=>`<div class="luma-order-row"><div><strong>${escapeHtml(line.productName)}</strong><p>${escapeHtml(line.variantLabel)}</p><label>Guest quantity<input type="number" min="0" max="10" value="${line.quantity}" data-transfer-quantity="${escapeHtml(line.variantId)}"></label></div><button class="luma-text-link" type="button" data-transfer-remove="${escapeHtml(line.variantId)}">Remove</button></div>`).join('')||'<p>Your guest bag is empty.</p>'}<button class="luma-button" type="button" data-action="retry-transfer">Combine bags and continue</button></section><aside class="luma-surface"><h2>Your account bag</h2>${cartLinesHtml(transferReview.account,false)}<a href="${shopPath}cart/">Review account bag ↗</a></aside></div>`;
 }
 async function renderAccount() {
  if(!auth.user || auth.isAnonymous){content.innerHTML=stateHtml('A space for your good things.','Sign in to find your saved bag and demo order history.', '<button class="luma-button" data-action="signin">Sign in with Google</button>');return;}
  const orders=await listOrders();
  content.innerHTML=`<div class="luma-page-heading"><p class="luma-eyebrow">MAKE YOURSELF AT HOME</p><h1>Hello, ${escapeHtml(auth.user.user_metadata?.full_name?.split(' ')[0] || 'you')}<span>.</span></h1><p>${escapeHtml(auth.user.email)}</p><button class="luma-text-link" type="button" data-action="signout">Sign out</button></div><section class="luma-surface"><h2>Your demo orders</h2>${orders.length ? orders.map(order=>`<a class="luma-order-row" href="${shopPath}confirmation/?order=${encodeURIComponent(order.id)}"><div><strong>${escapeHtml(order.reference)}</strong><p>${escapeHtml(new Date(order.createdAt).toLocaleDateString())} · Demo confirmed</p></div><span>${formatMoney(order.totalKobo)} ↗</span></a>`).join('') : '<p class="luma-empty">No demo orders yet. Your next favorite is waiting in the collection.</p>'}</section>`;
 }
 async function render() {
  auth = await getAuthState(); root.querySelector('[data-shop-nav]').innerHTML=navHtml(auth);
  if(!isConfigured()){content.innerHTML=(mode==='catalog' ? heroHtml() : '')+unavailableHtml();return;}
  if(mode==='catalog') await renderCollection();
  else if(mode==='product') await renderProduct();
  else if(mode==='cart') await renderCart();
  else if(mode==='checkout') await renderCheckout();
  else if(mode==='confirmation') await renderReceipt();
  else if(mode==='account') await renderAccount();
  else if(mode==='callback'){content.innerHTML=stateHtml('Bringing your bag along.','Finishing Google sign-in. Please keep this page open.','');await completeOAuthCallback();}
  if(mode==='catalog' || mode==='product') {try {await refreshCart();}catch { /* Catalog browsing remains usable if cart service is offline. */ }}
 }
 async function add(variantId, quantity=1) {
  cart=await addToCart(variantId,quantity);auth=await getAuthState();updateBadge();notify(root,'Added to your bag. Saved and ready when you are.');
 }
 root.addEventListener('click',async event=> {
  const button=event.target.closest('button');if(!button)return;
  try {
   if(button.dataset.category!==undefined){category=button.dataset.category;await renderCollection();}
   if(button.dataset.add){button.disabled=true;await add(button.dataset.add);}
   if(button.dataset.remove){button.disabled=true;cart=await updateCart({variantId:button.dataset.remove,quantity:0,expectedRevision:cart.revision});await renderCart();}
   if(button.dataset.action==='signin'){if(!isConfigured())notify(root,'The shop is not connected yet.',true);else signInGate();}
   if(button.dataset.action==='checkout'){await refreshCart();if(!cart.lines.length){notify(root,'Your bag is empty.',true);return;}if(auth.user&&!auth.isAnonymous)location.assign(shopPath+'checkout/');else signInGate(true);}
   if(button.dataset.action==='signout'){await signOutShop();location.assign(shopPath);}
   if(button.dataset.action==='retry-transfer'){await retryGuestTransfer();}
   if(button.dataset.transferRemove){await reviseGuestTransfer({variantId:button.dataset.transferRemove,quantity:0,expectedRevision:transferReview.guest.revision});await renderTransferReview();}
  } catch(error){showError(error);} finally {button.disabled=false;}
 });
 root.addEventListener('change',async event=> {
  if(event.target.dataset.transferQuantity){event.target.disabled=true;try{await reviseGuestTransfer({variantId:event.target.dataset.transferQuantity,quantity:Number(event.target.value),expectedRevision:transferReview.guest.revision});await renderTransferReview();}catch(error){showError(error);}finally{event.target.disabled=false;}return;}
  if(!event.target.dataset.quantity)return;event.target.disabled=true;
  try {cart=await updateCart({variantId:event.target.dataset.quantity,quantity:Number(event.target.value),expectedRevision:cart.revision});await renderCart();}catch(error){showError(error);await renderCart();}finally{event.target.disabled=false;}
 });
 root.addEventListener('submit',async event=> {
  const form=event.target; if(!form.matches('[data-shop-search],[data-product-form],[data-checkout-form]'))return;event.preventDefault();const data=new FormData(form);const button=form.querySelector('button[type=submit],button:not([type])');if(button)button.disabled=true;
  try {
   if(form.matches('[data-shop-search]')){query=String(data.get('query') || '');await renderCollection();content.querySelector('[name=query]').focus();}
   if(form.matches('[data-product-form]'))await add(String(data.get('variant')),Number(data.get('quantity')));
   if(form.matches('[data-checkout-form]')) {
    const key=orderRequestKey(sessionStorage,auth.user.id,quote.cartRevision);
    const order=await placeOrder({idempotencyKey:key,cartRevision:quote.cartRevision,quoteFingerprint:quote.fingerprint,delivery:{recipientName:String(data.get('recipientName')).trim(),city:String(data.get('city')).trim(),address:String(data.get('address')).trim()}});
    clearOrderKey(sessionStorage);location.assign(shopPath+'confirmation/?order='+encodeURIComponent(order.id));
   }
  }catch(error){showError(error);if(error.code==='QUOTE_CHANGED'||error.code==='CART_CONFLICT'){await renderCheckout();notify(root,'Your bag or prices changed. Review the updated total before placing your demo order.',true);}}
  finally{if(button)button.disabled=false;}
 });
 try {await render();}catch(error){
  if(mode==='callback'&&['MERGE_CONFLICT','CART_CONFLICT'].includes(error.code)){try{await renderTransferReview();showError(error);return;}catch(reviewError){error=reviewError;}}
  content.innerHTML=stateHtml('A little pause.','We could not load this part of the shop. Check your connection and try again.', `<button class="luma-button" type="button" data-retry>Try again</button><a class="luma-text-link" href="${shopPath}cart/">Back to your bag</a>`);showError(error);content.querySelector('[data-retry]').addEventListener('click',()=>location.reload());}
}
const pageRoot=document.querySelector('[data-shop-page]');if(pageRoot)initShopPage(pageRoot);
