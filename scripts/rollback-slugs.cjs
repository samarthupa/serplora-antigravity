const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const P = '/Users/samarth/serplora';

const rollbackDir = (d) => {
  if (!fs.existsSync(d)) return;
  for (let x of fs.readdirSync(d, { withFileTypes: true })) {
    if (x.isDirectory()) {
      let f = path.join(d, x.name, 'index.mdoc');
      if (fs.existsSync(f)) {
        let c = fs.readFileSync(f, 'utf8');
        if (!c.includes('title:\n  name:')) continue;
        
        let parts = c.split('---');
        if (parts.length < 3) continue;
        
        try {
          let frontmatter = yaml.load(parts[1]);
          if (!frontmatter || !frontmatter.title || !frontmatter.title.name) continue;
          
          let flatTitle = frontmatter.title.name;
          let flatSlug = frontmatter.title.slug;
          
          frontmatter.title = flatTitle;
          frontmatter.slug = flatSlug;
          
          let newYaml = yaml.dump(frontmatter);
          let newContent = '---\n' + newYaml + '---\n' + parts.slice(2).join('---');
          newContent = newContent.replace(/^---\n\n/gm, '---\n');
          fs.writeFileSync(f, newContent, 'utf8');
          console.log('Rolled back', x.name);
        } catch (e) {
          console.error("Failed rollback on", x.name, e);
        }
      }
    }
  }
};

rollbackDir(path.join(P, 'src', 'content', 'posts'));
rollbackDir(path.join(P, 'src', 'content', 'tutorials'));
console.log('Rollback complete');
