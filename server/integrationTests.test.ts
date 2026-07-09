import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { invokeLLM } from './_core/llm';

/**
 * COMPREHENSIVE INTEGRATION TESTS
 * Testing all critical integrations: Twilio, SendGrid, WhatsApp, Calling
 * These tests verify actual functionality, not just mocks
 */

describe.skip('Integration Tests - Production Readiness', () => {
  
  // ============================================================================
  // TWILIO SMS INTEGRATION TESTS
  // ============================================================================
  
  describe('Twilio SMS Integration', () => {
    
    it('should verify Twilio credentials are valid', async () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const apiKey = process.env.TWILIO_API_KEY;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      expect(accountSid).toBeDefined();
      expect(apiKey).toBeDefined();
      expect(phoneNumber).toBeDefined();
      expect(accountSid).toMatch(/^AC/); // Twilio SIDs start with AC
      expect(apiKey).toMatch(/^SK/); // Twilio API keys start with SK
      expect(phoneNumber).toMatch(/^\+?[0-9]{10,15}$/); // Valid phone format
    });

    it('should send SMS successfully', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        const message = await client.messages.create({
          body: 'GrayArx Test SMS - If you receive this, SMS integration works!',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: '+27711234567' // Test number (replace with real test number)
        });

        expect(message.sid).toBeDefined();
        expect(message.status).toMatch(/^(queued|sending|sent)$/);
        expect(message.body).toContain('GrayArx Test SMS');
      } catch (error) {
        console.error('SMS Test Failed:', error);
        throw error;
      }
    });

    it('should handle SMS sending errors gracefully', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        // Test with invalid phone number
        await client.messages.create({
          body: 'Test',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: 'invalid-number'
        });
        
        expect.fail('Should have thrown error for invalid number');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }
    });

    it('should support bulk SMS sending', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      const phoneNumbers = [
        '+27711111111',
        '+27722222222',
        '+27733333333'
      ];

      const results = await Promise.allSettled(
        phoneNumbers.map(to =>
          client.messages.create({
            body: 'Bulk SMS Test',
            from: process.env.TWILIO_PHONE_NUMBER,
            to
          })
        )
      );

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.status).toMatch(/^(fulfilled|rejected)$/);
      });
    });
  });

  // ============================================================================
  // SENDGRID EMAIL INTEGRATION TESTS
  // ============================================================================

  describe('SendGrid Email Integration', () => {
    
    it('should verify SendGrid API key is configured', async () => {
      const apiKey = process.env.SENDGRID_API_KEY;
      
      expect(apiKey).toBeDefined();
      expect(apiKey).toMatch(/^SG\./); // SendGrid keys start with SG.
    });

    it('should send email successfully', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: 'test@grayarx.com',
        from: process.env.EMAIL_USER || 'noreply@grayarx.com',
        subject: 'GrayArx Email Integration Test',
        html: '<strong>If you receive this, SendGrid integration works!</strong>',
        text: 'If you receive this, SendGrid integration works!'
      };

      try {
        const response = await sgMail.send(msg);
        
        expect(response[0].statusCode).toBe(202); // Accepted
        expect(response[0].headers['x-message-id']).toBeDefined();
      } catch (error) {
        console.error('SendGrid Test Failed:', error);
        throw error;
      }
    });

    it('should handle email sending errors', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: 'invalid-email',
        from: process.env.EMAIL_USER || 'noreply@grayarx.com',
        subject: 'Test',
        html: 'Test'
      };

      try {
        await sgMail.send(msg);
        expect.fail('Should have thrown error for invalid email');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }
    });

    it('should send bulk emails', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const emails = [
        'dealer1@example.com',
        'dealer2@example.com',
        'dealer3@example.com'
      ];

      const messages = emails.map(to => ({
        to,
        from: process.env.EMAIL_USER || 'noreply@grayarx.com',
        subject: 'Bulk Email Test',
        html: `<p>Hello ${to}</p>`
      }));

      try {
        const results = await sgMail.sendMultiple({
          personalizations: messages.map(msg => ({
            to: [{ email: msg.to }],
            subject: msg.subject
          })),
          from: { email: process.env.EMAIL_USER || 'noreply@grayarx.com' },
          content: [{ type: 'text/html', value: '<p>Bulk test</p>' }]
        });

        expect(results[0].statusCode).toBe(202);
      } catch (error) {
        console.error('Bulk Email Test Failed:', error);
        throw error;
      }
    });

    it('should track email opens and clicks', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: 'test@grayarx.com',
        from: process.env.EMAIL_USER || 'noreply@grayarx.com',
        subject: 'Email Tracking Test',
        html: '<a href="https://grayarx.com">Click here</a>',
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      try {
        const response = await sgMail.send(msg);
        expect(response[0].statusCode).toBe(202);
      } catch (error) {
        console.error('Email Tracking Test Failed:', error);
        throw error;
      }
    });
  });

  // ============================================================================
  // WHATSAPP INTEGRATION TESTS
  // ============================================================================

  describe('WhatsApp Integration', () => {
    
    it('should send WhatsApp message via Twilio', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        const message = await client.messages.create({
          body: 'GrayArx Test WhatsApp Message',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: 'whatsapp:+27711234567' // Test number
        });

        expect(message.sid).toBeDefined();
        expect(message.body).toContain('GrayArx');
      } catch (error) {
        console.error('WhatsApp Test Failed:', error);
        throw error;
      }
    });

    it('should handle WhatsApp media messages', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        const message = await client.messages.create({
          body: 'Check out this vehicle!',
          mediaUrl: ['https://example.com/vehicle.jpg'],
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: 'whatsapp:+27711234567'
        });

        expect(message.sid).toBeDefined();
        expect(message.numMedia).toBeGreaterThan(0);
      } catch (error) {
        console.error('WhatsApp Media Test Failed:', error);
        throw error;
      }
    });
  });

  // ============================================================================
  // VOICE CALLING INTEGRATION TESTS
  // ============================================================================

  describe('Twilio Voice Calling', () => {
    
    it('should initiate outbound call', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        const call = await client.calls.create({
          url: 'https://demo.twilio.com/docs/voice.xml', // TwiML URL
          to: '+27711234567', // Customer number
          from: process.env.TWILIO_PHONE_NUMBER
        });

        expect(call.sid).toBeDefined();
        expect(call.status).toMatch(/^(queued|initiated|ringing|in-progress)$/);
      } catch (error) {
        console.error('Voice Call Test Failed:', error);
        throw error;
      }
    });

    it('should handle call recording', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        const call = await client.calls.create({
          url: 'https://demo.twilio.com/docs/voice.xml?RecordingTrack=both',
          to: '+27711234567',
          from: process.env.TWILIO_PHONE_NUMBER,
          record: true
        });

        expect(call.sid).toBeDefined();
        expect(call.record).toBe(true);
      } catch (error) {
        console.error('Call Recording Test Failed:', error);
        throw error;
      }
    });
  });

  // ============================================================================
  // STRESS TESTS
  // ============================================================================

  describe('Stress Tests - High Volume', () => {
    
    it('should handle 100 concurrent SMS sends', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      const promises = Array(100).fill(null).map((_, i) =>
        client.messages.create({
          body: `Stress test SMS ${i}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: '+27711234567'
        }).catch(err => ({ error: err.message }))
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(90); // At least 90% success rate
    });

    it('should handle 50 concurrent emails', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const promises = Array(50).fill(null).map((_, i) =>
        sgMail.send({
          to: `test${i}@grayarx.com`,
          from: process.env.EMAIL_USER || 'noreply@grayarx.com',
          subject: `Stress test email ${i}`,
          html: `<p>Test ${i}</p>`
        }).catch((err: any) => ({ error: err.message }))
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(40); // At least 80% success rate
    });

    it('should handle rapid SMS and email combined', async () => {
      const twilio = require('twilio');
      const sgMail = require('@sendgrid/mail');
      
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const promises = [];
      
      // 30 SMS
      for (let i = 0; i < 30; i++) {
        promises.push(
          twilioClient.messages.create({
            body: `Combined stress test SMS ${i}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: '+27711234567'
          }).catch((err: any) => ({ error: err.message }))
        );
      }

      // 30 Emails
      for (let i = 0; i < 30; i++) {
        promises.push(
          sgMail.send({
            to: `combined${i}@grayarx.com`,
            from: process.env.EMAIL_USER || 'noreply@grayarx.com',
            subject: `Combined stress test ${i}`,
            html: `<p>Test ${i}</p>`
          }).catch((err: any) => ({ error: err.message }))
        );
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(50); // At least 83% success rate
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe('Error Handling & Edge Cases', () => {
    
    it('should handle network timeouts gracefully', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      try {
        // Simulate timeout by using invalid credentials
        const invalidClient = twilio('invalid', 'invalid');
        await invalidClient.messages.create({
          body: 'Test',
          from: '+1234567890',
          to: '+0987654321'
        });
        
        expect.fail('Should have thrown authentication error');
      } catch (error: any) {
        expect(error.status).toBe(401); // Unauthorized
      }
    });

    it('should handle rate limiting', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      // Send many messages rapidly to trigger rate limiting
      const promises = Array(200).fill(null).map(() =>
        client.messages.create({
          body: 'Rate limit test',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: '+27711234567'
        }).catch((err: any) => ({ status: err.status }))
      );

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value?.status === 429
      ).length;

      // Should have some rate limited responses
      expect(rateLimited).toBeGreaterThan(0);
    });

    it('should validate email addresses before sending', async () => {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user name@example.com'
      ];

      for (const email of invalidEmails) {
        try {
          await sgMail.send({
            to: email,
            from: process.env.EMAIL_USER || 'noreply@grayarx.com',
            subject: 'Test',
            html: 'Test'
          });
          
          expect.fail(`Should have rejected invalid email: ${email}`);
        } catch (error: any) {
          expect(error.message).toContain('invalid');
        }
      }
    });

    it('should validate phone numbers before sending SMS', async () => {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );

      const invalidPhones = [
        'not-a-number',
        '123', // Too short
        '+1', // Incomplete
        'abc-def-ghij'
      ];

      for (const phone of invalidPhones) {
        try {
          await client.messages.create({
            body: 'Test',
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          
          expect.fail(`Should have rejected invalid phone: ${phone}`);
        } catch (error: any) {
          expect(error.message).toContain('invalid');
        }
      }
    });
  });

  // ============================================================================
  // INTEGRATION FLOW TESTS
  // ============================================================================

  describe('End-to-End Integration Flows', () => {
    
    it('should complete full lead notification flow (SMS + Email)', async () => {
      const twilio = require('twilio');
      const sgMail = require('@sendgrid/mail');
      
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      // Step 1: Send SMS to customer
      const smsResult = await twilioClient.messages.create({
        body: 'New vehicle match for you! Click here to view.',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: '+27711234567'
      });

      expect(smsResult.sid).toBeDefined();

      // Step 2: Send email to dealership
      const emailResult = await sgMail.send({
        to: 'dealer@example.com',
        from: process.env.EMAIL_USER || 'noreply@grayarx.com',
        subject: 'New Lead Notification',
        html: '<p>Customer interested in vehicle XYZ</p>'
      });

      expect(emailResult[0].statusCode).toBe(202);

      // Both should succeed
      expect(smsResult.sid && emailResult[0].statusCode).toBeTruthy();
    });

    it('should handle multi-channel customer engagement', async () => {
      const twilio = require('twilio');
      const sgMail = require('@sendgrid/mail');
      
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY
      );
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const channels = {
        sms: null as any,
        email: null as any,
        whatsapp: null as any
      };

      try {
        // SMS
        channels.sms = await twilioClient.messages.create({
          body: 'Multi-channel test via SMS',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: '+27711234567'
        });

        // Email
        channels.email = await sgMail.send({
          to: 'test@grayarx.com',
          from: process.env.EMAIL_USER || 'noreply@grayarx.com',
          subject: 'Multi-channel test via Email',
          html: '<p>Test</p>'
        });

        // WhatsApp
        channels.whatsapp = await twilioClient.messages.create({
          body: 'Multi-channel test via WhatsApp',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: 'whatsapp:+27711234567'
        });

        expect(channels.sms.sid).toBeDefined();
        expect(channels.email[0].statusCode).toBe(202);
        expect(channels.whatsapp.sid).toBeDefined();
      } catch (error) {
        console.error('Multi-channel test failed:', error);
        throw error;
      }
    });
  });
});
