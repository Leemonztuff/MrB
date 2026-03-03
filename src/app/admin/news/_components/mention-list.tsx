"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MentionListProps {
    items: Product[];
    command: (props: { id: string; label: string }) => void;
}

export interface MentionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.name });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === "ArrowUp") {
                upHandler();
                return true;
            }
            if (event.key === "ArrowDown") {
                downHandler();
                return true;
            }
            if (event.key === "Enter") {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return (
            <div className="bg-popover border rounded-md shadow-md p-2 text-xs text-muted-foreground italic">
                No se encontraron productos
            </div>
        );
    }

    return (
        <div className="bg-popover border rounded-md shadow-lg overflow-hidden min-w-[200px] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/50 mb-1">
                Mencionar Producto
            </div>
            {props.items.map((item, index) => (
                <button
                    key={item.id}
                    className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-sm transition-colors",
                        index === selectedIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => selectItem(index)}
                >
                    <div className={cn(
                        "h-6 w-6 rounded border flex items-center justify-center shrink-0 overflow-hidden",
                        index === selectedIndex ? "border-primary-foreground/20" : "border-border"
                    )}>
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="h-3 w-3 opacity-50" />
                        )}
                    </div>
                    <span className="flex-1 truncate">{item.name}</span>
                    {index === selectedIndex && <Check className="h-3 w-3" />}
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = "MentionList";
