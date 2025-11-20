'use client';

import { getCookie } from './token';

// Interface for group translation data from auth_gate
interface GroupTranslation {
  name: string;
  titleEn: string;
  titleAr: string;
}

interface GroupTranslationsResponse {
  groups: string[];
  groupTitles?: {
    en: Record<string, string>;
    ar: Record<string, string>;
  };
}

/**
 * Fetches group title translations from auth_gate securely using access token
 * This function is careful not to interfere with ArcGIS authentication
 */
export async function fetchGroupTranslationsFromAuthGate(): Promise<{
  success: boolean;
  translations?: {
    en: Record<string, string>;
    ar: Record<string, string>;
  };
  error?: string;
}> {
  try {
    // Get access token from cookies (same as the authentication hook does)
    const accessToken = getCookie('access_token');
    
    if (!accessToken) {
      console.warn('No access token available for fetching group translations');
      return { success: false, error: 'No access token' };
    }

    // Get auth_gate URL from environment
    const authGateUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    if (!authGateUrl) {
      console.warn('AUTH_URL not configured for group translations');
      return { success: false, error: 'AUTH_URL not configured' };
    }

    // Construct the API endpoint URL
    const apiUrl = `${authGateUrl}/api/user/groups`;

    // Make secure request to auth_gate with access token
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include cookies for authentication
        'Cookie': `access_token=${accessToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to fetch group translations: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data: GroupTranslationsResponse = await response.json();
    
    // Check if we have group titles in the response
    if (data.groupTitles && data.groupTitles.en && data.groupTitles.ar) {
      console.log('Successfully fetched group translations from auth_gate');
      return {
        success: true,
        translations: data.groupTitles
      };
    } else {
      console.log('No group title translations available in auth_gate response');
      return { success: false, error: 'No translations in response' };
    }

  } catch (error) {
    console.error('Error fetching group translations from auth_gate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets a translated group title, with fallback to original group name
 * @param groupName - The group name (e.g., "gportal_Data" or "Data")
 * @param language - The language code ('en' or 'ar')
 * @param translations - The translations object from state
 * @returns The translated title or the cleaned group name as fallback
 */
export function getTranslatedGroupTitle(
  groupName: string,
  language: 'en' | 'ar',
  translations?: {
    en: Record<string, string>;
    ar: Record<string, string>;
  }
): string {
  if (!translations || !translations[language]) {
    // Fallback: clean the group name by removing gportal_ prefix
    return groupName.replace(/^gportal_/, '');
  }

  // Try to find translation for the group name (with and without gportal_ prefix)
  const cleanGroupName = groupName.replace(/^gportal_/, '');
  const translation = translations[language][cleanGroupName] || translations[language][groupName];
  
  if (translation) {
    return translation;
  }

  // Fallback to cleaned group name
  return cleanGroupName;
}
