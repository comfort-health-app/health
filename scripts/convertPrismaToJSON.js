/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');





const fileNames = fs.readdirSync('prisma/schema');
let jsResult = `
export const prismaSchemaString = \`
`;
for (let i = 0; i < fileNames.length; i++) {
 const fileName = fileNames[i];
 const schemaPath = path.join('prisma', 'schema', fileName);
 const schema = fs.readFileSync(schemaPath, 'utf8');
 jsResult += `
${schema}
 `
}


// schema.prisma の内容を適切な形式で変換（必要に応じて）
jsResult += `\`;
`

const schemaPath = path.join('prisma', 'schema/schema.prisma');
const outputPath = path.join('src/cm/lib/methods/scheme-json-export.js'); // 出力先のパスを指定






// schema.prisma の内容を適切な形式で変換（必要に応じて）


fs.writeFileSync(outputPath, jsResult);
