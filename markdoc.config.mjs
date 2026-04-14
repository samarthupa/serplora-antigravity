import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    fence: {
      render: component('./src/components/ui/SemanticCode.astro'),
      attributes: {
        content: { type: String },
        language: { type: String }
      }
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
    }
  }
});