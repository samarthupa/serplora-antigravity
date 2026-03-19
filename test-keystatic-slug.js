const { fields } = require('@keystatic/core');
const slugField = fields.slug({ name: { label: 'Title' } });
const val = { name: 'My Title', slug: 'my-slug' };
try {
  const result = slugField.serialize(val);
  console.log("Serialize result:", JSON.stringify(result));
} catch (e) {
  console.error("Serialize failed:", e.message);
}
