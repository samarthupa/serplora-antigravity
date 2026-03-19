const { default: config } = require('./keystatic.config.ts');
console.log("Config loaded. Object keys:", Object.keys(config));
try {
  // We can just dump what astro content tries to do. 
  // Wait, if it's ts, we need ts-node or esbuild.
  console.log("Singletons:", Object.keys(config.singletons));
  console.log("Collections:", Object.keys(config.collections));
} catch(e) { console.error(e); }
