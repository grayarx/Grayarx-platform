#!/usr/bin/env node

/**
 * Automated Test Dealership Onboarding Script
 * Creates a test dealership, activates agents, and runs validation tests
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TEST_EMAIL = 'test@testmotors.co.za';
const TEST_PHONE = '+27123456789';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

async function step(title, fn) {
  log(`\n▶ ${title}`, 'blue');
  try {
    const result = await fn();
    log(`✓ ${title}`, 'green');
    return result;
  } catch (error) {
    log(`✗ ${title}: ${error.message}`, 'red');
    throw error;
  }
}

async function onboardTestDealership() {
  log('\n🚀 Starting Test Dealership Onboarding\n', 'blue');

  let dealershipId;
  let apiKey;

  try {
    // Step 1: Create dealership account
    dealershipId = await step('Create test dealership account', async () => {
      const result = await makeRequest('/dealerships', 'POST', {
        name: 'Test Motors (Pty) Ltd',
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        location: 'Johannesburg, South Africa',
        vehicleTypes: ['cars', 'trucks', 'motorcycles'],
      });
      return result.dealershipId;
    });

    // Step 2: Generate API key
    apiKey = await step('Generate API key', async () => {
      const result = await makeRequest(`/dealerships/${dealershipId}/api-keys`, 'POST', {
        name: 'Test API Key',
      });
      return result.apiKey;
    });

    // Step 3: Configure dealership settings
    await step('Configure dealership settings', async () => {
      await makeRequest(`/dealerships/${dealershipId}/settings`, 'PUT', {
        companyName: 'Test Motors (Pty) Ltd',
        enterpriseNumber: '2024/123456',
        taxNumber: '9876543210',
        businessHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '14:00' },
          sunday: { open: 'closed', close: 'closed' },
        },
      });
    });

    // Step 4: Enable email configuration
    await step('Configure email settings', async () => {
      await makeRequest(`/dealerships/${dealershipId}/email-config`, 'PUT', {
        senderEmail: 'noreply@www.grayarx.com',
        enableNotifications: true,
      });
    });

    // Step 5: Activate Sipho agent
    await step('Activate Sipho (Lead Capture Agent)', async () => {
      await makeRequest(`/dealerships/${dealershipId}/agents/sipho`, 'POST', {
        enabled: true,
        channels: ['email', 'whatsapp', 'sms'],
        leadScoringEnabled: true,
        qualityThreshold: 'high',
      });
    });

    // Step 6: Activate Mia agent
    await step('Activate Mia (Buyer Qualification Agent)', async () => {
      await makeRequest(`/dealerships/${dealershipId}/agents/mia`, 'POST', {
        enabled: true,
        qualificationCriteria: ['budget', 'timeline', 'vehicleType'],
        autoFollowupEnabled: true,
      });
    });

    // Step 7: Activate Themba agent
    await step('Activate Themba (Test Drive Booking Agent)', async () => {
      await makeRequest(`/dealerships/${dealershipId}/agents/themba`, 'POST', {
        enabled: true,
        calendarConnected: true,
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        smsRemindersEnabled: true,
      });
    });

    // Step 8: Activate Kagiso agent
    await step('Activate Kagiso (Follow-up & Nurturing Agent)', async () => {
      await makeRequest(`/dealerships/${dealershipId}/agents/kagiso`, 'POST', {
        enabled: true,
        followupSchedule: ['day1', 'day3', 'day7'],
        personalizedMessaging: true,
      });
    });

    // Step 9: Activate Nala agent
    await step('Activate Nala (Dealership Support Agent)', async () => {
      await makeRequest(`/dealerships/${dealershipId}/agents/nala`, 'POST', {
        enabled: true,
        supportEnabled: true,
        responseTimeTarget: 120, // 2 minutes
      });
    });

    // Step 10: Create test leads
    const testLeadIds = [];

    const lead1Id = await step('Create test lead 1 (Email)', async () => {
      const result = await makeRequest('/leads', 'POST', {
        dealershipId,
        source: 'email',
        name: 'Test Lead 1',
        email: 'testlead1@example.com',
        phone: '+27123456780',
        message: 'I am interested in a Toyota Corolla',
        vehicleInterest: 'Toyota Corolla',
      });
      return result.leadId;
    });
    testLeadIds.push(lead1Id);

    const lead2Id = await step('Create test lead 2 (WhatsApp)', async () => {
      const result = await makeRequest('/leads', 'POST', {
        dealershipId,
        source: 'whatsapp',
        name: 'Test Lead 2',
        phone: '+27123456781',
        message: 'Hi, I want to know about your Hyundai i20',
        vehicleInterest: 'Hyundai i20',
      });
      return result.leadId;
    });
    testLeadIds.push(lead2Id);

    const lead3Id = await step('Create test lead 3 (SMS)', async () => {
      const result = await makeRequest('/leads', 'POST', {
        dealershipId,
        source: 'sms',
        name: 'Test Lead 3',
        phone: '+27123456782',
        message: 'Interested in BMW X5',
        vehicleInterest: 'BMW X5',
      });
      return result.leadId;
    });
    testLeadIds.push(lead3Id);

    // Step 11: Qualify leads with Mia
    await step('Qualify test leads', async () => {
      for (const leadId of testLeadIds) {
        await makeRequest(`/agents/mia/qualify/${leadId}`, 'POST', {
          dealershipId,
        });
      }
    });

    // Step 12: Schedule test drive
    await step('Schedule test drive for lead 1', async () => {
      await makeRequest(`/agents/themba/book/${lead1Id}`, 'POST', {
        dealershipId,
        vehicleId: 'toyota_corolla_001',
        preferredTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });
    });

    // Step 13: Send follow-up emails
    await step('Send follow-up emails', async () => {
      for (const leadId of testLeadIds) {
        await makeRequest(`/agents/kagiso/followup/${leadId}`, 'POST', {
          dealershipId,
          day: 1,
        });
      }
    });

    // Step 14: Test support queries
    await step('Test Nala support agent', async () => {
      await makeRequest('/agents/nala/query', 'POST', {
        dealershipId,
        query: 'What is your warranty policy?',
      });
    });

    // Step 15: Verify metrics
    await step('Verify dashboard metrics', async () => {
      const metrics = await makeRequest(`/dealerships/${dealershipId}/metrics`, 'GET');
      log(`  Leads captured: ${metrics.leadsCount}`, 'yellow');
      log(`  Leads qualified: ${metrics.qualifiedCount}`, 'yellow');
      log(`  Test drives booked: ${metrics.testDrivesCount}`, 'yellow');
      log(`  Follow-ups sent: ${metrics.followupsCount}`, 'yellow');
    });

    // Success summary
    log('\n✅ Test Dealership Onboarding Complete!\n', 'green');
    log('Summary:', 'blue');
    log(`  Dealership ID: ${dealershipId}`, 'yellow');
    log(`  API Key: ${apiKey}`, 'yellow');
    log(`  Test Email: ${TEST_EMAIL}`, 'yellow');
    log(`  Test Leads Created: ${testLeadIds.length}`, 'yellow');
    log(`  Agents Activated: 5/5`, 'yellow');
    log('\nNext Steps:', 'blue');
    log('  1. Monitor email delivery in SendGrid dashboard', 'yellow');
    log('  2. Check agent performance in Analytics', 'yellow');
    log('  3. Verify lead qualification accuracy', 'yellow');
    log('  4. Test SMS and WhatsApp delivery', 'yellow');
    log('  5. Deploy to production when ready', 'yellow');

  } catch (error) {
    log(`\n❌ Onboarding failed: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// Run the onboarding
onboardTestDealership().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
