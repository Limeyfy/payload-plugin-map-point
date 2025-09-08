import path from 'node:path'
import type { Plugin } from 'payload'
import type { MapPointPluginOptions } from './types'

type AnyField = Record<string, any>

const isPointField = (field: AnyField) => field?.type === 'point'

const withMapPointAdmin = (field: AnyField, opts?: MapPointPluginOptions): AnyField => {
  const adminComponentPath = path.resolve(__dirname, './admin/MapPointField.js')

  const admin = field.admin || {}
  const components = { ...(admin.components || {}), Field: adminComponentPath }
  const mapPoint = {
    defaultCenter: opts?.defaultCenter,
    defaultZoom: opts?.defaultZoom,
    geocoder: opts?.geocoder,
    // allow per-field overrides if already set
    ...(admin.mapPoint || {}),
  }

  return {
    ...field,
    admin: {
      ...admin,
      components,
      mapPoint,
    },
  }
}

const recurseFields = (fields: AnyField[], opts?: MapPointPluginOptions): AnyField[] => {
  return fields.map((f) => {
    let field = { ...f }

    if (isPointField(field)) {
      field = withMapPointAdmin(field, opts)
    }

    // Recurse into nested structures
    if (Array.isArray(field.fields)) {
      field = { ...field, fields: recurseFields(field.fields, opts) }
    }
    if (Array.isArray(field.blocks)) {
      field = {
        ...field,
        blocks: field.blocks.map((b: AnyField) => ({ ...b, fields: recurseFields(b.fields || [], opts) })),
      }
    }
    if (Array.isArray(field.tabs)) {
      field = {
        ...field,
        tabs: field.tabs.map((t: AnyField) => ({ ...t, fields: recurseFields(t.fields || [], opts) })),
      }
    }
    if (Array.isArray(field.rows)) {
      field = {
        ...field,
        rows: field.rows.map((row: AnyField) => ({ ...row, fields: recurseFields(row.fields || [], opts) })),
      }
    }

    return field
  })
}

export const mapPointPlugin: (options?: MapPointPluginOptions) => Plugin = (options) => (incomingConfig) => {
  const config = { ...incomingConfig }

  if (Array.isArray((config as any).collections)) {
    ;(config as any).collections = ((config as any).collections as any[]).map((col: any) => ({
      ...col,
      fields: recurseFields(col.fields || [], options),
    })) as any
  }

  if (Array.isArray((config as any).globals)) {
    ;(config as any).globals = ((config as any).globals as any[]).map((g: any) => ({
      ...g,
      fields: recurseFields(g.fields || [], options),
    })) as any
  }

  return config
}

export default mapPointPlugin
