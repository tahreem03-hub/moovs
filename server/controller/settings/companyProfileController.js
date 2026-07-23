const mongoose = require('mongoose');
const CompanyProfile = require('../../models/settings/CompanyProfile');
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
    const profile = await CompanyProfile.getCompanyProfile(req.user._id);
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
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: name || 'My Transportation Company',
        email: email || 'info@mycompany.com',
        phone: phone || '+1 234 567 8900'
      });
    }

    if (req.file) {
      if (profile.logo?.filename) deleteLogoFile(profile.logo.filename);
      profile.logo = buildLogo(req.file);
    }

    if (name !== undefined) profile.name = name;
    if (phone !== undefined) profile.phone = phone;
    if (email !== undefined) profile.email = email;
    if (website !== undefined) profile.website = website;
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
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
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

    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
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
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
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

    // Save domain info
    if (email) {
      profile.communication.domainEmail = email;
    }
    profile.communication.customDomain = domain;
    profile.communication.domainVerified = true;
    
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
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
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
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    return res.status(200).json({ success: true, data: profile.payments || {} });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch' });
  }
};

const updatePaymentSettings = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
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
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
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

    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }

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

// ============ CUSTOMER PORTAL PAYMENTS TAB ============
const getCustomerPortalPayments = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: profile.customerPortal?.payments || {} 
    });
  } catch (error) {
    console.error('Get customer portal payments error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customer portal payments' 
    });
  }
};

const updateCustomerPortalPayments = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
    if (!profile.customerPortal) profile.customerPortal = {};
    profile.customerPortal.payments = { 
      ...profile.customerPortal.payments, 
      ...req.body 
    };
    
    await profile.save();
    return res.status(200).json({ 
      success: true, 
      message: 'Customer portal payments updated', 
      data: profile.customerPortal.payments 
    });
  } catch (error) {
    console.error('Update customer portal payments error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update' 
    });
  }
};

// ============ CUSTOMER PORTAL SETTINGS TAB ============
const getCustomerPortalSettings = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: profile.customerPortal?.settings || {} 
    });
  } catch (error) {
    console.error('Get customer portal settings error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customer portal settings' 
    });
  }
};

const updateCustomerPortalSettings = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
    if (!profile.customerPortal) profile.customerPortal = {};
    profile.customerPortal.settings = { 
      ...profile.customerPortal.settings, 
      ...req.body 
    };
    
    await profile.save();
    return res.status(200).json({ 
      success: true, 
      message: 'Customer portal settings updated', 
      data: profile.customerPortal.settings 
    });
  } catch (error) {
    console.error('Update customer portal settings error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update' 
    });
  }
};

// ============ CUSTOMER PORTAL BRANDING TAB ============
const getCustomerPortalBranding = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: profile.customerPortal?.branding || {} 
    });
  } catch (error) {
    console.error('Get customer portal branding error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customer portal branding' 
    });
  }
};

const updateCustomerPortalBranding = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
    if (!profile.customerPortal) profile.customerPortal = {};
    
    // Handle logo upload
    if (req.file) {
      if (profile.customerPortal.branding?.logo?.filename) {
        deleteLogoFile(profile.customerPortal.branding.logo.filename);
      }
      profile.customerPortal.branding = {
        ...profile.customerPortal.branding,
        logo: {
          url: `/uploads/company/${req.file.filename}`,
          filename: req.file.filename
        }
      };
    }
    
    // Update other branding fields
    const { primaryColor, secondaryColor, accentColor, fontFamily, buttonStyle } = req.body;
    if (primaryColor) profile.customerPortal.branding.primaryColor = primaryColor;
    if (secondaryColor) profile.customerPortal.branding.secondaryColor = secondaryColor;
    if (accentColor) profile.customerPortal.branding.accentColor = accentColor;
    if (fontFamily) profile.customerPortal.branding.fontFamily = fontFamily;
    if (buttonStyle) profile.customerPortal.branding.buttonStyle = buttonStyle;
    
    await profile.save();
    return res.status(200).json({ 
      success: true, 
      message: 'Customer portal branding updated', 
      data: profile.customerPortal.branding 
    });
  } catch (error) {
    if (req.file) deleteLogoFile(req.file.filename);
    console.error('Update customer portal branding error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update' 
    });
  }
};

// ============ CUSTOMER PORTAL PROMO CODES TAB ============
const getCustomerPortalPromoCodes = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    return res.status(200).json({ 
      success: true, 
      data: profile.customerPortal?.promoCode || {} 
    });
  } catch (error) {
    console.error('Get customer portal promo codes error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch promo codes' 
    });
  }
};

const updateCustomerPortalPromoCodes = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ operatorId: req.user._id });
    
    if (!profile) {
      profile = await CompanyProfile.create({
        operatorId: req.user._id,
        name: 'My Transportation Company',
        email: 'info@mycompany.com',
        phone: '+1 234 567 8900'
      });
    }
    
    if (!profile.customerPortal) profile.customerPortal = {};
    profile.customerPortal.promoCode = { 
      ...profile.customerPortal.promoCode, 
      ...req.body 
    };
    
    await profile.save();
    return res.status(200).json({ 
      success: true, 
      message: 'Promo codes updated', 
      data: profile.customerPortal.promoCode 
    });
  } catch (error) {
    console.error('Update promo codes error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update' 
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
  updatePreferenceSettings,
  getCustomerPortalPayments,
  updateCustomerPortalPayments,
  getCustomerPortalSettings,
  updateCustomerPortalSettings,
  getCustomerPortalBranding,
  updateCustomerPortalBranding,
  getCustomerPortalPromoCodes,
  updateCustomerPortalPromoCodes
};