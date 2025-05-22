"use server";

import { Client } from "pg";

/**
 * Increments the count for the specified feature in the gportal_statistics table.
 * If there is no row for the feature, it will insert a new row with count = 1.
 * @param featureName The name of the feature to increment.
 */
export async function incrementStatisticsFeature(featureName: string) {
    // List of allowed feature names to prevent SQL injection
    const allowedFeatures = [
        "page_visit",
        "layer_added",
        "layer_uploaded",
        "layer_exported",
        "attribute_query_performed",
        "spatial_query_performed",
        "distance_measured",
        "area_measured",
        "bookmark_added",
        "coordinates_converted",
        "print_initiated",
        "view_3d_enabled",
        "view_dual_enabled",
        "directions_performed",
        "closest_facility_performed",
    ];

    if (!allowedFeatures.includes(featureName)) {
        return { success: false, message: "Invalid feature name." };
    }

    try {
        const client = new Client({
            user: process.env.NEXT_PUBLIC_DB_USER,
            host: process.env.NEXT_PUBLIC_DB_HOST,
            database: process.env.NEXT_PUBLIC_DB_NAME,
            password: process.env.NEXT_PUBLIC_DB_PASSWORD,
            port: parseInt(process.env.PG_PORT || '5432'),
        });

        await client.connect();

        // Try to update the row for this feature, or insert if none exists
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

        await client.end();
        return { success: true, message: `Incremented ${featureName}` };
    } catch (error) {
        console.error("Increment failed:", error);
        return { success: false, message: "Increment failed", error: error };
    }
}

// --- TEMPORARY: List all rows in gportal_statistics ---
export async function listAllStatisticsRows() {
    try {
        const client = new Client({
            user: process.env.NEXT_PUBLIC_DB_USER,
            host: process.env.NEXT_PUBLIC_DB_HOST,
            database: process.env.NEXT_PUBLIC_DB_NAME,
            password: process.env.NEXT_PUBLIC_DB_PASSWORD,
            port: parseInt(process.env.PG_PORT || '5432'),
        });

        await client.connect();

        const result = await client.query(`SELECT * FROM gportal_statistics ORDER BY id`);
        await client.end();

        return { success: true, rows: result.rows };
    } catch (error) {
        console.error("List failed:", error);
        return { success: false, message: "List failed", error: error };
    }
}
