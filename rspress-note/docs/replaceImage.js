const fs = require('fs');
const path = require('path');

// Function to replace <img /> tags with ![]() format
function replaceImgTags(content) {
  return content.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
    // Extract alt text if available
    const altMatch = match.match(/alt="([^"]*)"/i);
    const altText = altMatch ? altMatch[1] : '';
    return `![${altText}](${src})`;
  });
}

// Function to process files in the directory
function processDirectory(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(dir, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats of file: ${err}`);
          return;
        }

        if (stats.isDirectory()) {
          // Recursively process subdirectories
          processDirectory(filePath);
        } else if (path.extname(file) === '.md') {
          // Process markdown files
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Error reading file: ${err}`);
              return;
            }

            const updatedContent = replaceImgTags(data);

            fs.writeFile(filePath, updatedContent, 'utf8', err => {
              if (err) {
                console.error(`Error writing file: ${err}`);
                return;
              }

              console.log(`Processed file: ${filePath}`);
            });
          });
        }
      });
    });
  });
}

// Start processing the current directory
processDirectory(process.cwd());
