#!/usr/bin/env python3
"""
Database migration script to copy data from 'goalforge' to 'smartgoals' database.
This script safely migrates all collections and their data.
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
MONGODB_URI = "mongodb://127.0.0.1:27017"
SOURCE_DB = "goalforge"
TARGET_DB = "smartgoals"

async def migrate_database():
    """Migrate all data from source database to target database."""
    client = None
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URI)
        
        # Get source and target databases
        source_db = client[SOURCE_DB]
        target_db = client[TARGET_DB]
        
        # Get list of collections in source database
        collections = await source_db.list_collection_names()
        
        if not collections:
            logger.warning(f"No collections found in source database '{SOURCE_DB}'")
            return
        
        logger.info(f"Found {len(collections)} collections to migrate: {collections}")
        
        total_documents = 0
        
        # Migrate each collection
        for collection_name in collections:
            logger.info(f"Migrating collection: {collection_name}")
            
            source_collection = source_db[collection_name]
            target_collection = target_db[collection_name]
            
            # Get all documents from source collection
            documents = []
            async for doc in source_collection.find():
                documents.append(doc)
            
            if not documents:
                logger.info(f"  No documents found in {collection_name}")
                continue
            
            logger.info(f"  Found {len(documents)} documents")
            
            # Insert documents into target collection
            try:
                if len(documents) == 1:
                    await target_collection.insert_one(documents[0])
                else:
                    await target_collection.insert_many(documents, ordered=False)
                
                logger.info(f"  Successfully migrated {len(documents)} documents")
                total_documents += len(documents)
                
            except DuplicateKeyError as e:
                logger.warning(f"  Some documents already exist in {collection_name}: {e}")
                # Try inserting one by one to skip duplicates
                success_count = 0
                for doc in documents:
                    try:
                        await target_collection.insert_one(doc)
                        success_count += 1
                    except DuplicateKeyError:
                        continue
                
                logger.info(f"  Migrated {success_count} new documents (skipped duplicates)")
                total_documents += success_count
            
            except Exception as e:
                logger.error(f"  Error migrating {collection_name}: {e}")
                continue
        
        logger.info(f"Migration completed! Total documents migrated: {total_documents}")
        
        # Verify migration by counting documents
        logger.info("Verifying migration...")
        for collection_name in collections:
            source_count = await source_db[collection_name].count_documents({})
            target_count = await target_db[collection_name].count_documents({})
            
            if source_count == target_count:
                logger.info(f"  ✓ {collection_name}: {source_count} documents")
            else:
                logger.warning(f"  ⚠ {collection_name}: source={source_count}, target={target_count}")
        
        logger.info("Migration verification completed!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
    
    finally:
        if client:
            client.close()

async def check_databases():
    """Check if source database exists and target database status."""
    client = None
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        
        # List all databases
        db_list = await client.list_database_names()
        
        logger.info(f"Available databases: {db_list}")
        
        if SOURCE_DB not in db_list:
            logger.error(f"Source database '{SOURCE_DB}' not found!")
            return False
        
        if TARGET_DB in db_list:
            target_collections = await client[TARGET_DB].list_collection_names()
            if target_collections:
                logger.warning(f"Target database '{TARGET_DB}' already exists with collections: {target_collections}")
                response = input("Continue with migration? This may create duplicates (y/N): ")
                if response.lower() != 'y':
                    return False
        
        return True
        
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        return False
    
    finally:
        if client:
            client.close()

async def main():
    """Main migration function."""
    logger.info("Starting database migration...")
    logger.info(f"Source: {SOURCE_DB}")
    logger.info(f"Target: {TARGET_DB}")
    logger.info(f"MongoDB URI: {MONGODB_URI}")
    
    # Check databases before migration
    if not await check_databases():
        logger.error("Pre-migration checks failed. Aborting.")
        sys.exit(1)
    
    # Perform migration
    await migrate_database()
    
    logger.info("Database migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
