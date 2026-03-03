"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import tippy, { Instance } from "tippy.js";
import { MentionList, MentionListRef } from "./mention-list";
import { Product } from "@/types";
import { useEffect, useState } from "react";
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
    AtSign
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        getProducts().then((res) => {
            if (res.success && res.data) {
                setProducts(res.data);
            }
        });
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: "mention bg-primary/20 text-primary px-1 rounded-md font-bold italic",
                },
                suggestion: {
                    items: ({ query }) => {
                        return products
                            .filter((item) =>
                                item.name.toLowerCase().includes(query.toLowerCase())
                            )
                            .slice(0, 5);
                    },
                    render: () => {
                        let component: ReactRenderer<MentionListRef>;
                        let popup: Instance[];

                        return {
                            onStart: (props) => {
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

                            onUpdate(props) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect as any,
                                });
                            },

                            onKeyDown(props) {
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

    // Sync value if changed externally (important for initial load/reset)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, false);
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
                    onClick={() => editor.chain().focus().toggleBold().execute()}
                    className={editor.isActive("bold") ? "bg-muted" : ""}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().execute()}
                    className={editor.isActive("italic") ? "bg-muted" : ""}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).execute()}
                    className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).execute()}
                    className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().execute()}
                    className={editor.isActive("bulletList") ? "bg-muted" : ""}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().execute()}
                    className={editor.isActive("orderedList") ? "bg-muted" : ""}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().execute()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().execute()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
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
