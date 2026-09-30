import { ensureGuestSession } from './auth.js';
import { getCart,updateCart } from './api.js';
export { getCart };
export async function addToCart(variantId,quantity=1,snapshot){const session=await ensureGuestSession();const cart=snapshot??await getCart(session);const line=cart.lines.find(item=>item.variantId===variantId);return updateCart({variantId,quantity:(line?.quantity??0)+quantity,expectedRevision:cart.revision},session);}
