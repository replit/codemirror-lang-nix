import { parser as nixParser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { styleTags, tags as t } from "@codemirror/highlight"
import { completeFromList } from "@codemirror/autocomplete"

export const parser = nixParser;

export const nixLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({closing: ")", align: false})
      }),
      foldNodeProp.add({
        Application: foldInside
      }),
      styleTags({
        Identifier: t.variableName,
        Boolean: t.bool,
        String: t.string,
        IndentedString: t.string,
        Comment: t.lineComment,
        Float: t.float,
        Integer: t.integer,
        "( )": t.paren,
        "{ }": t.brace,
        Null: t.null,
        URI: t.literal,
        SPath: t.literal,

        "import": t.keyword,
        "with": t.keyword,
        "let": t.keyword,
        "in": t.keyword,
        "rec": t.keyword,
        "builtins": t.keyword,
        "inherit": t.keyword,
        "if": t.keyword,
        "then": t.keyword,
        "else": t.keyword,
        "assert": t.keyword,
        "or": t.keyword,
      })
    ]
  }),
  languageData: {
    commentTokens: {line: "#"}
  }
})

export const nixCompletion = nixLanguage.data.of({
  autocomplete: completeFromList([
    {label: "let", type: "keyword"},
    {label: "with", type: "keyword"},
    {label: "rec", type: "keyword"},
    {label: "inherit", type: "keyword"},
    {label: "builtins", type: "keyword"},

    {label: "import", type: "function"},
  ])
})

export function nix() {
    return new LanguageSupport(nixLanguage, [nixCompletion])
}