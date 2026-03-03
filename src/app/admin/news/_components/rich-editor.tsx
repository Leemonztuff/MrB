"use client";

import Image from "next/image";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import tippy, { Instance } from "tippy.js";
import { MentionList, MentionListRef } from "./mention-list";
import { Product } from "@/types";
import { useEffect, useState, useRef } from "react";
import { getProducts } from "@/app/admin/actions/products.actions";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Undo,
    Redo,
    AtSign,
    Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const productsRef = useRef<Product[]>([]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: "mention font-black italic text-primary hover:underline",
                },
                renderHTML({ options, node }) {
                    return [
                        'a',
                        {
                            ...options.HTMLAttributes,
                            'data-id': node.attrs.id,
                            'href': `/portal/catalogo?productId=${node.attrs.id}`,
                        },
                        `@${node.attrs.label ?? node.attrs.id}`,
                    ]
                },
                suggestion: {
                    items: ({ query }: { query: string }) => {
                        return (productsRef.current || [])
                            .filter((item: Product) =>
                                item.name.toLowerCase().includes(query.toLowerCase())
                            )
                            .slice(0, 10);
                    },
                    render: () => {
                        let component: ReactRenderer<MentionListRef>;
                        let popup: Instance[];

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy("body", {
                                    getReferenceClientRect: props.clientRect as any,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: "manual",
                                    placement: "bottom-start",
                                });
                            },

                            onUpdate(props: any) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect as any,
                                });
                            },

                            onKeyDown(props: any) {
                                if (props.event.key === "Escape") {
                                    popup[0].hide();
                                    return true;
                                }

                                return component?.ref?.onKeyDown(props) || false;
                            },

                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[150px] p-4",
            },
        },
        immediatelyRender: false,
    });

    const insertProductInfo = (product: Product) => {
        if (!editor) return;

        editor.chain()
            .focus()
            .insertContent(`<h3><strong>${product.name}</strong></h3>`)
            .insertContent(`<p>${product.description || ""}</p>`)
            .run();
    };

    // Fetch products and update editor options when editor is ready
    useEffect(() => {
        if (!editor) return; // Ensure editor is initialized

        getProducts().then((res) => {
            if (res.success && res.data) {
                setProducts(res.data);
                productsRef.current = res.data;

                // Dynamically update editor items
                editor.setOptions({
                    extensions: editor.options.extensions.map(ext => {
                        if (ext.name === 'mention') {
                            return ext.configure({
                                suggestion: {
                                    items: ({ query }: { query: string }) => {
                                        return (res.data || [])
                                            .filter((item: Product) =>
                                                item.name.toLowerCase().includes(query.toLowerCase())
                                            )
                                            .slice(0, 10);
                                    }
                                }
                            });
                        }
                        return ext;
                    })
                });
            }
        });
    }, [editor]); // Dependency on 'editor'

    // Sync value if changed externally (important for initial load/reset)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-input bg-background rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
            <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/30">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "bg-muted" : ""}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "bg-muted" : ""}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-muted" : ""}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "bg-muted" : ""}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <ProductHydrationMenu products={products} onSelect={insertProductInfo} />
            </div>
            <div className="relative">
                <EditorContent editor={editor} />
                {editor.isEmpty && placeholder && (
                    <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none text-sm italic opacity-50">
                        {placeholder}
                    </div>
                )}
            </div>
            <div className="px-3 py-1 bg-muted/10 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                    <AtSign className="h-2.5 w-2.5" />
                    Usa @ para mencionar productos
                </div>
                <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                    Markdown compatible
                </div>
            </div>
        </div>
    );
}

function ProductHydrationMenu({ products, onSelect }: { products: Product[], onSelect: (p: Product) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                    title="Insertar información de producto"
                >
                    <Box className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tight hidden sm:inline">Hidratar Post</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 border-white/10 glass shadow-2xl" side="bottom" align="end">
                <div className="p-3 border-b border-white/5 bg-white/5">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                    {filtered.length > 0 ? (
                        filtered.map(p => (
                            <button
                                key={p.id}
                                className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group flex items-start gap-3"
                                onClick={() => {
                                    onSelect(p);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                <div className="h-8 w-8 rounded bg-white/5 flex-shrink-0 overflow-hidden relative border border-white/10">
                                    {p.image_url && <Image src={p.image_url} alt="" fill className="object-cover" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold truncate group-hover:text-primary transition-colors">{p.name}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-tight font-black">{p.category}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-[10px] text-center p-4 text-muted-foreground italic">No se encontraron productos</p>
                    )}
                </div>
                <div className="p-2 border-t border-white/5 bg-black/20">
                    <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-widest">
                        Selecciona para insertar descripción
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
