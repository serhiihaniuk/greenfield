import { z } from "zod"

export type SerializableValue =
  | null
  | string
  | number
  | boolean
  | SerializableValue[]
  | { [key: string]: SerializableValue }

export type SerializableRecord = Record<string, SerializableValue>

export const serializableValueSchema: z.ZodType<SerializableValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.array(serializableValueSchema),
    z.record(z.string(), serializableValueSchema),
  ])
)

export const serializableRecordSchema = z.record(
  z.string(),
  serializableValueSchema
)

export function isSerializableRecord(
  value: unknown
): value is SerializableRecord {
  return serializableRecordSchema.safeParse(value).success
}
