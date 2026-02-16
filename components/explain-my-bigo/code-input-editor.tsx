"use client";

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  placeholder as cmPlaceholder,
  EditorView,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

import type { AnalyzeLanguage } from "@/components/explain-my-bigo/types";
import {
  getLanguageExtension,
  resolveEditorLanguage,
} from "@/components/explain-my-bigo/utils";

interface CodeInputEditorProps {
  value: string;
  language: AnalyzeLanguage;
  placeholder: string;
  onChange: (value: string) => void;
  onAnalyzeShortcut: () => void;
}

export function CodeInputEditor({
  value,
  language,
  placeholder,
  onChange,
  onAnalyzeShortcut,
}: CodeInputEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  const onAnalyzeShortcutRef = useRef(onAnalyzeShortcut);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onAnalyzeShortcutRef.current = onAnalyzeShortcut;
  }, [onAnalyzeShortcut]);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const languageCompartment = new Compartment();

    const state = EditorState.create({
      doc: "",
      extensions: [
        lineNumbers(),
        history(),
        oneDark,
        EditorView.lineWrapping,
        cmPlaceholder(placeholder),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          {
            key: "Mod-Enter",
            run: () => {
              onAnalyzeShortcutRef.current();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "18rem",
            fontSize: "12px",
          },
          ".cm-scroller": {
            fontFamily:
              "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
          ".cm-content": {
            minHeight: "18rem",
            padding: "8px 10px",
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            brorderRight: "1px solid var(--border)",
          },
          "&.cm-focused": {
            outline: "none",
          },
        }),
        languageCompartment.of(getLanguageExtension("text")),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });

    viewRef.current = view;
    languageCompartmentRef.current = languageCompartment;

    return () => {
      view.destroy();
      viewRef.current = null;
      languageCompartmentRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    const languageCompartment = languageCompartmentRef.current;
    if (!view || !languageCompartment) {
      return;
    }

    const editorLanguage = resolveEditorLanguage(value, language);
    view.dispatch({
      effects: languageCompartment.reconfigure(
        getLanguageExtension(editorLanguage),
      ),
    });
  }, [language, value]);

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 rounded-none border bg-transparent focus-within:ring-1">
      <div ref={hostRef} />
    </div>
  );
}
