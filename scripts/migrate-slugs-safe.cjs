const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const P = '/Users/samarth/serplora';

const migrateDir = (d) => {
  if (!fs.existsSync(d)) return;
  for (let x of fs.readdirSync(d, { withFileTypes: true })) {
    if (x.isDirectory()) {
      let f = path.join(d, x.name, 'index.mdoc');
      if (fs.existsSync(f)) {
        let c = fs.readFileSync(f, 'utf8');
        if (c.includes('title:\n  name:')) continue;
        
        let parts = c.split('---');
        if (parts.length < 3) continue;
        
        try {
          // parse frontmatter safely
          let frontmatter = yaml.load(parts[1]);
          if (!frontmatter) frontmatter = {};
          
          let oldTitle = frontmatter.title || x.name;
          let oldSlug = frontmatter.slug || x.name;
          
          // remove old top-level fields
          delete frontmatter.title;
          delete frontmatter.slug;
          
          // re-attach as nested object Keystatic needs
          frontmatter.title = { name: oldTitle, slug: oldSlug };
          
          // serialize safely
          let newYaml = yaml.dump(frontmatter);
          
          // swap it back
          let newContent = '---\n' + newYaml + '---\n' + parts.slice(2).join('---');
          
          // ensure no double dashes issue
          newContent = newContent.replace(/^---\n\n/gm, '---\n');
          fs.writeFileSync(f, newContent, 'utf8');
          console.log('Migrated', x.name);
        } catch (e) {
          console.error("Failed on", x.name, e);
        }
      }
    }
  }
};

migrateDir(path.join(P, 'src', 'content', 'posts'));
migrateDir(path.join(P, 'src', 'content', 'tutorials'));
console.log('Migration Safe complete');
