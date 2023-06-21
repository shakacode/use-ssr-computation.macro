import fs from'fs';
import glob from 'glob';

// Match all JavaScript files in the 'lib' directory
glob('lib/**/*.js', (err, files) => {
  if (err) {
    console.error('Failed to read directory:', err);
    return;
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Add .js to all relative import/export statements
    const result = content.replace(/from\s+(['"])\.(.*?)(?=\1)/g, 'from $1.$2.js');

    fs.writeFileSync(file, result, 'utf8');
  }
});
