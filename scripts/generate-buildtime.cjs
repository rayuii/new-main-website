const fs = require('fs');
const path = require('path');

const buildTimeFile = path.join(__dirname, '../src/lib/buildtime.ts');
const content = `// This file is auto-generated during build
export const BUILD_TIMESTAMP = ${Date.now()};
`;

fs.writeFileSync(buildTimeFile, content);
console.log('Generated buildtime.ts with current timestamp');
