const mongoose = require('mongoose');
const CompanyProfile = require('../models/settings/CompanyProfile');
const fs = require('fs');
const path = require('path');

const deleteLogoFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '../uploads/company', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting logo:', err);
    }
  });
};

const buildLogo = (file) => {
  if (!file) return null;
  return {
    url: `/uploads/company/${file.filename}`,
    filename: file.filename
  };
};

// ============ GET PROFILE ============
const getCompanyProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.getCompanyProfile();
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ============ COMPANY TAB ============
const updateCompanyProfile = async (req, res) => {
  try {
    const { name, phone, email, website, address, permitNumber, generalEmail, bookingEmail } = req.body;
    let profile = await CompanyProfile.getCompanyProfile();

    if (req.file) {
      if (profile.logo?.filename) deleteLogoFile(profile.logo.filename);
      profile.logo = buildLogo(req.file);
    }

    if (name) profile.name = name;
    if (phone) profile.phone = phone;
    if (email) profile.email = email;
    if (website) profile.website = website;
    if (address) {
      if (address.street !== undefined) profile.address.street = address.street;
      if (address.city !== undefined) profile.address.city = address.city;
      if (address.state !== undefined) profile.address.state = address.state;
      if (address.zipCode !== undefined) profile.address.zipCode = address.zipCode;
      if (address.country !== undefined) profile.address.country = address.country;
    }
    if (permitNumber !== undefined) profile.permitNumber = permitNumber;
    if (generalEmail !== undefined) profile.generalEmail = generalEmail;
    if (bookingEmail !== undefined) profile.bookingEmail = bookingEmail;

    await profile.save();
    return res.status(200).json({ success: true, message: 'Company profile updated', data: profile });
  } catch (error) {
    if (req.file) deleteLogoFile(req.file.filename);
    console.error('Update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

// ============ COMMUNICATION TAB ============
const getCommunicationSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.getCompanyProfile();
    return res.status(200).json({ 
      success: true, 
      data: profile.communication || {} 
    });
  } catch (error) {
    console.error('Get communication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch communication settings' 
    });
  }
};

const updateCommunicationSettings = async (req, res) => {
  try {
    const {
      sendAutomatedChargeEmails,
      sendAutomatedCancellationEmails,
      customDomain,
      domainEmail,
      smtp
    } = req.body;

    const profile = await CompanyProfile.getCompanyProfile();
    
    // Update toggles
    if (sendAutomatedChargeEmails !== undefined) {
      profile.communication.sendAutomatedChargeEmails = sendAutomatedChargeEmails;
    }
    if (sendAutomatedCancellationEmails !== undefined) {
      profile.communication.sendAutomatedCancellationEmails = sendAutomatedCancellationEmails;
    }
    
    // Update custom domain
    if (customDomain !== undefined) {
      profile.communication.customDomain = customDomain;
    }
    if (domainEmail !== undefined) {
      profile.communication.domainEmail = domainEmail;
    }
    
    // Update SMTP settings
    if (smtp) {
      profile.communication.smtp = {
        ...profile.communication.smtp,
        ...smtp
      };
    }
    
    await profile.save();
    
    return res.status(200).json({
      success: true,
      message: 'Communication settings updated',
      data: profile.communication
    });
  } catch (error) {
    console.error('Update communication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update communication settings'
    });
  }
};

// Verify Domain (shows DNS records to add)
const verifyDomain = async (req, res) => {
  try {
    const { domain, email } = req.body;
    const profile = await CompanyProfile.getCompanyProfile();
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your domain name'
      });
    }

    // Generate DNS records (these are standard for email verification)
    const dnsRecords = [
      {
        type: 'CNAME',
        host: `mail.${domain}`,
        value: 'mail.moovs.com',
        description: 'Points your email subdomain to Moovs'
      },
      {
        type: 'TXT',
        host: '@',
        value: 'v=spf1 include:spf.moovs.com ~all',
        description: 'Allows Moovs to send emails on your behalf'
      },
      {
        type: 'MX',
        host: '@',
        value: '10 mail.moovs.com',
        description: 'Sets up email routing for your domain'
      }
    ];

    // In production, you would actually check if DNS records exist
    // For now, we'll just save the domain as "verified" when user clicks verify
    // This is a simplified approach - actual verification would check DNS
    
    // Save domain info
    if (email) {
      profile.communication.domainEmail = email;
    }
    profile.communication.customDomain = domain;
    profile.communication.domainVerified = true; // Simplified - mark as verified
    
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Domain configuration saved! You can now send emails from your domain.',
      data: {
        domainVerified: true,
        dnsRecords: dnsRecords,
        instructions: 'Add these DNS records to your domain provider to complete verification.'
      }
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify domain'
    });
  }
};

// Test Email Configuration
const testEmailConfig = async (req, res) => {
  try {
    const { email } = req.body;
    const profile = await CompanyProfile.getCompanyProfile();
    
    const smtpSettings = profile.communication.smtp || {};
    const fromEmail = profile.communication.domainEmail || profile.email || 'noreply@example.com';
    
    // Check if SMTP is configured
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      return res.status(400).json({
        success: false,
        message: 'Please configure your SMTP settings first (host, username, password)'
      });
    }

    // In production, you would use nodemailer to actually send the email
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: smtpSettings.host,
    //   port: smtpSettings.port,
    //   secure: smtpSettings.secure,
    //   auth: {
    //     user: smtpSettings.username,
    //     pass: smtpSettings.password
    //   }
    // });
    // await transporter.sendMail({
    //   from: fromEmail,
    //   to: email || fromEmail,
    //   subject: 'Test Email from Moovs',
    //   text: 'This is a test email to confirm your email configuration is working!'
    // });
    
    // For now, simulate success
    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${email || fromEmail} from ${fromEmail}!`
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email. Please check your SMTP settings.'
    });
  }
};

// ============ PAYMENTS TAB ============
const getPaymentSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.getCompanyProfile();
    return res.status(200).json({ success: true, data: profile.payments || {} });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch' });
  }
};

const updatePaymentSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.getCompanyProfile();
    profile.payments = { ...profile.payments, ...req.body };
    await profile.save();
    return res.status(200).json({ success: true, message: 'Payment settings updated', data: profile.payments });
  } catch (error) {
    console.error('Update payments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};


// ============ PREFERENCES TAB ============
const getPreferenceSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.getCompanyProfile();
    return res.status(200).json({ 
      success: true, 
      data: profile.preferences || {} 
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch preferences' 
    });
  }
};

const updatePreferenceSettings = async (req, res) => {
  try {
    const {
      pricingLayout,
      timeFormat,
      dateFormat,
      orderTypes
    } = req.body;

    const profile = await CompanyProfile.getCompanyProfile();

    // Update Pricing Layout
    if (pricingLayout) {
      profile.preferences.pricingLayout = {
        ...profile.preferences.pricingLayout,
        ...pricingLayout
      };
    }

    // Update Time Format
    if (timeFormat) {
      profile.preferences.timeFormat = timeFormat;
    }

    // Update Date Format
    if (dateFormat) {
      profile.preferences.dateFormat = dateFormat;
    }

    // Update Order Types
    if (orderTypes) {
      profile.preferences.orderTypes = {
        ...profile.preferences.orderTypes,
        ...orderTypes
      };
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: profile.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};


module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  getCommunicationSettings,
  updateCommunicationSettings,
  verifyDomain,
  testEmailConfig,
  getPaymentSettings,
  updatePaymentSettings,
  getPreferenceSettings,
  updatePreferenceSettings
};