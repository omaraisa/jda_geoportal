"use server";

import { Client } from "pg";

/**
 * Increments the count for the specified feature in both statistics tables:
 * - gportal_statistics (aggregated total counts)
 * - gportal_daily_statistics (individual timestamped entries)
 * @param featureName The name of the feature to increment.
 */
export async function incrementStatisticsFeature(featureName: string, username: string) {
  
    try {
        const client = new Client({
            user: process.env.NEXT_PUBLIC_DB_USER,
            host: process.env.NEXT_PUBLIC_DB_HOST,
            database: process.env.NEXT_PUBLIC_DB_NAME,
            password: process.env.NEXT_PUBLIC_DB_PASSWORD,
            port: parseInt(process.env.PG_PORT || '5432'),
        });

        await client.connect();

        // Store all features in daily statistics table
        await client.query(
            `INSERT INTO gportal_daily_statistics (feature_name, timestamp, username) 
             VALUES ($1, CURRENT_TIMESTAMP, $2)`,
            [featureName, username || 'anonymous']
        );
        
        // Only update aggregate counts for non-page_visit features
        if (featureName !== 'page_visit') {
            const updateResult = await client.query(
                `UPDATE gportal_statistics SET count = COALESCE(count,0) + 1 WHERE feature_name = $1`,
                [featureName]
            );

            if (updateResult.rowCount === 0) {
                // No row exists, insert a new one with count = 1
                await client.query(
                    `INSERT INTO gportal_statistics (feature_name, count) VALUES ($1, 1)`,
                    [featureName]
                );
            }
        }

        await client.end();
        return { success: true, message: `Incremented ${featureName}` };
    } catch (error) {
        console.error("Increment failed:", error);
        return { success: false, message: "Increment failed", error: error };
    }
}
