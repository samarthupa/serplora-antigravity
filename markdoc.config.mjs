// markdoc.config.mjs
import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    fence: {
      render: component('./src/components/ui/SemanticCode.astro'),
      attributes: {
        content: { type: String },
        language: { type: String }
      }
    },
    // 🟢 NEW: Intercept all CMS tables and wrap them in the custom scroll component
    table: {
      render: component('./src/components/ui/MarkdownTable.astro'),
    }
  },
  tags: {
    codeEditor: {
      render: component('./src/components/keystatic/CodeEditorWrapper.astro'),
      attributes: {
        code: { type: String },
        language: { type: String }
      }
    },
    preformatted: {
      render: component('./src/components/ui/PreformattedText.astro'),
      attributes: {
        text: { type: String }
      }
    },
    rawHtml: {
      render: component('./src/components/ui/RawHtml.astro'),
      attributes: {
        html: { type: String }
      }
    }
  }
});