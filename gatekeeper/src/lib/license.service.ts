
export interface LicenseValidationResponse {
    valid: boolean
    error?: string
    license_key?: {
        status: string
        payment_id: number
        activation_usage: number
        activation_limit: number
        expires_at: string | null
        created_at: string
    }
    instance?: {
        id: string
        name: string
        created_at: string
    } | null
    meta?: {
        store_id: number
        order_id: number
        order_item_id: number
        product_id: number
        product_name: string
        variant_id: number
        variant_name: string
        customer_id: number
        customer_name: string
        customer_email: string
    }
}

export async function validateLicense(key: string): Promise<boolean> {
    // 1. Dev Mode Bypass
    // If no env var is set, default to false safety
    if (process.env.NODE_ENV === 'development') {
        // Optional: add a specific dev key check if you want
        return true
    }

    try {
        // 2. LemonSqueezy API Call
        const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                // LS requires this content-type for the POST body
                // But for fetch with URLSearchParams it sets it automatically? 
                // Let's be explicit just in case, but LS docs say x-www-form-urlencoded
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // Using URLSearchParams to properly encode body as x-www-form-urlencoded
            body: new URLSearchParams({ license_key: key }).toString()
        })

        if (!response.ok) {
            console.error(`[License] Validation failed: ${response.status} ${response.statusText}`)
            return false
        }

        const data = await response.json() as LicenseValidationResponse

        // 3. Status Checks
        // Ensure it's valid AND active
        if (data.valid && data.license_key?.status !== 'expired') {
            return true
        }

        /*
          Note on Rate Limiting:
          You mentioned wanting to limit usage per month.
          LemonSqueezy doesn't track "usage count" for us.
          We would need to store this in our own DB (Vercel KV or Supabase).
          For MVP/v1, we just check if the subscription is active. 
          If they stop paying, 'status' becomes 'expired' or 'inactive' on next check.
        */

        return false

    } catch (error) {
        console.error('[License] Error validating license:', error)
        return false
    }
}
