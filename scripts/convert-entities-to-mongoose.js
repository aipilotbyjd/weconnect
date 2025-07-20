const fs = require('fs');
const path = require('path');

// Find all entity files
function findEntityFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findEntityFiles(fullPath));
    } else if (item.endsWith('.entity.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Convert TypeORM imports to Mongoose
function convertImports(content) {
  // Replace TypeORM imports with Mongoose
  content = content.replace(
    /import\s*{[^}]*}\s*from\s*['"]typeorm['"];?\s*/g,
    "import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { Types } from 'mongoose';"
  );
  
  // Replace BaseEntity import
  content = content.replace(
    /import\s*{[^}]*BaseEntity[^}]*}\s*from\s*['"][^'"]*base\.entity['"];?\s*/g,
    "import { BaseSchema } from '../../../../core/abstracts/base.schema';"
  );
  
  return content;
}

// Convert decorators
function convertDecorators(content) {
  // Replace @Entity with @Schema
  content = content.replace(
    /@Entity\(['"]([^'"]*)['"]\)/g,
    "@Schema({ collection: '$1' })"
  );
  
  // Replace @Column() with @Prop()
  content = content.replace(/@Column\(\)/g, '@Prop()');
  
  // Replace @Column({ ... }) with @Prop({ ... })
  content = content.replace(/@Column\(/g, '@Prop(');
  
  // Replace BaseEntity with BaseSchema
  content = content.replace(/extends BaseEntity/g, 'extends BaseSchema');
  
  // Remove @Index decorators (will handle separately)
  content = content.replace(/@Index\([^)]*\)\s*/g, '');
  
  return content;
}

// Add schema export
function addSchemaExport(content, className) {
  if (!content.includes('SchemaFactory.createForClass')) {
    content += `\n\nexport const ${className}Schema = SchemaFactory.createForClass(${className});`;
  }
  return content;
}

// Main conversion function
function convertEntityFile(filePath) {
  console.log(`Converting: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract class name
  const classMatch = content.match(/export class (\w+)/);
  if (!classMatch) {
    console.log(`Could not find class name in ${filePath}`);
    return;
  }
  const className = classMatch[1];
  
  // Convert imports
  content = convertImports(content);
  
  // Convert decorators
  content = convertDecorators(content);
  
  // Add schema export
  content = addSchemaExport(content, className);
  
  // Write back
  fs.writeFileSync(filePath, content);
  console.log(`Converted: ${className}`);
}

// Run conversion
const srcDir = path.join(__dirname, '..', 'src');
const entityFiles = findEntityFiles(srcDir);

console.log(`Found ${entityFiles.length} entity files to convert:`);
entityFiles.forEach(file => console.log(`  ${file}`));

console.log('\nStarting conversion...');
entityFiles.forEach(convertEntityFile);

console.log('\nConversion complete!');
console.log('\nNote: You may need to manually adjust:');
console.log('- Complex column types');
console.log('- Relationships (@ManyToOne, @OneToMany, etc.)');
console.log('- Indexes (add to schema options)');
console.log('- Custom decorators');