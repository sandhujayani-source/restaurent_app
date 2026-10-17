const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');

if (!fs.existsSync(openApiPath)) {
    throw new Error(`OpenAPI file not found: ${openApiPath}`);
}

const openApiContent = fs.readFileSync(openApiPath, 'utf8');
const swaggerDocument = YAML.parse(openApiContent);

if (!swaggerDocument.paths) {
    throw new Error('OpenAPI document does not contain a paths section.');
}

console.log('Swagger documentation loaded from:', openApiPath);
console.log('Swagger endpoints:', Object.keys(swaggerDocument.paths));
console.log(
  'DELETE operation:',
  JSON.stringify(swaggerDocument.paths['/api/menu/items/{id}']?.delete, null, 2)
);
console.log('DELETE path exists:', Boolean(
    swaggerDocument.paths['/api/menu/items/{id}']?.delete
));
module.exports = swaggerDocument;