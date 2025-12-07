// API client for sending statistics to admin panel

interface StatisticsRequest {
    featureName: string;
    username?: string;
}

interface StatisticsResponse {
    success: boolean;
    message?: string;
    error?: string;
}

const ADMIN_PANEL_URL = process.env.NEXT_PUBLIC_ADMIN_URL; 
const API_KEY = process.env.TOKEN_SECRET;

if (!ADMIN_PANEL_URL) {
    // Statistics tracking will be disabled if not set
}

export async function sendStatisticsToAdminPanel(data: StatisticsRequest): Promise<StatisticsResponse> {
    if (!ADMIN_PANEL_URL) {
        return { success: false, error: 'Admin panel URL not configured' };
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (API_KEY) {
            headers['x-api-key'] = API_KEY;
        }

        // const url = `${ADMIN_PANEL_URL.replace(/\/admin$/, '')}/api/statistics/increment`;
        const url = `${ADMIN_PANEL_URL}/api/statistics/increment`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            return { success: false, error: `Invalid response format. Expected JSON but got HTML. This usually means the API endpoint was not found.` };
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            return { success: false, error: result.error || 'API request failed' };
        }

        return result;
    } catch (error) {
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            return { success: false, error: 'Server returned invalid JSON response' };
        }
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return { success: false, error: 'Cannot connect to admin panel - please check if it\'s running' };
        }
        
        if (error instanceof DOMException && error.name === 'AbortError') {
            return { success: false, error: 'Request timeout - admin panel response too slow' };
        }
        
        return { success: false, error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

// Helper function to maintain compatibility with existing code
export async function incrementStatisticsFeature(featureName: string, username: string = 'anonymous') {
    return await sendStatisticsToAdminPanel({ featureName, username });
}

// Helper functions for common use cases
export async function trackUserLogin(username: string) {
    return sendStatisticsToAdminPanel({ featureName: 'login', username });
}

export async function trackPageVisit(username: string) {
    return sendStatisticsToAdminPanel({ featureName: 'page_visit', username });
}

export async function trackFeatureUsage(featureName: string, username?: string) {
    return sendStatisticsToAdminPanel({ featureName, username });
}

// React hook for easy component usage
export const useStatisticsTracking = () => {
    const trackEvent = async (featureName: string, username?: string) => {
        try {
            const result = await sendStatisticsToAdminPanel({ featureName, username });
            if (!result.success) {
                // Optionally handle tracking failure
            }
        } catch (error) {
            // Optionally handle error
        }
    };

    return { trackEvent };
};
