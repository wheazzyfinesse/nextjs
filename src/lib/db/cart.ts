import { cookies } from "next/dist/client/components/headers";
import { prisma } from "./prisma";
import { Cart, CartItem as CartItemPrisma, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// CartWithProducts Props Type
export type CartWithProducts = Prisma.CartGetPayload<{
    include: { items: { include: { product: true } } };
}>;

// CartItem Props Type
export type CartItem = Prisma.CartItemGetPayload<{
    include: { product: true };
}>;
// ShoppingCart Props Type
export type ShoppingCart = CartWithProducts & {
    size: number;
    subtotal: number;
};

// Get Cart
export async function getCart(): Promise<ShoppingCart | null> {
    const session = await getServerSession(authOptions);
    let cart: CartWithProducts | null = null;

    if (session) {
        cart = await prisma.cart.findFirst({
            where: { userId: session.user.id },
            include: { items: { include: { product: true } } },
        });
    } else {
        const localCartId = cookies().get("localCartId")?.value;

        cart = localCartId
            ? await prisma.cart.findUnique({
                  where: { id: localCartId },
                  include: { items: { include: { product: true } } },
              })
            : null;
    }

    if (!cart) {
        return null;
    }

    // Calculate cart size and subtotal before returning it
    return {
        ...cart,
        size: cart.items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cart.items.reduce(
            (acc, item) => acc + item.quantity * item.product.price,
            0
        ),
    };
}

// Create Cart
export async function createCart(): Promise<ShoppingCart> {
    const session = await getServerSession(authOptions);
    let newCart: Cart;
    if (session) {
        newCart = await prisma.cart.create({
            data: { userId: session.user.id },
        });
    } else {
        newCart = await prisma.cart.create({
            data: {},
        });
        // Set the cookie with a valid ObjectID
        cookies().set("localCartId", newCart.id);
    }

    return {
        ...newCart,
        items: [],
        size: 0,
        subtotal: 0,
    };
}

// Merge Anonymous Cart with User Cart if User is authenticated
export async function mergeAnonymousCartIntoUserCart(userId: string) {
    const localCartId = cookies().get("localCartId")?.value;

    const localCart = localCartId
        ? await prisma.cart.findUnique({
              where: { id: localCartId },
              include: { items: true },
          })
        : null;

    if (!localCart) return;

    const userCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
    });

    await prisma.$transaction(async (tx) => {
        if (userCart) {
            const mergedCartItems = mergeCartItems(
                localCart.items,
                userCart.items
            );
            await tx.cartItem.deleteMany({
                where: { cartId: userCart.id },
            });

            await tx.cart.update({
                where: {
                    id: userCart.id,
                },
                data: {
                    items: {
                        createMany: {
                            data: mergedCartItems.map((item) => ({
                                cartId: userCart.id,
                                productId: item.productId,
                                quantity: item.quantity,
                            })),
                        },
                    },
                },
            });
        } else {
            await tx.cart.create({
                data: {
                    userId,
                    items: {
                        createMany: {
                            data: localCart.items.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                            })),
                        },
                    },
                    
                },
            });
        }

        await tx.cart.delete({
            where: { id: localCartId },
        });
        cookies().set("localCartId", "");
    });
}

// Merging cart items once user is found and has items in cart during previous activity session
function mergeCartItems(...cartItems: CartItemPrisma[][]) {
    return cartItems.reduce((acc, items) => {
        items.forEach((item) => {
            const existingItem = acc.find(
                (i) => i.productId === item.productId
            );
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                acc.push(item);
            }
        });
        return acc;
    }, [] as CartItem[]);
}
