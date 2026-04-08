import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    fence: {
      render: component('./src/components/SemanticCode.astro'),
      attributes: {
        content: { type: String },
        language: { type: String }
      }
    }
  },
  tags: {
    codeEditor: {
      render: component('./src/components/CodeEditorWrapper.astro'),
      attributes: {
        code: { type: String },
        language: { type: String }
      }
    },
    // 🟢 ADD THIS BACK FOR YOUR <pre> TAG
    preformatted: {
      render: component('./src/components/PreformattedText.astro'),
      attributes: {
        text: { type: String }
      }
    }
  }
});