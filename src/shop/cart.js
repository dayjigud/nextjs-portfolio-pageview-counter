import { ensureGuestSession } from './auth.js';
import { getCart,updateCart } from './api.js';
export { getCart };
export async function addToCart(variantId,quantity=1){await ensureGuestSession();const cart=await getCart();const line=cart.lines.find(item=>item.variantId===variantId);return updateCart({variantId,quantity:(line?.quantity??0)+quantity,expectedRevision:cart.revision});}
