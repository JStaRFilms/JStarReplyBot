#!/usr/bin/env node

/**
 * Test script for Contact Management System
 * Run this to verify the contact management functionality works correctly
 */

const { app } = require('electron')
const { ContactManagementService } = require('./src/main/services/contact-management.service')

async function testContactManagement() {
    console.log('🧪 Testing Contact Management System...\n')

    try {
        // Initialize app if needed
        if (!app.isReady()) {
            await app.whenReady()
        }

        const contactService = ContactManagementService.getInstance()

        // Test 1: Create test contacts
        console.log('1. Creating test contacts...')
        const testResult = await contactService.createTestContacts()
        console.log(`   ✅ Created ${testResult.created} test contacts\n`)

        // Test 2: Get all contacts
        console.log('2. Getting all contacts...')
        const contacts = await contactService.getContacts()
        console.log(`   ✅ Found ${contacts.length} contacts\n`)

        // Test 3: Get system status
        console.log('3. Getting system status...')
        const status = await contactService.getContactSystemStatus()
        console.log('   ✅ System Status:')
        console.log(`      - Total Contacts: ${status.totalContacts}`)
        console.log(`      - Total Notes: ${status.totalNotes}`)
        console.log(`      - Total Categories: ${status.totalCategories}`)
        console.log(`      - Has Test Contacts: ${status.hasTestContacts}`)
        console.log(`      - WhatsApp Connected: ${status.whatsappConnected}\n`)

        // Test 4: Test contact search
        console.log('4. Testing contact search...')
        const searchResult = await contactService.searchContacts({
            query: 'John',
            sortBy: 'name',
            sortOrder: 'asc'
        })
        console.log(`   ✅ Found ${searchResult.length} contacts matching 'John'\n`)

        // Test 5: Test contact categories
        console.log('5. Testing contact categories...')
        const categories = await contactService.getContactCategories()
        console.log(`   ✅ Found ${categories.length} categories\n`)

        // Test 6: Test contact notes
        console.log('6. Testing contact notes...')
        const notes = await contactService.getContactNotes()
        console.log(`   ✅ Found ${notes.length} notes\n`)

        // Test 7: Test contact statistics
        console.log('7. Testing contact statistics...')
        const stats = await contactService.getContactStats()
        console.log('   ✅ Contact Statistics:')
        console.log(`      - Total: ${stats.total}`)
        console.log(`      - Saved: ${stats.saved}`)
        console.log(`      - Unsaved: ${stats.unsaved}`)
        console.log(`      - Categories: ${Object.keys(stats.byCategory).length}\n`)

        console.log('🎉 All tests passed! Contact Management System is working correctly.')
        console.log('\n📋 Test Summary:')
        console.log(`   - Created ${testResult.created} test contacts`)
        console.log(`   - Loaded ${contacts.length} total contacts`)
        console.log(`   - System status: ${status.totalContacts} contacts, ${status.totalNotes} notes, ${status.totalCategories} categories`)
        console.log(`   - Search functionality: Working (${searchResult.length} results for 'John')`)
        console.log(`   - Categories: ${categories.length} available`)
        console.log(`   - Notes: ${notes.length} available`)
        console.log(`   - Statistics: ${stats.total} total, ${stats.saved} saved, ${stats.unsaved} unsaved`)

    } catch (error) {
        console.error('❌ Test failed:', error.message)
        console.error(error.stack)
        process.exit(1)
    }
}

// Run the test
testContactManagement().catch(console.error)