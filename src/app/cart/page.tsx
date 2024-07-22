import { getCart } from "@/lib/db/cart";
import CartEntry from "./CartEntry";
import setProductQuantity from "./actions";
import formatPrice from "@/lib/FormatPrice";

export const metadata = {
    title: "Your cart - Flowmart",
};
export default async function CartPage() {
    const cart = await getCart();
    return (
        <div>
            <h1 className="my-6 text-3xl font-bold">Shopping Cart</h1>
            {cart?.items.map((cartItem) => (
                <CartEntry
                    CartItem={cartItem}
                    key={cartItem.id}
                    setProductQuantity={setProductQuantity}
                />
            ))}
            {!cart?.items.length && (
                <div>
                    <p>Your cart is empty</p>
                    <p className="mb-3 font-bold">
                        Total: {formatPrice(cart?.subtotal || 0)}
                    </p>
                </div>
            )}
            <div className="flex flex-col items-end sm:items-center">
                <p className="mb-3 font-bold">
                    Total: {formatPrice(cart?.subtotal || 0)}
                </p>
                <button className="btn-primary btn sm:w-[200px]">
                    CHECKOUT
                </button>
            </div>
        </div>
    );
}
