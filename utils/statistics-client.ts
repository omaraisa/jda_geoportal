
interface IncrementStatisticsOptions {
    featureName: string;
    username?: string;
    adminPanelUrl?: string; // e.g., 'http://localhost:3103' or your production URL
    apiKey?: string; // API key for authentication (required for secure connections)
}

interface IncrementStatisticsResponse {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Increment feature statistics via the admin panel API
 * @param options - Configuration object with featureName, username, adminPanelUrl, and apiKey
 * @returns Promise with the API response
 */
export async function incrementStatisticsFeature(
    options: IncrementStatisticsOptions
): Promise<IncrementStatisticsResponse> {
    const { 
        featureName, 
        username, 
        adminPanelUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3103',
        apiKey = process.env.TOKEN_SECRET
    } = options;

    // Debug logging for environment variables
    console.log('🔍 Statistics API Debug Info:', {
        originalAdminPanelUrl: adminPanelUrl,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        envVars: {
            NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
            TOKEN_SECRET: process.env.TOKEN_SECRET ? 'SET' : 'NOT_SET'
        }
    });

    // Validate required parameters
    if (!featureName || featureName.trim() === '') {
        return {
            success: false,
            message: 'Feature name is required',
            error: 'INVALID_FEATURE_NAME'
        };
    }

    // Check if API key is available
    if (!apiKey) {
        console.error('❌ No API key available for statistics tracking!', {
            NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
        });
        return {
            success: false,
            message: 'API key not configured',
            error: 'MISSING_API_KEY'
        };
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if API key is provided
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
            console.log('🔐 Authorization header added with API key');
        } else {
            console.error('❌ No API key available for authorization header');
        }

        // Ensure URL doesn't have double slashes and construct correct API endpoint
        // If adminPanelUrl contains /admin, we need the base URL for the API
        const baseUrl = adminPanelUrl.replace(/\/admin$/, '').replace(/\/$/, '');
        const cleanUrl = `${baseUrl}/api/statistics/increment`;
        
        console.log('📡 Making request to:', cleanUrl);
        console.log('📋 Request headers:', Object.keys(headers));

        const response = await fetch(cleanUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                featureName: featureName.trim(),
                username: username?.trim() || 'anonymous'
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const data: IncrementStatisticsResponse = await response.json();

        console.log('📊 Response status:', response.status);
        console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('📄 Response body:', data);

        if (!response.ok) {
            console.log('❌ API request failed with status:', response.status);
            console.log('❌ Error details:', data);
            
            // Handle specific error cases
            if (response.status === 401) {
                throw new Error('Authentication failed - Invalid or missing API key');
            } else if (response.status === 400) {
                throw new Error(data.message || 'Bad request - Invalid parameters');
            } else if (response.status >= 500) {
                throw new Error('Server error - Statistics service temporarily unavailable');
            } else {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
        }

        console.log('✅ Statistics tracking successful');
        return data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log different error types appropriately
        if (errorMessage.includes('Authentication failed')) {
            console.error('Statistics API authentication error:', errorMessage);
        } else if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
            console.error('Statistics API timeout:', errorMessage);
        } else {
            console.error('Failed to increment statistics:', errorMessage);
        }

        return {
            success: false,
            message: 'Failed to increment statistics',
            error: errorMessage
        };
    }
}

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use incrementStatisticsFeature with options object instead
 */
export async function incrementStatistics(
    featureName: string, 
    username?: string,
    adminPanelUrl?: string
): Promise<IncrementStatisticsResponse> {
    return incrementStatisticsFeature({
        featureName,
        username,
        adminPanelUrl
    });
}

// Export types for TypeScript projects
export type { IncrementStatisticsOptions, IncrementStatisticsResponse };
