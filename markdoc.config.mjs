import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    codeEditor: {
      render: component('./src/components/CodeEditorWrapper.astro'),
      attributes: {
        code: { type: String },
        language: { type: String }
      }
    }
  }
});