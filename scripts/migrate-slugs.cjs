const fs = require('fs');
const path = require('path');

const migrateDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return;
  const folders = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const dirent of folders) {
    if (dirent.isDirectory()) {
      const file = path.join(dirPath, dirent.name, 'index.mdoc');
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Don't double migrate
        if (content.includes('title:\n  name:')) continue;
        
        // Extract frontmatter
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (!match) continue;
        
        let frontmatter = match[1];
        
        // Extract flat fields
        const slugMatch = frontmatter.match(/^slug:\s*(['"]?)(.+?)\1\s*$/m);
        const titleMatch = frontmatter.match(/^title:\s*(['"]?)(.+?)\1\s*$/m);
        
        const slug = slugMatch ? slugMatch[2] : dirent.name;
        const title = titleMatch ? titleMatch[2] : dirent.name;
        
        // Remove old occurrences
        let newFrontmatter = frontmatter
            .replace(/^slug:.*\n?/gm, '')
            .replace(/^title:.*\n?/gm, '');
            
        // Append new structure
        newFrontmatter = newFrontmatter.trim();
        newFrontmatter += `\ntitle:\n  name: '${title.replace(/'/g, "''")}'\n  slug: '${slug.replace(/'/g, "''")}'\n`;
        
        const newContent = content.replace(match[0], `---\n${newFrontmatter}\n---`);
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Migrated:', dirent.name);
      }
    }
  }
};

migrateDir(path.resolve(__dirname, 'src/content/posts'));
migrateDir(path.resolve(__dirname, 'src/content/tutorials'));
console.log('Migration complete');
