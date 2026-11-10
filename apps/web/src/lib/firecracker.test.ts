import { describe, expect, it } from "vitest"
import { evaluate } from "./firecracker"

describe("firecracker formula", () => {
  it("produces 大地春雷 at the classic ratio", () => {
    expect(evaluate({ saltpeter: 6, sulfur: 2, charcoal: 2 }).title).toBe("大地春雷")
  })

  it("duds when the total is too small", () => {
    expect(evaluate({ saltpeter: 3, sulfur: 1, charcoal: 1 }).title).toBe("哑炮")
  })

  it("blows up the stove when overloaded", () => {
    expect(evaluate({ saltpeter: 8, sulfur: 4, charcoal: 3 }).title).toBe("炸灶台")
  })

  it("half-fires on an off ratio", () => {
    expect(evaluate({ saltpeter: 4, sulfur: 2, charcoal: 2 }).title).toBe("半响")
  })
})
