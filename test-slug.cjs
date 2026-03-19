const core = require('@keystatic/core');
const slugField = core.fields.slug({ name: { label: 'Title' } });
console.log("Serialize result:", typeof slugField.serialize({ name: 'A', slug: 'b'}) === 'object');
