export const SITE_TITLE = 'CodePro.io - Job-Focused Tech Training';
export const SITE_TAGLINE = 'Master the code, Become a pro';
export const INSTITUTE_NAME = 'CodePro.io';

export const CONTACT_PHONE = '+91 91762 41244';
export const CONTACT_EMAIL = 'humairasiraj0985@gmail.com';
export const ADDRESS_PLACEHOLDER = 'Madambakkam, Chennai, Tamil Nadu, India';

export const SITE_URL = 'http://localhost:3000';
export const DEFAULT_META_DESCRIPTION = 'CodePro.io - Master the code, Become a pro';

export const SOCIAL_FACEBOOK_URL = 'https://facebook.com/';
export const SOCIAL_INSTAGRAM_URL = 'https://instagram.com/';
export const SOCIAL_YOUTUBE_URL = 'https://youtube.com/';
export const SOCIAL_LINKEDIN_URL = 'https://linkedin.com/';

export const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Madambakkam%2C%20Chennai%2C%20Tamil%20Nadu%2C%20India';
export const WHATSAPP_URL = 'https://wa.me/919176241244';
export const BROCHURE_PDF_URL = '';

export const WORKING_HOURS = '9:00 AM - 6:00 PM IST, Monday to Saturday';

export const PROMO_TEXT = '';

// Live data overlay: fetches from backend API and falls back to static consts above
import { getContactInfo } from '../lib/api';

export async function getLiveConsts() {
  const info = await getContactInfo();
  if (!info) {
    return {
      INSTITUTE_NAME,
      CONTACT_PHONE,
      CONTACT_EMAIL,
      ADDRESS_PLACEHOLDER,
      GOOGLE_MAPS_URL,
      WHATSAPP_URL,
      SOCIAL_INSTAGRAM_URL,
      SOCIAL_FACEBOOK_URL,
      SOCIAL_YOUTUBE_URL,
      SOCIAL_LINKEDIN_URL,
      WORKING_HOURS,
      BROCHURE_PDF_URL,
      PROMO_TEXT,
      SITE_TAGLINE,
      DEFAULT_META_DESCRIPTION,
    };
  }
  return {
    INSTITUTE_NAME: info.institute_name || INSTITUTE_NAME,
    CONTACT_PHONE: info.phone || CONTACT_PHONE,
    CONTACT_EMAIL: info.email || CONTACT_EMAIL,
    ADDRESS_PLACEHOLDER: info.address || ADDRESS_PLACEHOLDER,
    GOOGLE_MAPS_URL: info.google_maps_url || GOOGLE_MAPS_URL,
    WHATSAPP_URL: info.whatsapp_url || WHATSAPP_URL,
    SOCIAL_INSTAGRAM_URL: info.instagram_url || SOCIAL_INSTAGRAM_URL,
    SOCIAL_FACEBOOK_URL: info.facebook_url || SOCIAL_FACEBOOK_URL,
    SOCIAL_YOUTUBE_URL: info.youtube_url || SOCIAL_YOUTUBE_URL,
    SOCIAL_LINKEDIN_URL: info.linkedin_url || SOCIAL_LINKEDIN_URL,
    WORKING_HOURS: info.working_hours || WORKING_HOURS,
    BROCHURE_PDF_URL: info.brochure_pdf_url || BROCHURE_PDF_URL,
    PROMO_TEXT: info.promo_text || PROMO_TEXT,
    SITE_TAGLINE: info.site_tagline || SITE_TAGLINE,
    DEFAULT_META_DESCRIPTION: info.institute_name
      ? `${info.institute_name} - ${info.site_tagline || SITE_TAGLINE}`
      : DEFAULT_META_DESCRIPTION,
  };
}
