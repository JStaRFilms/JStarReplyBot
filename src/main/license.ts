import { log } from './logger'
import { getLicenseStatus as getDbLicenseStatus, setLicenseStatus } from './db'

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

        // Development mode bypass via environment variable (NEVER ship with this set)
        const devKey = process.env.DEV_LICENSE_KEY
        if (process.env.NODE_ENV === 'development' && devKey && licenseKey === devKey) {
            log('WARN', 'Development license key accepted (dev mode only)')
            await setLicenseStatus(true)
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
            await setLicenseStatus(false)
            return false
        }

        const data = await response.json() as LicenseValidation

        if (data.valid) {
            log('INFO', 'License key validated successfully')
            await setLicenseStatus(true)
            return true
        } else {
            log('WARN', 'License key is invalid')
            await setLicenseStatus(false)
            return false
        }

    } catch (error) {
        log('ERROR', `License validation error: ${error}`)
        // On network error, check cached status
        return await getDbLicenseStatus()
    }
}

export async function getLicenseStatus(): Promise<boolean> {
    return await getDbLicenseStatus()
}

export async function checkLicenseOnStartup(): Promise<boolean> {
    const cachedStatus = await getDbLicenseStatus()

    if (!cachedStatus) {
        log('WARN', 'No valid license found')
        return false
    }

    // Re-validate periodically (could be done on a timer)
    log('INFO', 'License status: Active (cached)')
    return true
}
