import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function resetDatabase() {
  console.log('🗑️  Starting database reset...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get all collection names
    const collections = await connection.db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections to reset`);
    
    // Drop all collections
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🗑️  Dropping collection: ${collectionName}`);
      await connection.db.dropCollection(collectionName);
    }
    
    console.log('✅ All collections dropped successfully');
    console.log('🎉 Database reset completed!');
    console.log('\n💡 Run "npm run db:seed" to populate with sample data');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the reset
if (require.main === module) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };