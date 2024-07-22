"use client";
import { CartItem } from "@/lib/db/cart";
import formatPrice from "@/lib/FormatPrice";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

interface cartEntryProps {
    CartItem: CartItem;
    setProductQuantity: (productId: string, quantity: number) => Promise<void>;
}
export default function CartEntry({
    CartItem: { product, quantity },
    setProductQuantity,
}: cartEntryProps) {
    const [isPending, startTransition] = useTransition();
    const quantityOptions: JSX.Element[] = [];
    for (let i = 1; i <= 99; i++) {
        quantityOptions.push(
            <option key={i} value={i}>
                {i}
            </option>
        );
    }
    return (
        <div>
            <div className="flex flex-wrap items-center gap-4">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="rounded-lg"
                />
                <div>
                    <Link
                        href={"/products/" + product.id}
                        className="font-bold"
                    >
                        {product.name}
                    </Link>
                    <div>Price: {formatPrice(product.price)}</div>
                    <div className="my-1 items-center gap-2">
                        Quantity:
                        <select
                            className="select-bordered select w-full max-w-[80px]"
                            defaultValue={quantity}
                            onChange={(e) => {
                                const newQuantity = parseInt(
                                    e.currentTarget.value
                                );
                                startTransition(() =>
                                    setProductQuantity(product.id, newQuantity)
                                );
                            }}
                        >
                            <option value={0}>0 (Remove)</option>
                            {quantityOptions}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        Total: {formatPrice(product.price * quantity)}
                        {isPending && (
                            <span className="loading loading-spinner loading-sm" />
                        )}
                    </div>
                </div>
            </div>
            <div className="divider" />
        </div>
    );
}
