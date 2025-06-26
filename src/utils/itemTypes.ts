export const ItemTypes = {
    TASK: "task",
    COLUMN: "column",
  } as const
  
  export type ItemType = (typeof ItemTypes)[keyof typeof ItemTypes]
  