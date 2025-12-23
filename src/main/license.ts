import { log } from './logger'
import { getSettings, saveSettings } from './db'

const LEMONSQUEEZY_API = 'https://api.lemonsqueezy.com/v1'

interface LicenseValidation {
    valid: boolean
    license_key?: {
        status: string
        activation_limit: number
        activation_usage: number
    }
}

export async function validateLicenseKey(licenseKey: string): Promise<boolean> {
    try {
        log('INFO', 'Validating license key...')

        // Development mode bypass via environment variable
        const devKey = process.env.DEV_LICENSE_KEY
        if (process.env.NODE_ENV === 'development' && devKey && licenseKey === devKey) {
            log('WARN', 'Development license key accepted (dev mode only)')
            await saveSettings({ licenseStatus: 'active', licenseKey })
            return true
        }

        // LemonSqueezy API validation
        const response = await fetch(`${LEMONSQUEEZY_API}/licenses/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                license_key: licenseKey
            })
        })

        if (!response.ok) {
            log('WARN', `License validation failed: HTTP ${response.status}`)
            await saveSettings({ licenseStatus: 'invalid' })
            return false
        }

        const data = await response.json() as LicenseValidation

        if (data.valid) {
            log('INFO', 'License key validated successfully')
            await saveSettings({ licenseStatus: 'active', licenseKey })
            return true
        } else {
            log('WARN', 'License key is invalid')
            await saveSettings({ licenseStatus: 'invalid' })
            return false
        }

    } catch (error) {
        log('ERROR', `License validation error: ${error}`)
        // On network error, check cached status
        const settings = await getSettings()
        return settings.licenseStatus === 'active'
    }
}

export async function getLicenseStatus(): Promise<boolean> {
    const settings = await getSettings()
    return settings.licenseStatus === 'active'
}

export async function checkLicenseOnStartup(): Promise<boolean> {
    const settings = await getSettings()

    if (settings.licenseStatus !== 'active') {
        log('WARN', 'No valid license found (or expired)')
        return false
    }

    // Optional: Background re-validation could happen here
    log('INFO', 'License status: Active (cached)')
    return true
}
