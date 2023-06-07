import { createClient } from '@sanity/client'

export const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '84f40ybm'
export const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
export const apiVersion = '2023-01-01'

export const client = createClient({ projectId, dataset, apiVersion, useCdn: true })
